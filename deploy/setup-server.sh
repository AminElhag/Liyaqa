#!/bin/bash
# ===========================================
# Liyaqa Server Setup Script for DigitalOcean
# ===========================================
# Run this script on a fresh Ubuntu 22.04/24.04 Droplet
#
# Usage:
#   chmod +x setup-server.sh
#   sudo ./setup-server.sh

set -e

echo "========================================"
echo "  Liyaqa Server Setup Script"
echo "========================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo ./setup-server.sh)"
    exit 1
fi

# ===========================================
# 1. System Update
# ===========================================
echo ""
echo "[1/7] Updating system packages..."
apt-get update
apt-get upgrade -y

# ===========================================
# 2. Install Essential Tools
# ===========================================
echo ""
echo "[2/7] Installing essential tools..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw \
    fail2ban \
    htop \
    unzip \
    wget

# ===========================================
# 3. Install Docker
# ===========================================
echo ""
echo "[3/7] Installing Docker..."

# Remove old versions
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add current user to docker group (for non-root usage)
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker $SUDO_USER
    echo "Added $SUDO_USER to docker group"
fi

# Verify installation
docker --version
docker compose version

# ===========================================
# 4. Configure Firewall
# ===========================================
echo ""
echo "[4/7] Configuring firewall..."

ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

echo "Firewall configured: SSH, HTTP, HTTPS allowed"

# ===========================================
# 5. Configure Fail2Ban
# ===========================================
echo ""
echo "[5/7] Configuring Fail2Ban..."

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl restart fail2ban
systemctl enable fail2ban

# ===========================================
# 6. Create Application Directory
# ===========================================
echo ""
echo "[6/7] Creating application directory..."

mkdir -p /opt/liyaqa
mkdir -p /opt/liyaqa/nginx/conf.d
mkdir -p /opt/liyaqa/certbot/conf
mkdir -p /opt/liyaqa/certbot/www
mkdir -p /opt/liyaqa/backups

# Set permissions
if [ -n "$SUDO_USER" ]; then
    chown -R $SUDO_USER:$SUDO_USER /opt/liyaqa
fi

# ===========================================
# 7. Create Swap (for small droplets)
# ===========================================
echo ""
echo "[7/7] Configuring swap space..."

# Check if swap exists
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "2GB swap file created"
else
    echo "Swap already exists"
fi

# Configure swappiness
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.conf

# ===========================================
# Done!
# ===========================================
echo ""
echo "========================================"
echo "  Server Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Clone your repository:"
echo "     cd /opt/liyaqa"
echo "     git clone https://github.com/AminElhag/Liyaqa.git ."
echo ""
echo "  2. Copy environment file:"
echo "     cp deploy/.env.example .env"
echo "     nano .env  # Edit with your values"
echo ""
echo "  3. Copy deployment files:"
echo "     cp deploy/docker-compose.droplet.yml docker-compose.yml"
echo "     cp -r deploy/nginx/* nginx/"
echo ""
echo "  4. Start the application:"
echo "     docker compose up -d"
echo ""
echo "  5. (Optional) Setup SSL with Let's Encrypt:"
echo "     ./deploy/setup-ssl.sh your-domain.com your-email@example.com"
echo ""
echo "NOTE: Log out and log back in for docker group to take effect"
echo ""
