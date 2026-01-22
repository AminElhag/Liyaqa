# Local Network Testing - Subdomain Multi-Tenancy

This guide explains how to test subdomain-based multi-tenancy (e.g., `fitness-gym.liyaqa.local`) on your local network.

## Quick Start

### Option 1: Simple Testing (No DNS Setup)

Use the query parameter approach on localhost:

```bash
# Start backend
cd backend && ./gradlew bootRun

# Start frontend
cd frontend && npm run dev

# Test with subdomain parameter
http://localhost:3000/en/login?subdomain=fitness-gym
```

### Option 2: Full Subdomain Testing (Recommended)

## Step 1: Set Up Local DNS (macOS)

For wildcard subdomain support (`*.liyaqa.local`), install and configure dnsmasq:

```bash
# Install dnsmasq
brew install dnsmasq

# Configure dnsmasq for liyaqa.local
echo "address=/liyaqa.local/127.0.0.1" >> $(brew --prefix)/etc/dnsmasq.conf

# Start dnsmasq service
sudo brew services start dnsmasq

# Configure macOS to use dnsmasq for .local domains
sudo mkdir -p /etc/resolver
sudo bash -c 'echo "nameserver 127.0.0.1" > /etc/resolver/local'
```

### Verify DNS Setup

```bash
# Test DNS resolution
ping liyaqa.local
ping fitness-gym.liyaqa.local
ping any-subdomain.liyaqa.local
```

All should resolve to `127.0.0.1`.

## Step 2: Start Backend

```bash
cd backend
./run-local-network.sh
```

Or manually:

```bash
cd backend
LIYAQA_BASE_DOMAIN=liyaqa.local \
LIYAQA_DEV_HOSTS= \
CORS_ALLOWED_ORIGINS=http://liyaqa.local:3000 \
CORS_ALLOWED_ORIGIN_PATTERNS="http://*.liyaqa.local:3000" \
./gradlew bootRun
```

## Step 3: Start Frontend

```bash
cd frontend
npm run dev
```

The `.env.local` file is pre-configured with:
- `NEXT_PUBLIC_BASE_DOMAIN=liyaqa.local`
- `NEXT_PUBLIC_API_URL=http://liyaqa.local:8080`

## Step 4: Test

1. **Create a client via Platform Admin:**
   - Go to `http://liyaqa.local:3000/en/platform-login`
   - Login as platform admin
   - Create a new client with slug `fitness-gym`

2. **Access via subdomain:**
   - Go to `http://fitness-gym.liyaqa.local:3000/en/login`
   - The tenant ID field should be hidden
   - Club name should be displayed

3. **Login without tenant ID:**
   - Enter email and password only
   - The system resolves the tenant from subdomain

---

## Testing from Other Devices

To test from other devices on your local network (phones, tablets, other computers):

### Step 1: Get Your Machine's IP

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Example: 192.168.1.100
```

### Step 2: Update dnsmasq

```bash
# Point .liyaqa.local to your machine's IP
echo "address=/liyaqa.local/192.168.1.100" >> $(brew --prefix)/etc/dnsmasq.conf
sudo brew services restart dnsmasq
```

### Step 3: Configure Other Devices

On each device, set DNS server to your machine's IP (192.168.1.100):

**iOS:**
- Settings → Wi-Fi → (i) next to network → Configure DNS → Manual
- Add: 192.168.1.100

**Android:**
- Settings → Wi-Fi → Long press network → Modify → Advanced
- IP settings: Static
- DNS 1: 192.168.1.100

**Windows:**
- Control Panel → Network → Change adapter settings
- Right-click adapter → Properties → IPv4 → Properties
- Use the following DNS: 192.168.1.100

**macOS/Linux:**
- System Preferences → Network → Advanced → DNS
- Add: 192.168.1.100

### Step 4: Update Backend CORS

Edit `backend/run-local-network.sh` to include your IP:

```bash
export CORS_ALLOWED_ORIGINS="http://liyaqa.local:3000,http://192.168.1.100:3000"
```

### Step 5: Update Frontend .env.local

```bash
NEXT_PUBLIC_API_URL=http://192.168.1.100:8080
```

---

## Alternative: Using /etc/hosts (No Wildcard)

If you can't install dnsmasq, manually add each subdomain:

```bash
sudo nano /etc/hosts
```

Add:
```
127.0.0.1   liyaqa.local
127.0.0.1   fitness-gym.liyaqa.local
127.0.0.1   my-gym.liyaqa.local
# Add more as needed
```

**Limitation:** You must add each subdomain manually.

---

## Troubleshooting

### DNS Not Resolving

```bash
# Check dnsmasq is running
sudo brew services list | grep dnsmasq

# Restart dnsmasq
sudo brew services restart dnsmasq

# Flush DNS cache
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### CORS Errors

Check backend logs for CORS configuration. Ensure `CORS_ALLOWED_ORIGIN_PATTERNS` includes the wildcard pattern.

### Subdomain Not Detected

1. Check browser URL is using `.liyaqa.local` domain
2. Verify `NEXT_PUBLIC_BASE_DOMAIN=liyaqa.local` in frontend
3. Check backend `LIYAQA_BASE_DOMAIN=liyaqa.local`
4. Ensure `LIYAQA_DEV_HOSTS` is empty (not containing liyaqa.local)

### API Connection Failed

1. Verify backend is running on port 8080
2. Check `NEXT_PUBLIC_API_URL` points to correct host
3. For network testing, use IP address instead of domain

---

## Environment Summary

| Component | URL |
|-----------|-----|
| Frontend (main) | http://liyaqa.local:3000 |
| Frontend (subdomain) | http://{slug}.liyaqa.local:3000 |
| Backend API | http://liyaqa.local:8080 |
| Swagger UI | http://liyaqa.local:8080/swagger-ui.html |

| Environment Variable | Value |
|---------------------|-------|
| `NEXT_PUBLIC_BASE_DOMAIN` | liyaqa.local |
| `NEXT_PUBLIC_API_URL` | http://liyaqa.local:8080 |
| `LIYAQA_BASE_DOMAIN` | liyaqa.local |
| `LIYAQA_DEV_HOSTS` | (empty) |
| `CORS_ALLOWED_ORIGIN_PATTERNS` | http://*.liyaqa.local:3000 |
