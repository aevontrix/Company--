"""
Migration script to recalculate user levels after XP formula unification.

This script updates all UserProfile levels to match the unified formula:
    level = (xp // 2000) + 1

Run this after deploying the XP formula fixes to ensure all existing users
have correct levels based on their current XP.

Usage:
    cd backend
    python scripts/recalculate_levels.py
"""

import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'onthego.settings')
django.setup()

from apps.gamification.models import UserProfile


def recalculate_all_levels():
    """
    Recalculate levels for all user profiles using the unified formula.
    Formula: level = (xp // 2000) + 1
    """
    print("🔄 Starting level recalculation for all user profiles...")
    print("=" * 60)

    profiles = UserProfile.objects.all()
    total_count = profiles.count()
    updated_count = 0
    unchanged_count = 0

    print(f"📊 Found {total_count} user profiles to process\n")

    for profile in profiles:
        old_level = profile.level
        # Unified formula: 2000 XP per level
        new_level = (profile.xp // 2000) + 1

        if old_level != new_level:
            print(f"  👤 User: {profile.user.email}")
            print(f"     XP: {profile.xp}")
            print(f"     Level: {old_level} → {new_level}")

            profile.level = new_level
            profile.save(update_fields=['level'])
            updated_count += 1
            print(f"     ✅ Updated\n")
        else:
            unchanged_count += 1

    print("=" * 60)
    print(f"✅ Level recalculation complete!")
    print(f"   Total profiles: {total_count}")
    print(f"   Updated: {updated_count}")
    print(f"   Unchanged: {unchanged_count}")

    if updated_count > 0:
        print(f"\n⚠️  IMPORTANT: {updated_count} users had their levels updated.")
        print("   Consider notifying affected users about the level change.")
    else:
        print("\n✨ All levels were already correct. No changes needed.")


if __name__ == '__main__':
    try:
        recalculate_all_levels()
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
