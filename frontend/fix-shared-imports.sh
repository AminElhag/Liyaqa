#!/bin/bash
# Systematically fix import paths in shared package based on directory depth

cd /Users/waraiotoko/Desktop/Liyaqa/frontend/shared/src

echo "Fixing imports in shared package..."

# =============================================================================
# Level 1: Root directories (queries/, stores/, hooks/, types/, lib/, i18n/, providers/)
# These import using single ../ for sibling directories
# =============================================================================

echo "→ Fixing queries/ (level 1)"
find queries -maxdepth 1 -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read f; do
  sed -i.bak 's|from "../lib/|from "../lib/|g' "$f"
  sed -i.bak 's|from "../types/|from "../types/|g' "$f"
  sed -i.bak 's|from "../hooks/|from "../hooks/|g' "$f"
  sed -i.bak 's|from "../stores/|from "../stores/|g' "$f"
done

echo "→ Fixing stores/ (level 1)"
find stores -maxdepth 1 -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read f; do
  sed -i.bak 's|from "../lib/|from "../lib/|g' "$f"
  sed -i.bak 's|from "../types/|from "../types/|g' "$f"
  sed -i.bak 's|from "../hooks/|from "../hooks/|g' "$f"
done

echo "→ Fixing hooks/ (level 1)"
find hooks -maxdepth 1 -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read f; do
  sed -i.bak 's|from "../lib/|from "../lib/|g' "$f"
  sed -i.bak 's|from "../types/|from "../types/|g' "$f"
  sed -i.bak 's|from "../components/ui/|from "../components/ui/|g' "$f"
done

# =============================================================================
# Level 2: Subdirectories like queries/platform/, lib/api/, types/platform/
# These need ../../ to reach root level
# =============================================================================

echo "→ Fixing queries/platform/ (level 2)"
find queries/platform -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read f; do
  sed -i.bak 's|from "../lib/|from "../../lib/|g' "$f"
  sed -i.bak 's|from "../types/|from "../../types/|g' "$f"
  sed -i.bak 's|from "../hooks/|from "../../hooks/|g' "$f"
  sed -i.bak 's|from "../stores/|from "../../stores/|g' "$f"
done

echo "→ Fixing lib/api/ (level 2)"
find lib/api -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read f; do
  # lib/api/ imports from lib/ need ../
  sed -i.bak 's|from "../../lib/|from "../|g' "$f"
  # lib/api/ imports from types/ need ../../types/
  sed -i.bak 's|from "../types/|from "../../types/|g' "$f"
done

echo "→ Fixing lib/utils/ (level 2)"
find lib/utils -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read f; do
  sed -i.bak 's|from "../../lib/|from "../|g' "$f"
  sed -i.bak 's|from "../types/|from "../../types/|g' "$f"
done

echo "→ Fixing lib/validations/ (level 2)"
find lib/validations -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read f; do
  sed -i.bak 's|from "../../lib/|from "../|g' "$f"
  sed -i.bak 's|from "../types/|from "../../types/|g' "$f"
done

echo "→ Fixing types/platform/ (level 2)"
find types/platform -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read f; do
  # types/platform imports from types/ need ../
  sed -i.bak 's|from "../../types/|from "../|g' "$f"
done

# =============================================================================
# Components directory (special case - already mostly fixed)
# components/ui/ → level 2
# components/auth/, dashboard/, dialogs/, providers/ → level 2
# =============================================================================

echo "→ Fixing components/ui/ (level 2) - internal refs"
find components/ui -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read f; do
  # UI components importing other UI components use ./
  # Already done, but ensure lib/ and types/ imports are correct
  sed -i.bak 's|from "../../lib/utils"|from "../../lib/utils"|g' "$f"
  sed -i.bak 's|from "../../types/|from "../../types/|g' "$f"
done

echo "→ Fixing components/auth/ (level 2)"
find components/auth -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read f; do
  # Imports to lib/, types/, queries/ need ../../
  # Imports to ui/ need ../ui/
  sed -i.bak 's|from "../../lib/|from "../../lib/|g' "$f"
  sed -i.bak 's|from "../../types/|from "../../types/|g' "$f"
  sed -i.bak 's|from "../../queries/|from "../../queries/|g' "$f"
  sed -i.bak 's|from "../ui/|from "../ui/|g' "$f"
done

echo "→ Fixing components/dashboard/ (level 2)"
find components/dashboard -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read f; do
  sed -i.bak 's|from "../../lib/|from "../../lib/|g' "$f"
  sed -i.bak 's|from "../../types/|from "../../types/|g' "$f"
  sed -i.bak 's|from "../../queries/|from "../../queries/|g' "$f"
  sed -i.bak 's|from "../ui/|from "../ui/|g' "$f"
done

echo "→ Fixing components/dialogs/ (level 2)"
find components/dialogs -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read f; do
  sed -i.bak 's|from "../../lib/|from "../../lib/|g' "$f"
  sed -i.bak 's|from "../../types/|from "../../types/|g' "$f"
  sed -i.bak 's|from "../ui/|from "../ui/|g' "$f"
done

echo "→ Fixing components/providers/ (level 2)"
find components/providers -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read f; do
  sed -i.bak 's|from "../../lib/|from "../../lib/|g' "$f"
  sed -i.bak 's|from "../../types/|from "../../types/|g' "$f"
done

# =============================================================================
# Level 3: lib/api/platform/ (extra deep)
# These need ../../../ to reach root level
# =============================================================================

echo "→ Fixing lib/api/platform/ (level 3)"
find lib/api/platform -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read f; do
  # lib/api/platform imports from lib/api need ../
  sed -i.bak 's|from "../../lib/api/|from "../|g' "$f"
  # lib/api/platform imports from lib need ../../
  sed -i.bak 's|from "../../../lib/|from "../../|g' "$f"
  # lib/api/platform imports from types need ../../../types/
  sed -i.bak 's|from "../../types/|from "../../../types/|g' "$f"
done

# =============================================================================
# Clean up backup files
# =============================================================================

echo "→ Cleaning up backup files"
find . -name "*.bak" -delete

echo ""
echo "✅ All import paths fixed!"
echo ""
echo "Summary:"
echo "  - Fixed queries/ and queries/platform/"
echo "  - Fixed stores/ and hooks/"
echo "  - Fixed lib/, lib/api/, lib/api/platform/"
echo "  - Fixed types/ and types/platform/"
echo "  - Fixed components/ui/, auth/, dashboard/, dialogs/, providers/"
echo ""
echo "Next: Run 'npm run type-check:shared' to verify"
