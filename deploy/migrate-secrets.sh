#!/bin/bash
################################################################################
# Secrets Migration Script
#
# This script migrates sensitive environment variables to AWS Secrets Manager.
# Run this once during initial production setup.
#
# Prerequisites:
# - AWS CLI installed and configured
# - IAM permissions: secretsmanager:CreateSecret, secretsmanager:PutSecretValue
# - Environment variables set (source from .env file)
#
# Usage:
#   # Set environment first
#   export $(cat .env | xargs)
#
#   # Run migration
#   ./migrate-secrets.sh
#
#   # For specific environment (staging/prod)
#   ./migrate-secrets.sh prod
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
ENVIRONMENT="${1:-prod}"
AWS_REGION="${AWS_REGION:-me-south-1}"
SECRET_PREFIX="liyaqa/${ENVIRONMENT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials are not configured or invalid"
    exit 1
fi

log_info "Migrating secrets to AWS Secrets Manager"
log_info "Environment: ${ENVIRONMENT}"
log_info "AWS Region: ${AWS_REGION}"
log_info "Secret Prefix: ${SECRET_PREFIX}"
echo ""

# Function to create or update a secret
create_or_update_secret() {
    local secret_name="$1"
    local secret_value="$2"
    local description="$3"

    log_info "Processing secret: ${secret_name}"

    # Check if secret already exists
    if aws secretsmanager describe-secret --secret-id "${secret_name}" --region "${AWS_REGION}" &> /dev/null; then
        log_warning "Secret already exists, updating value..."

        aws secretsmanager put-secret-value \
            --secret-id "${secret_name}" \
            --secret-string "${secret_value}" \
            --region "${AWS_REGION}" > /dev/null

        log_success "Secret updated: ${secret_name}"
    else
        log_info "Creating new secret..."

        aws secretsmanager create-secret \
            --name "${secret_name}" \
            --description "${description}" \
            --secret-string "${secret_value}" \
            --region "${AWS_REGION}" > /dev/null

        log_success "Secret created: ${secret_name}"
    fi
}

# Function to create JSON secret
create_json_secret() {
    local secret_name="$1"
    local json_value="$2"
    local description="$3"

    create_or_update_secret "${secret_name}" "${json_value}" "${description}"
}

echo "════════════════════════════════════════════════════════════════"
echo "  Database Secrets"
echo "════════════════════════════════════════════════════════════════"

# Database credentials (stored as JSON for easy retrieval)
DB_SECRET=$(cat <<EOF
{
  "host": "${DB_HOST:-localhost}",
  "port": "${DB_PORT:-5432}",
  "database": "${DB_NAME:-liyaqa}",
  "username": "${DB_USERNAME:-liyaqa}",
  "password": "${DB_PASSWORD}"
}
EOF
)

create_json_secret \
    "${SECRET_PREFIX}/database" \
    "$DB_SECRET" \
    "Liyaqa ${ENVIRONMENT} database credentials"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  JWT Secrets"
echo "════════════════════════════════════════════════════════════════"

# JWT secrets
JWT_SECRET=$(cat <<EOF
{
  "accessTokenSecret": "${JWT_SECRET}",
  "refreshTokenSecret": "${JWT_REFRESH_SECRET}",
  "accessTokenExpiration": "${JWT_ACCESS_TOKEN_EXPIRATION:-3600}",
  "refreshTokenExpiration": "${JWT_REFRESH_TOKEN_EXPIRATION:-86400}"
}
EOF
)

create_json_secret \
    "${SECRET_PREFIX}/jwt" \
    "$JWT_SECRET" \
    "Liyaqa ${ENVIRONMENT} JWT signing secrets"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  SMTP/Email Secrets"
echo "════════════════════════════════════════════════════════════════"

# SMTP credentials
if [ -n "${SMTP_USERNAME:-}" ]; then
    SMTP_SECRET=$(cat <<EOF
{
  "host": "${SMTP_HOST:-smtp.gmail.com}",
  "port": "${SMTP_PORT:-587}",
  "username": "${SMTP_USERNAME}",
  "password": "${SMTP_PASSWORD}",
  "from": "${EMAIL_FROM:-noreply@liyaqa.com}"
}
EOF
)

    create_json_secret \
        "${SECRET_PREFIX}/smtp" \
        "$SMTP_SECRET" \
        "Liyaqa ${ENVIRONMENT} SMTP credentials"
else
    log_warning "SMTP credentials not configured, skipping"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  SMS/Twilio Secrets"
echo "════════════════════════════════════════════════════════════════"

# Twilio credentials
if [ -n "${TWILIO_ACCOUNT_SID:-}" ]; then
    TWILIO_SECRET=$(cat <<EOF
{
  "accountSid": "${TWILIO_ACCOUNT_SID}",
  "authToken": "${TWILIO_AUTH_TOKEN}",
  "phoneNumber": "${TWILIO_PHONE_NUMBER}"
}
EOF
)

    create_json_secret \
        "${SECRET_PREFIX}/twilio" \
        "$TWILIO_SECRET" \
        "Liyaqa ${ENVIRONMENT} Twilio SMS credentials"
else
    log_warning "Twilio credentials not configured, skipping"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Firebase/Push Notification Secrets"
echo "════════════════════════════════════════════════════════════════"

# Firebase credentials (service account JSON)
if [ -n "${FIREBASE_SERVICE_ACCOUNT:-}" ]; then
    create_or_update_secret \
        "${SECRET_PREFIX}/firebase" \
        "${FIREBASE_SERVICE_ACCOUNT}" \
        "Liyaqa ${ENVIRONMENT} Firebase service account"
else
    log_warning "Firebase credentials not configured, skipping"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Payment Gateway Secrets (if applicable)"
echo "════════════════════════════════════════════════════════════════"

# Payment gateway credentials (example: Stripe)
if [ -n "${STRIPE_SECRET_KEY:-}" ]; then
    STRIPE_SECRET=$(cat <<EOF
{
  "secretKey": "${STRIPE_SECRET_KEY}",
  "publishableKey": "${STRIPE_PUBLISHABLE_KEY:-}",
  "webhookSecret": "${STRIPE_WEBHOOK_SECRET:-}"
}
EOF
)

    create_json_secret \
        "${SECRET_PREFIX}/stripe" \
        "$STRIPE_SECRET" \
        "Liyaqa ${ENVIRONMENT} Stripe payment credentials"
else
    log_warning "Stripe credentials not configured, skipping"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Migration Complete!"
echo "════════════════════════════════════════════════════════════════"
echo ""

log_success "All secrets have been migrated to AWS Secrets Manager"
echo ""
log_info "Next steps:"
echo "  1. Update application.yml to enable secrets manager:"
echo "     aws:"
echo "       secrets:"
echo "         enabled: true"
echo "       region: ${AWS_REGION}"
echo ""
echo "  2. Grant your application IAM role these permissions:"
echo "     - secretsmanager:GetSecretValue"
echo "     - secretsmanager:DescribeSecret"
echo ""
echo "  3. Update your .env file to remove sensitive values"
echo "     (keep only non-sensitive configuration)"
echo ""
echo "  4. Test the application can retrieve secrets:"
echo "     ./gradlew bootRun"
echo ""
log_warning "IMPORTANT: Do not delete your .env file until you've verified"
log_warning "the application works with AWS Secrets Manager!"

# List all created secrets
echo ""
log_info "Created/Updated secrets:"
aws secretsmanager list-secrets \
    --region "${AWS_REGION}" \
    --filters Key=name,Values="${SECRET_PREFIX}" \
    --query 'SecretList[*].[Name,Description]' \
    --output table

exit 0
