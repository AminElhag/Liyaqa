# CI/CD Setup Guide for DigitalOcean Droplet Deployment

This guide will help you configure automatic deployment from GitHub to your DigitalOcean droplet at `167.71.233.43`.

## 🎯 Overview

The CI/CD pipeline automatically:
1. Runs tests when you push to `main`
2. Builds Docker images and pushes to Docker Hub
3. SSHs to your droplet and deploys the latest code
4. Verifies the deployment health
5. Sends notifications (optional)

---

## 📋 Prerequisites

- ✅ DigitalOcean droplet running at 167.71.233.43
- ✅ Code already deployed at `/opt/Liyaqa`
- ✅ Docker and Docker Compose installed on droplet
- ✅ GitHub repository with code
- ✅ Docker Hub account (amegung)

---

## 🔐 Step 1: Generate SSH Deploy Key

Run these commands on your **local machine**:

```bash
# Generate a dedicated SSH key for GitHub Actions deployment
# Important: Do NOT set a passphrase (just press Enter when asked)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/liyaqa_deploy_key

# This creates two files:
# - ~/.ssh/liyaqa_deploy_key (private key - will be added to GitHub)
# - ~/.ssh/liyaqa_deploy_key.pub (public key - will be added to droplet)
```

---

## 🔑 Step 2: Add Public Key to Droplet

### Option A: Using ssh-copy-id (Easiest)

```bash
# Copy the public key to your droplet
ssh-copy-id -i ~/.ssh/liyaqa_deploy_key.pub root@167.71.233.43
```

### Option B: Manual method

```bash
# 1. Display your public key
cat ~/.ssh/liyaqa_deploy_key.pub

# 2. Copy the output (starts with "ssh-ed25519...")

# 3. SSH to your droplet
ssh root@167.71.233.43

# 4. Add the public key to authorized_keys
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# 5. Set proper permissions
chmod 600 ~/.ssh/authorized_keys
```

---

## ✅ Step 3: Test SSH Connection

Test that the new SSH key works:

```bash
# Test SSH connection with the new key
ssh -i ~/.ssh/liyaqa_deploy_key root@167.71.233.43 "echo 'SSH connection successful!'"

# You should see: SSH connection successful!
```

If this fails, double-check that:
- The public key was added correctly to the droplet
- You're using the correct IP address
- The droplet firewall allows SSH (port 22)

---

## 🔐 Step 4: Get Current Production Secrets

SSH to your droplet and retrieve the current environment values:

```bash
# SSH to droplet
ssh root@167.71.233.43

# Navigate to deployment directory
cd /opt/Liyaqa

# Display current secrets (you'll need these for GitHub)
cat .env | grep -E "POSTGRES_PASSWORD|JWT_SECRET|REDIS_PASSWORD"
```

Copy these values - you'll need them in the next step.

---

## 🔐 Step 5: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** for each of the following:

### Required Secrets

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `PROD_HOST` | `167.71.233.43` | Your droplet's IP address |
| `PROD_USER` | `root` | SSH user (usually root) |
| `PROD_SSH_KEY` | Contents of `~/.ssh/liyaqa_deploy_key` | The entire private key file |
| `PROD_SSH_PORT` | `22` | SSH port (default is 22) |
| `DOCKERHUB_USERNAME` | `amegung` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Your Docker Hub token | Docker Hub access token |

### Optional Secrets (for Slack notifications)

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SLACK_WEBHOOK` | Your Slack webhook URL | For deployment notifications |

### How to Get Your Private Key

On your local machine:

```bash
# Display your private key
cat ~/.ssh/liyaqa_deploy_key

# Copy the ENTIRE output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... (the key content) ...
# -----END OPENSSH PRIVATE KEY-----
```

**Important**: Copy the entire key exactly as shown, including the BEGIN and END lines.

### How to Create Docker Hub Token

1. Go to https://hub.docker.com/settings/security
2. Click **"New Access Token"**
3. Name: "GitHub Actions"
4. Permissions: Read & Write
5. Copy the token (you won't see it again!)

---

## 🚀 Step 6: Test the Deployment

### Option A: Manual Test (Recommended for first time)

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click **"Deploy to DigitalOcean Droplet"** workflow
4. Click **"Run workflow"** button
5. Select `main` branch
6. Click **"Run workflow"**

Watch the deployment progress. It should:
- ✅ Run tests
- ✅ Build Docker images
- ✅ Deploy to droplet
- ✅ Verify health

### Option B: Automatic Test (Push to main)

```bash
# Make a small test change
echo "# CI/CD Pipeline Active" >> README.md

# Commit and push
git add README.md
git commit -m "test: verify CI/CD pipeline"
git push origin main

# Watch the deployment
# Go to: https://github.com/YOUR_USERNAME/Liyaqa/actions
```

---

## ✅ Step 7: Verify Deployment

After deployment completes, verify everything is working:

```bash
# Check if the application is accessible
curl http://167.71.233.43/actuator/health

# You should see: {"status":"UP"}

# Check the frontend
curl -I http://167.71.233.43

# You should see: HTTP/1.1 200 OK
```

Or open in browser:
- Frontend: http://167.71.233.43
- Backend health: http://167.71.233.43/actuator/health

---

## 🔍 Monitoring Deployments

### View Deployment Logs on Droplet

```bash
# SSH to droplet
ssh root@167.71.233.43

# View live logs
cd /opt/Liyaqa/deploy
docker compose -f docker-compose.droplet.yml logs -f

# View specific service
docker compose -f docker-compose.droplet.yml logs -f backend

# View container status
docker compose -f docker-compose.droplet.yml ps
```

### View GitHub Actions Logs

1. Go to repository → **Actions** tab
2. Click on the workflow run
3. Click on each job to see detailed logs

---

## 🛟 Troubleshooting

### Deployment Failed - Tests Not Passing

**Solution**: Fix the test failures first
```bash
# Run tests locally
cd backend
./gradlew test

cd ../frontend
npm run test:run
```

### Deployment Failed - SSH Connection

**Error**: "Permission denied (publickey)"

**Solution**:
```bash
# Verify the key is on the droplet
ssh root@167.71.233.43 "cat ~/.ssh/authorized_keys | grep github-actions"

# If not found, re-add the public key
ssh-copy-id -i ~/.ssh/liyaqa_deploy_key.pub root@167.71.233.43
```

### Deployment Failed - Services Not Healthy

**Solution**: Check logs on droplet
```bash
ssh root@167.71.233.43
cd /opt/Liyaqa/deploy

# Check what's wrong
docker compose -f docker-compose.droplet.yml ps
docker compose -f docker-compose.droplet.yml logs backend --tail=100
```

Common issues:
- Database not ready: Wait 30s and check again
- Environment variable missing: Verify `.env` file exists
- Out of memory: Check `docker stats`

### Docker Hub Login Failed

**Error**: "unauthorized: incorrect username or password"

**Solution**: Regenerate Docker Hub token
1. Go to https://hub.docker.com/settings/security
2. Delete old token
3. Create new token
4. Update `DOCKERHUB_TOKEN` secret in GitHub

---

## 🔄 Rollback Procedure

If a deployment breaks production:

```bash
# SSH to droplet
ssh root@167.71.233.43
cd /opt/Liyaqa

# View recent commits
git log --oneline -5

# Rollback to previous commit (replace with actual commit hash)
git reset --hard abc1234

# Redeploy
cd deploy
cp ../.env .env
docker compose -f docker-compose.droplet.yml pull
docker compose -f docker-compose.droplet.yml up -d

# Verify
docker compose -f docker-compose.droplet.yml logs -f backend
```

---

## 🛡️ Security Best Practices

### 1. Protect Main Branch

Add branch protection rules:
1. Go to: **Settings** → **Branches**
2. Click **"Add branch protection rule"**
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass (select CI tests)
   - ✅ Require conversation resolution before merging

### 2. Use GitHub Environments

The workflow already uses the `production` environment. You can add manual approval:

1. Go to: **Settings** → **Environments** → **production**
2. Enable **"Required reviewers"**
3. Add yourself as a reviewer
4. Now deployments will wait for manual approval

### 3. Rotate SSH Keys Regularly

```bash
# Every 3-6 months, generate new keys
ssh-keygen -t ed25519 -C "github-actions-deploy-2026" -f ~/.ssh/liyaqa_deploy_key_new

# Add new key to droplet
ssh-copy-id -i ~/.ssh/liyaqa_deploy_key_new.pub root@167.71.233.43

# Update GitHub secret with new private key
cat ~/.ssh/liyaqa_deploy_key_new

# After verifying it works, remove old key from droplet
ssh root@167.71.233.43
nano ~/.ssh/authorized_keys  # Remove old key
```

---

## 📊 Deployment Flow

```
Developer pushes to main
         ↓
GitHub Actions triggered
         ↓
1. Run Backend Tests (Gradle)
2. Run Frontend Tests (npm)
         ↓
    All tests pass?
         ↓ Yes
3. Build Docker Images
4. Push to Docker Hub
         ↓
5. SSH to Droplet
6. Git pull latest code
7. Docker Compose pull images
8. Docker Compose up -d
         ↓
9. Health check loop (up to 40 attempts)
         ↓
    Services healthy?
         ↓ Yes
✅ Deployment complete
📢 Slack notification (if configured)
         ↓
Application live at http://167.71.233.43
```

---

## 🎯 Success Criteria

After setup, you should have:

- ✅ Pushing to `main` triggers automatic deployment
- ✅ Tests run before deployment
- ✅ Docker images built and pushed automatically
- ✅ Deployment completes in 5-10 minutes
- ✅ Health checks verify successful deployment
- ✅ Application accessible at http://167.71.233.43
- ✅ Failed deployments don't break production
- ✅ Can rollback manually if needed

---

## 🚀 Next Steps

After the pipeline is working:

1. **Add SSL Certificate**
   ```bash
   # On droplet
   cd /opt/Liyaqa/deploy
   docker compose --profile ssl up -d certbot
   ```

2. **Setup Monitoring** (Optional)
   - Deploy Prometheus + Grafana
   - Use existing monitoring setup in `deploy/docker-compose.monitoring.yml`

3. **Add Staging Environment**
   - Create `.github/workflows/deploy-staging.yml`
   - Deploy to staging first, then production

4. **Database Backup Automation**
   - Already configured in `deploy/backup.sh`
   - Add to cron for daily backups

---

## 📞 Getting Help

### Check Workflow Status
- GitHub Actions: https://github.com/YOUR_USERNAME/Liyaqa/actions

### View Logs
```bash
# Deployment logs
ssh root@167.71.233.43 "cd /opt/Liyaqa/deploy && docker compose -f docker-compose.droplet.yml logs --tail=100"

# System resources
ssh root@167.71.233.43 "docker stats --no-stream"
```

### Common Commands

```bash
# Check deployment status
ssh root@167.71.233.43 "cd /opt/Liyaqa && git log -1 --oneline"

# Restart services
ssh root@167.71.233.43 "cd /opt/Liyaqa/deploy && docker compose -f docker-compose.droplet.yml restart"

# View disk usage
ssh root@167.71.233.43 "df -h"

# View memory usage
ssh root@167.71.233.43 "free -h"
```

---

## ✅ Setup Checklist

Use this checklist to track your progress:

- [ ] Generate SSH deploy key
- [ ] Add public key to droplet
- [ ] Test SSH connection
- [ ] Get current production secrets from droplet
- [ ] Add all required GitHub secrets
- [ ] Create Docker Hub access token
- [ ] Test manual deployment via GitHub Actions
- [ ] Test automatic deployment (push to main)
- [ ] Verify application is accessible
- [ ] Setup Slack notifications (optional)
- [ ] Configure branch protection rules (recommended)
- [ ] Document rollback procedure for your team
- [ ] Setup monitoring (optional)

---

**Setup Status**: Ready to Implement
**Estimated Time**: 30-60 minutes
**Risk Level**: Low (existing deployment preserved)

For questions or issues, check the GitHub Actions logs or SSH to the droplet to inspect container logs.
