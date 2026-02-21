#!/usr/bin/env bash
set -euo pipefail

# Rollback script for Recommendation #1 (Lazy Routes & Code-Splitting)
# Tags the current state, then provides revert instructions.
#
# Usage:
#   ./scripts/rollback-rec1.sh          # Dry run (show what would happen)
#   ./scripts/rollback-rec1.sh --execute # Actually tag and revert

COMMIT=$(git rev-parse HEAD)
TAG="v1.0-rec1-lazy-complete"

echo "=== Recommendation #1 Rollback Script ==="
echo ""
echo "Current HEAD: $COMMIT"
echo "Tag to create: $TAG"
echo ""

if [[ "${1:-}" != "--execute" ]]; then
  echo "[DRY RUN] Would execute:"
  echo "  1. git tag $TAG $COMMIT"
  echo "  2. git revert --no-commit HEAD   (adjust range as needed)"
  echo "  3. git commit -m 'revert: rollback Recommendation #1 lazy routes'"
  echo ""
  echo "Run with --execute to perform these actions."
  exit 0
fi

echo "Creating tag..."
git tag "$TAG" "$COMMIT"
echo "Tagged $COMMIT as $TAG"
echo ""
echo "To revert, run:"
echo "  git revert --no-commit <commit-range>"
echo "  git commit -m 'revert: rollback Recommendation #1 lazy routes'"
echo ""
echo "To restore after rollback:"
echo "  git revert HEAD"
echo "  # or: git reset --hard $TAG"
