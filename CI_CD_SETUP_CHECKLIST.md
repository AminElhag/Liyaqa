# CI/CD Setup Checklist

Use this checklist to track your progress setting up the CI/CD pipeline.

---

## ☐ Phase 1: SSH Key Setup (5 minutes)

### Generate SSH Key
- [ ] Open terminal on local machine
- [ ] Run: `ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/liyaqa_deploy_key`
- [ ] Press Enter when asked for passphrase (leave empty for automation)
- [ ] Verify files created:
  - [ ] `~/.ssh/liyaqa_deploy_key` (private key)
  - [ ] `~/.ssh/liyaqa_deploy_key.pub` (public key)

### Add Key to Droplet
- [ ] Run: `ssh-copy-id -i ~/.ssh/liyaqa_deploy_key.pub root@167.71.233.43`
- [ ] OR manually:
  - [ ] Run: `cat ~/.ssh/liyaqa_deploy_key.pub` (copy output)
  - [ ] SSH to droplet: `ssh root@167.71.233.43`
  - [ ] Run: `echo "PASTE_PUBLIC_KEY" >> ~/.ssh/authorized_keys`
  - [ ] Run: `chmod 600 ~/.ssh/authorized_keys`

### Test Connection
- [ ] Run: `ssh -i ~/.ssh/liyaqa_deploy_key root@167.71.233.43 "echo 'Success!'"`
- [ ] Verify you see "Success!" without password prompt

---

## ☐ Phase 2: Docker Hub Token (5 minutes)

### Create Docker Hub Access Token
- [ ] Go to: https://hub.docker.com/settings/security
- [ ] Click "New Access Token"
- [ ] Token description: `GitHub Actions CI/CD`
- [ ] Access permissions: **Read & Write**
- [ ] Click "Generate"
- [ ] **IMPORTANT**: Copy token immediately (you won't see it again!)
- [ ] Save token in secure location temporarily

---

## ☐ Phase 3: GitHub Secrets (10 minutes)

### Navigate to GitHub Secrets
- [ ] Go to your GitHub repository
- [ ] Click **Settings** tab
- [ ] Click **Secrets and variables** → **Actions** (left sidebar)

### Add Required Secrets
Click "New repository secret" for each:

#### PROD_HOST
- [ ] Name: `PROD_HOST`
- [ ] Value: `167.71.233.43`
- [ ] Click "Add secret"

#### PROD_USER
- [ ] Name: `PROD_USER`
- [ ] Value: `root`
- [ ] Click "Add secret"

#### PROD_SSH_KEY
- [ ] Run on local: `cat ~/.ssh/liyaqa_deploy_key`
- [ ] Copy **entire output** (including BEGIN/END lines)
- [ ] Name: `PROD_SSH_KEY`
- [ ] Paste entire private key as value
- [ ] Click "Add secret"

#### PROD_SSH_PORT
- [ ] Name: `PROD_SSH_PORT`
- [ ] Value: `22`
- [ ] Click "Add secret"

#### DOCKERHUB_USERNAME
- [ ] Name: `DOCKERHUB_USERNAME`
- [ ] Value: `amegung` (your Docker Hub username)
- [ ] Click "Add secret"

#### DOCKERHUB_TOKEN
- [ ] Name: `DOCKERHUB_TOKEN`
- [ ] Paste the Docker Hub token you created earlier
- [ ] Click "Add secret"

### Optional: Slack Notifications
If you want Slack notifications:
- [ ] Create Slack incoming webhook at your workspace settings
- [ ] Name: `SLACK_WEBHOOK`
- [ ] Value: Your Slack webhook URL
- [ ] Click "Add secret"

### Verify Secrets
- [ ] Confirm 6 secrets visible (7 if Slack configured):
  - [ ] PROD_HOST
  - [ ] PROD_USER
  - [ ] PROD_SSH_KEY
  - [ ] PROD_SSH_PORT
  - [ ] DOCKERHUB_USERNAME
  - [ ] DOCKERHUB_TOKEN
  - [ ] SLACK_WEBHOOK (optional)

---

## ☐ Phase 4: Verify Droplet State (5 minutes)

### Check Droplet Configuration
- [ ] SSH to droplet: `ssh root@167.71.233.43`
- [ ] Navigate to project: `cd /opt/Liyaqa`
- [ ] Verify git repository: `git status`
- [ ] Verify on main branch: `git branch --show-current`
- [ ] Verify .env exists: `ls -la .env`
- [ ] Verify Docker Compose file: `ls -la deploy/docker-compose.droplet.yml`
- [ ] Exit droplet: `exit`

---

## ☐ Phase 5: Test Manual Deployment (10 minutes)

### Trigger Manual Workflow
- [ ] Go to GitHub repository
- [ ] Click **Actions** tab
- [ ] Find "Deploy to DigitalOcean Droplet" in left sidebar
- [ ] Click "Run workflow" button (top right)
- [ ] Select branch: `main`
- [ ] Leave "Skip tests" unchecked
- [ ] Click green "Run workflow" button

### Monitor Deployment
- [ ] Watch workflow progress in Actions tab
- [ ] Verify "Backend Tests" job completes successfully
- [ ] Verify "Frontend Tests" job completes successfully
- [ ] Verify "Build & Push Docker Images" job completes
- [ ] Verify "Deploy to DigitalOcean" job completes

### Expected Timeline
- Backend tests: ~3-5 minutes
- Frontend tests: ~2-3 minutes
- Build images: ~3-5 minutes
- Deploy: ~2-3 minutes
- **Total: ~10-15 minutes**

### Troubleshooting Failed Deployment
If deployment fails, check:
- [ ] GitHub Actions logs for error messages
- [ ] Verify all secrets are set correctly
- [ ] Check SSH key is on droplet: `ssh root@167.71.233.43 "cat ~/.ssh/authorized_keys"`
- [ ] Verify Docker Hub credentials work
- [ ] Check droplet has enough disk space: `ssh root@167.71.233.43 "df -h"`

---

## ☐ Phase 6: Verify Deployment (5 minutes)

### Check Application Status

#### From Your Computer
- [ ] Test backend health: `curl http://167.71.233.43/actuator/health`
- [ ] Expected response: `{"status":"UP"}`
- [ ] Test frontend: `curl -I http://167.71.233.43`
- [ ] Expected: `HTTP/1.1 200 OK`

#### Check in Browser
- [ ] Open: http://167.71.233.43
- [ ] Verify frontend loads
- [ ] Verify you can navigate pages

#### On Droplet
- [ ] SSH to droplet: `ssh root@167.71.233.43`
- [ ] Run health check: `cd /opt/Liyaqa/deploy && ./health-check.sh`
- [ ] Verify all services show green checkmarks
- [ ] Check container status: `docker compose -f docker-compose.droplet.yml ps`
- [ ] Verify all containers are "Up" and "healthy"
- [ ] Exit: `exit`

---

## ☐ Phase 7: Test Automatic Deployment (10 minutes)

### Create Test Change
- [ ] On local machine, in project directory
- [ ] Create test file: `echo "# CI/CD Pipeline Active - $(date)" > CI_CD_TEST.md`
- [ ] Stage file: `git add CI_CD_TEST.md`
- [ ] Commit: `git commit -m "test: verify automatic CI/CD deployment"`
- [ ] Push: `git push origin main`

### Monitor Automatic Deployment
- [ ] Go to GitHub → Actions immediately
- [ ] New workflow run should appear within seconds
- [ ] Watch it progress through all stages
- [ ] Verify deployment completes successfully

### Verify Deployment
- [ ] Check application still responds: `curl http://167.71.233.43/actuator/health`
- [ ] SSH to droplet: `ssh root@167.71.233.43`
- [ ] Check latest commit: `cd /opt/Liyaqa && git log -1 --oneline`
- [ ] Verify it shows your test commit
- [ ] Verify test file exists: `ls CI_CD_TEST.md`
- [ ] Exit: `exit`

### Clean Up Test
- [ ] Delete test file: `git rm CI_CD_TEST.md`
- [ ] Commit: `git commit -m "chore: remove CI/CD test file"`
- [ ] Push: `git push origin main`
- [ ] Verify automatic deployment runs again

---

## ☐ Phase 8: Test Rollback (Optional - 5 minutes)

### Prepare for Rollback Test
- [ ] Note current commit: `git log -1 --oneline`
- [ ] SSH to droplet: `ssh root@167.71.233.43`
- [ ] Navigate: `cd /opt/Liyaqa/deploy`

### Test Rollback Script
- [ ] List recent commits: `./rollback.sh --list`
- [ ] Verify you see recent commits
- [ ] Test rollback: `./rollback.sh`
- [ ] Type `yes` when prompted
- [ ] Watch rollback process
- [ ] Verify rollback completes successfully
- [ ] Check services are healthy: `./health-check.sh`

### Verify Rollback Worked
- [ ] Check current commit: `cd .. && git log -1 --oneline`
- [ ] Verify it's the previous commit
- [ ] Test application: `curl http://localhost/actuator/health`

### Rollback to Original State
- [ ] Run: `cd deploy && ./rollback.sh --list`
- [ ] Find your original commit hash
- [ ] Rollback: `./rollback.sh COMMIT_HASH`
- [ ] Type `yes` to confirm
- [ ] Verify back at original commit: `cd .. && git log -1 --oneline`
- [ ] Exit: `exit`

---

## ☐ Phase 9: Configure Security (Optional - 10 minutes)

### Enable Branch Protection
- [ ] Go to GitHub → Settings → Branches
- [ ] Click "Add branch protection rule"
- [ ] Branch name pattern: `main`
- [ ] Check "Require pull request reviews before merging"
- [ ] Set "Required number of approvals": 1
- [ ] Check "Require status checks to pass before merging"
- [ ] Search and select: "Backend Tests", "Frontend Tests"
- [ ] Check "Require conversation resolution before merging"
- [ ] Click "Create"

### Configure Deployment Approval (Optional)
To require manual approval before production deployment:
- [ ] Go to Settings → Environments
- [ ] Click "production" environment
- [ ] Check "Required reviewers"
- [ ] Add your GitHub username
- [ ] Set wait timer (optional): 0 minutes
- [ ] Click "Save protection rules"

**Note**: With this enabled, deployments will pause and wait for approval

---

## ☐ Phase 10: Documentation & Training (5 minutes)

### Review Documentation
- [ ] Read: `CI_CD_SETUP_GUIDE.md` - Complete setup guide
- [ ] Read: `CI_CD_QUICK_REFERENCE.md` - Quick commands
- [ ] Read: `CI_CD_IMPLEMENTATION_SUMMARY.md` - Overview
- [ ] Read: `deploy/README.md` - Deployment operations
- [ ] Bookmark: GitHub Actions page for monitoring

### Team Training Checklist
If working with a team:
- [ ] Share documentation with team
- [ ] Demonstrate rollback procedure
- [ ] Show how to monitor deployments
- [ ] Explain when to use manual vs automatic deployment
- [ ] Document emergency procedures
- [ ] Set up notification channels (Slack/email)

---

## ☐ Completion Checklist

### Verify Everything Works
- [ ] ✅ SSH key works without password
- [ ] ✅ All GitHub secrets are configured
- [ ] ✅ Docker Hub credentials work
- [ ] ✅ Manual deployment succeeds
- [ ] ✅ Automatic deployment on push works
- [ ] ✅ Application is accessible at http://167.71.233.43
- [ ] ✅ Health checks pass
- [ ] ✅ Rollback script works
- [ ] ✅ Health check script works
- [ ] ✅ Team is trained (if applicable)

### Success Criteria Met
- [ ] Pushing to `main` triggers deployment
- [ ] Tests run before deployment
- [ ] Deployment completes in 10-15 minutes
- [ ] Failed deployments don't break production
- [ ] Can rollback if needed
- [ ] Can monitor deployment status

---

## 📞 Getting Help

### If Something Goes Wrong

**Deployment Failed - Check:**
1. GitHub Actions logs for error messages
2. GitHub Secrets are correct
3. Droplet has enough resources: `ssh root@167.71.233.43 "df -h && free -h"`
4. SSH key is on droplet: `ssh root@167.71.233.43 "cat ~/.ssh/authorized_keys"`

**Can't SSH to Droplet:**
1. Verify droplet is running in DigitalOcean console
2. Check firewall allows SSH: `ufw status`
3. Verify SSH key permissions: `chmod 600 ~/.ssh/liyaqa_deploy_key`
4. Try with password: `ssh root@167.71.233.43`

**Application Not Responding:**
1. SSH to droplet and check logs: `cd /opt/Liyaqa/deploy && docker compose -f docker-compose.droplet.yml logs`
2. Run health check: `./health-check.sh`
3. Check containers: `docker ps`
4. Restart services: `docker compose -f docker-compose.droplet.yml restart`

**Need to Rollback:**
1. SSH to droplet: `ssh root@167.71.233.43`
2. Navigate: `cd /opt/Liyaqa/deploy`
3. Rollback: `./rollback.sh`
4. Or to specific commit: `./rollback.sh COMMIT_HASH`

---

## 🎉 Congratulations!

If you've checked all the boxes above, your CI/CD pipeline is fully operational!

### What You've Achieved
- ✅ Automated deployment on every push to main
- ✅ Automatic testing before deployment
- ✅ Docker-based deployment to production
- ✅ Health monitoring and verification
- ✅ Easy rollback capability
- ✅ Complete documentation

### Next Steps
- Monitor a few deployments to ensure stability
- Consider adding staging environment
- Setup monitoring dashboards (Grafana)
- Configure automated backups
- Plan for SSL certificate setup

---

**Setup Status**:
- [ ] Not Started
- [ ] In Progress
- [ ] Complete ✅

**Completion Date**: _______________

**Notes**:
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________
