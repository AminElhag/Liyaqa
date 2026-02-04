#!/bin/bash
# Updates all @/* imports to @liyaqa/shared/*

update_imports() {
  local target_dir=$1
  echo "Updating imports in: $target_dir"

  find "$target_dir" -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
    # Shared UI components
    sed -i.bak 's|from "@/components/ui/|from "@liyaqa/shared/components/ui/|g' "$file"
    sed -i.bak 's|from "@/components/auth|from "@liyaqa/shared/components/auth|g' "$file"
    sed -i.bak 's|from "@/components/charts|from "@liyaqa/shared/components/charts|g' "$file"
    sed -i.bak 's|from "@/components/command-palette|from "@liyaqa/shared/components/command-palette|g' "$file"
    sed -i.bak 's|from "@/components/dashboard|from "@liyaqa/shared/components/dashboard|g' "$file"
    sed -i.bak 's|from "@/components/dialogs|from "@liyaqa/shared/components/dialogs|g' "$file"
    sed -i.bak 's|from "@/components/providers|from "@liyaqa/shared/components/providers|g' "$file"
    sed -i.bak 's|from "@/components/error-boundary"|from "@liyaqa/shared/components/error-boundary"|g' "$file"
    sed -i.bak 's|from "@/components/page-header"|from "@liyaqa/shared/components/page-header"|g' "$file"
    sed -i.bak 's|from "@/components/data-table"|from "@liyaqa/shared/components/data-table"|g' "$file"

    # Lib imports
    sed -i.bak 's|from "@/lib/utils"|from "@liyaqa/shared/utils"|g' "$file"
    sed -i.bak 's|from "@/lib/api|from "@liyaqa/shared/lib/api|g' "$file"
    sed -i.bak 's|from "@/lib/|from "@liyaqa/shared/lib/|g' "$file"

    # Types, queries, stores, hooks
    sed -i.bak 's|from "@/types/|from "@liyaqa/shared/types/|g' "$file"
    sed -i.bak 's|from "@/queries/|from "@liyaqa/shared/queries/|g' "$file"
    sed -i.bak 's|from "@/stores/|from "@liyaqa/shared/stores/|g' "$file"
    sed -i.bak 's|from "@/hooks/|from "@liyaqa/shared/hooks/|g' "$file"
    sed -i.bak 's|from "@/i18n/|from "@liyaqa/shared/i18n/|g' "$file"

    # Clean up backup files
    rm -f "${file}.bak"
  done

  echo "✓ Import migration complete for: $target_dir"
}

# Update both apps
update_imports "apps/club/src"
update_imports "apps/platform/src"

echo ""
echo "✓✓✓ All imports migrated successfully ✓✓✓"
