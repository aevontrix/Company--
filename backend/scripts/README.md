# Backend Migration Scripts

This directory contains utility scripts for database migrations and data fixes.

## Available Scripts

### recalculate_levels.py

Recalculates user levels after XP formula unification.

**When to run:**
- After deploying XP formula fixes (services.py, signals.py updates)
- If you notice users with incorrect levels
- After importing legacy data

**How to run:**
```bash
cd backend
python scripts/recalculate_levels.py
```

**What it does:**
- Recalculates all user levels using the unified formula: `level = (xp // 2000) + 1`
- Shows which users were updated with old → new level
- Reports statistics at the end

**Example output:**
```
🔄 Starting level recalculation for all user profiles...
============================================================
📊 Found 15 user profiles to process

  👤 User: john@example.com
     XP: 5000
     Level: 3 → 3
     ✅ Updated

  👤 User: alice@example.com
     XP: 12000
     Level: 9 → 7
     ✅ Updated

============================================================
✅ Level recalculation complete!
   Total profiles: 15
   Updated: 8
   Unchanged: 7

⚠️  IMPORTANT: 8 users had their levels updated.
   Consider notifying affected users about the level change.
```

## Notes

- These scripts use Django ORM and require proper settings configuration
- Always backup your database before running migration scripts
- Run in a test environment first to verify results
