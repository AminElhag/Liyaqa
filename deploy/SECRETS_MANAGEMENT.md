# Secrets Management Guide

This guide explains how to set up and use AWS Secrets Manager for secure secrets management in production.

## Overview

Liyaqa uses AWS Secrets Manager to securely store and retrieve sensitive configuration values such as:
- Database credentials
- JWT signing secrets
- SMTP/email credentials
- SMS/Twilio credentials
- Firebase service account
- Payment gateway API keys

## Why AWS Secrets Manager?

### Benefits:
- **Secure**: Encrypted at rest and in transit
- **Auditable**: CloudTrail logs all secret access
- **Rotatable**: Automatic secret rotation support
- **Centralized**: Single source of truth for all environments
- **No hardcoding**: Secrets never committed to version control
- **IAM integration**: Fine-grained access control

### vs Environment Variables:
- ✅ Encrypted storage (vs plain text in .env files)
- ✅ Audit trail (who accessed what, when)
- ✅ Automatic rotation capabilities
- ✅ No risk of committing secrets to git
- ✅ Centralized management across multiple servers

## Initial Setup

### 1. Install AWS CLI

```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

### 2. Configure AWS Credentials

```bash
# Interactive configuration
aws configure

# You'll need:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., me-south-1 for Bahrain)
# - Default output format (json)
```

### 3. Create IAM Policy for Secrets Access

Create an IAM policy with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:me-south-1:*:secret:liyaqa/*"
    }
  ]
}
```

### 4. Attach Policy to Application IAM Role

If running on EC2:
- Create an IAM role with the above policy
- Attach the role to your EC2 instance

If running locally or on other platforms:
- Create an IAM user with the policy
- Configure AWS credentials on the server

## Migrating Secrets

### Step 1: Prepare Environment Variables

Make sure your current `.env` file has all the secrets you want to migrate:

```bash
# Example .env (DO NOT commit this file!)
DB_HOST=localhost
DB_USERNAME=liyaqa
DB_PASSWORD=super-secret-password

JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

SMTP_USERNAME=noreply@liyaqa.com
SMTP_PASSWORD=email-password

TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 2: Run Migration Script

```bash
# Load environment variables
export $(cat .env | xargs)

# Run migration for production
./deploy/migrate-secrets.sh prod

# Or for staging
./deploy/migrate-secrets.sh staging
```

The script will:
1. Create secrets in AWS Secrets Manager
2. Organize them with the prefix `liyaqa/{environment}/`
3. Store related credentials together as JSON (e.g., database credentials)
4. Skip any secrets that aren't configured

### Step 3: Verify Secrets Were Created

```bash
# List all Liyaqa secrets
aws secretsmanager list-secrets --region me-south-1 \
  --filters Key=name,Values=liyaqa

# View a specific secret (without revealing the value)
aws secretsmanager describe-secret \
  --secret-id liyaqa/prod/database \
  --region me-south-1

# Retrieve a secret value (for testing)
aws secretsmanager get-secret-value \
  --secret-id liyaqa/prod/database \
  --region me-south-1 \
  --query SecretString \
  --output text
```

## Configuring the Application

### Enable Secrets Manager in application.yml

Update `backend/src/main/resources/application-prod.yml`:

```yaml
spring:
  profiles: prod

aws:
  region: me-south-1
  secrets:
    enabled: true
    database-secret-name: liyaqa/prod/database
    jwt-secret-name: liyaqa/prod/jwt
    smtp-secret-name: liyaqa/prod/smtp
    twilio-secret-name: liyaqa/prod/twilio
    firebase-secret-name: liyaqa/prod/firebase
```

### Local Development Configuration

For local development, keep using `.env` files:

```yaml
# application-dev.yml
spring:
  profiles: dev

aws:
  secrets:
    enabled: false  # Disable secrets manager for local dev

# Application will fall back to environment variables
```

## Using Secrets in Code

### Example: Database Configuration

The `SecretsManagerService` automatically handles secret retrieval:

```kotlin
@Configuration
class DatabaseConfig(
    @Value("\${aws.secrets.database-secret-name}")
    private val databaseSecretName: String,
    private val secretsService: SecretsManagerService?
) {
    @Bean
    fun dataSource(): DataSource {
        val dbConfig = if (secretsService != null) {
            // Production: Use AWS Secrets Manager
            secretsService.getSecretAsJson(databaseSecretName)
        } else {
            // Development: Fall back to environment variables
            mapOf(
                "host" to (System.getenv("DB_HOST") ?: "localhost"),
                "username" to (System.getenv("DB_USERNAME") ?: "liyaqa"),
                "password" to (System.getenv("DB_PASSWORD") ?: "liyaqa")
            )
        }

        return HikariDataSource().apply {
            jdbcUrl = "jdbc:postgresql://${dbConfig["host"]}/${dbConfig["database"]}"
            username = dbConfig["username"]
            password = dbConfig["password"]
        }
    }
}
```

### Example: JWT Configuration

```kotlin
@Configuration
class JwtConfig(
    @Value("\${aws.secrets.jwt-secret-name}")
    private val jwtSecretName: String,
    private val secretsService: SecretsManagerService?
) {
    fun getJwtSecret(): String {
        return if (secretsService != null) {
            val jwtConfig = secretsService.getSecretAsJson(jwtSecretName)
            jwtConfig["accessTokenSecret"] ?: error("JWT secret not found")
        } else {
            System.getenv("JWT_SECRET") ?: error("JWT secret not configured")
        }
    }
}
```

## Secret Rotation

### Manual Rotation

To rotate a secret manually:

```bash
# Update the secret value
aws secretsmanager update-secret \
  --secret-id liyaqa/prod/database \
  --secret-string '{"username":"liyaqa","password":"new-password"}' \
  --region me-south-1

# Restart the application to pick up the new value
docker-compose restart backend
```

### Automatic Rotation (Advanced)

For automatic rotation, you can configure AWS Secrets Manager with a Lambda function:

1. Create a Lambda function that rotates the secret
2. Configure automatic rotation in Secrets Manager
3. Test the rotation process

This is typically only needed for database passwords and other long-lived credentials.

## Security Best Practices

### 1. Least Privilege IAM Permissions

Only grant `GetSecretValue` permission for the specific secrets your application needs:

```json
{
  "Resource": "arn:aws:secretsmanager:me-south-1:*:secret:liyaqa/prod/*"
}
```

### 2. Use Separate Secrets per Environment

- `liyaqa/dev/*` - Development environment
- `liyaqa/staging/*` - Staging environment
- `liyaqa/prod/*` - Production environment

### 3. Enable CloudTrail Logging

Monitor who accesses secrets:

```bash
# View CloudTrail logs for secret access
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=liyaqa/prod/database \
  --region me-south-1
```

### 4. Never Log Secret Values

The application is configured to never log secret values. Always use:

```kotlin
logger.info("Retrieved secret: $secretName")  // ✅ Good
logger.info("Secret value: $secretValue")     // ❌ NEVER DO THIS
```

### 5. Clean Up Old .env Files

After migrating to Secrets Manager:

1. Verify the application works with Secrets Manager
2. Create a backup of your `.env` file
3. Remove sensitive values from `.env`
4. Never commit `.env` to version control

```bash
# Backup
cp .env .env.backup

# Remove sensitive values (keep only non-sensitive config)
# Edit .env to remove passwords, API keys, etc.

# Verify .env is in .gitignore
grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
```

## Troubleshooting

### Application Can't Retrieve Secrets

**Check IAM permissions:**
```bash
aws sts get-caller-identity
# Verify this is the correct IAM role/user

aws secretsmanager get-secret-value \
  --secret-id liyaqa/prod/database \
  --region me-south-1
# If this fails, you don't have the right permissions
```

**Check secret name:**
```bash
# List all secrets to verify the name
aws secretsmanager list-secrets --region me-south-1
```

**Check application logs:**
```bash
docker-compose logs backend | grep -i secret
```

### Secrets Manager Disabled in Production

If you see `aws.secrets.enabled=false` or the property is missing in `application-prod.yml`, the application will fall back to environment variables, which is insecure for production.

**Fix:**
```yaml
# application-prod.yml
aws:
  secrets:
    enabled: true  # Make sure this is set!
```

### Wrong AWS Region

If secrets are in a different region than configured:

**Check secret region:**
```bash
aws secretsmanager list-secrets --region us-east-1
aws secretsmanager list-secrets --region me-south-1
```

**Update application config:**
```yaml
aws:
  region: me-south-1  # Must match where secrets are stored
```

## Cost Considerations

AWS Secrets Manager pricing (as of 2025):
- $0.40 per secret per month
- $0.05 per 10,000 API calls

Estimated monthly cost for Liyaqa:
- ~10 secrets = $4.00/month
- ~100,000 API calls = $0.50/month
- **Total: ~$4.50/month**

This is a small price to pay for enterprise-grade security!

## Migration Checklist

- [ ] AWS CLI installed and configured
- [ ] IAM policy created for Secrets Manager access
- [ ] IAM role attached to EC2 instance (or user credentials configured)
- [ ] Secrets migrated using `migrate-secrets.sh`
- [ ] Secrets verified in AWS Console
- [ ] `application-prod.yml` updated with `aws.secrets.enabled=true`
- [ ] Application tested with Secrets Manager
- [ ] `.env` file cleaned of sensitive values
- [ ] CloudTrail logging enabled
- [ ] Team trained on accessing/rotating secrets

## Additional Resources

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [Secrets Manager Pricing](https://aws.amazon.com/secrets-manager/pricing/)
