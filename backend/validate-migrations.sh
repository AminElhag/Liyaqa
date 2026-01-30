#!/bin/bash
# Migration Validation Script
# Checks SQL syntax and migration file naming

set -e

echo "============================================"
echo "   Liyaqa Trainer Portal Migration Check   "
echo "============================================"
echo ""

MIGRATION_DIR="src/main/resources/db/migration"
NEW_MIGRATIONS=(
    "V87__create_trainer_clients_table.sql"
    "V88__create_trainer_earnings_table.sql"
    "V89__create_trainer_notifications_table.sql"
    "V90__create_trainer_certifications_table.sql"
    "V91__add_trainer_portal_columns.sql"
)

echo "Checking migration files..."
echo ""

# Check if files exist
MISSING=0
for migration in "${NEW_MIGRATIONS[@]}"; do
    if [ -f "$MIGRATION_DIR/$migration" ]; then
        echo "✓ Found: $migration"
    else
        echo "✗ Missing: $migration"
        MISSING=$((MISSING + 1))
    fi
done

echo ""
if [ $MISSING -eq 0 ]; then
    echo "✅ All migration files found!"
else
    echo "❌ $MISSING migration file(s) missing!"
    exit 1
fi

echo ""
echo "Checking file sizes..."
echo ""

for migration in "${NEW_MIGRATIONS[@]}"; do
    SIZE=$(wc -c < "$MIGRATION_DIR/$migration")
    if [ $SIZE -gt 100 ]; then
        echo "✓ $migration: $SIZE bytes"
    else
        echo "⚠ $migration: $SIZE bytes (seems too small!)"
    fi
done

echo ""
echo "Checking for common SQL syntax errors..."
echo ""

ERRORS=0
for migration in "${NEW_MIGRATIONS[@]}"; do
    FILE="$MIGRATION_DIR/$migration"

    # Check for balanced CREATE TABLE
    CREATE_COUNT=$(grep -c "CREATE TABLE" "$FILE" || true)
    SEMICOLON_COUNT=$(grep -c ";" "$FILE" || true)

    if [ $CREATE_COUNT -gt 0 ] && [ $SEMICOLON_COUNT -eq 0 ]; then
        echo "✗ $migration: No semicolons found (missing statement terminators?)"
        ERRORS=$((ERRORS + 1))
    fi

    # Check for balanced parentheses in CREATE TABLE
    if grep -q "CREATE TABLE" "$FILE"; then
        OPEN=$(grep -o "(" "$FILE" | wc -l)
        CLOSE=$(grep -o ")" "$FILE" | wc -l)
        if [ $OPEN -ne $CLOSE ]; then
            echo "✗ $migration: Unbalanced parentheses ($OPEN open, $CLOSE close)"
            ERRORS=$((ERRORS + 1))
        fi
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo "✓ No obvious syntax errors detected"
fi

echo ""
echo "Listing tables to be created:"
echo ""

for migration in "${NEW_MIGRATIONS[@]}"; do
    TABLES=$(grep "CREATE TABLE" "$MIGRATION_DIR/$migration" | awk '{print $3}' || true)
    if [ ! -z "$TABLES" ]; then
        echo "  $migration:"
        echo "    - $TABLES"
    fi
done

echo ""
echo "============================================"
echo "Summary:"
echo "  - Migration files: ${#NEW_MIGRATIONS[@]}"
echo "  - Tables to create: 4 (trainer_clients, trainer_earnings, trainer_notifications, trainer_certifications)"
echo "  - Tables to modify: 2 (trainers, personal_training_sessions)"
echo "  - Total SQL files: 5"
echo ""

if [ $MISSING -eq 0 ] && [ $ERRORS -eq 0 ]; then
    echo "✅ VALIDATION PASSED"
    echo ""
    echo "Next steps:"
    echo "  1. Review migrations manually"
    echo "  2. Run: ./gradlew flywayMigrate (or restart application)"
    echo "  3. Verify schema in database"
    echo ""
    exit 0
else
    echo "❌ VALIDATION FAILED"
    echo ""
    echo "Please fix the errors above before running migrations."
    echo ""
    exit 1
fi
