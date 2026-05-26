# Database Migration Skill

Apply these patterns for safe, zero-downtime database migrations:

## Pre-Migration Checklist
- [ ] Migration is idempotent (`IF NOT EXISTS`, `IF EXISTS` guards)
- [ ] Rollback script exists and has been tested
- [ ] Migration has been tested on a copy of production data
- [ ] Backup taken before applying to production

## Rollback Strategy
Every migration must have a paired `down` migration:
```sql
-- up.sql
ALTER TABLE users ADD COLUMN last_login TEXT;

-- down.sql  
ALTER TABLE users DROP COLUMN last_login;
```

## Zero-Downtime Patterns
1. **Add nullable column** → deploy code that writes new column → backfill → add NOT NULL constraint
2. **Rename column** → add new column → dual-write → migrate reads → drop old column
3. **Add index** → use `CREATE INDEX CONCURRENTLY` (Postgres) or offline window (SQLite)
4. **Delete column** → remove all references in code → deploy → drop column

## Data Integrity Checks
Before migration:
```sql
-- Verify no nulls in column to become NOT NULL
SELECT COUNT(*) FROM table WHERE column IS NULL;

-- Verify foreign key consistency
SELECT COUNT(*) FROM child WHERE parent_id NOT IN (SELECT id FROM parent);
```

## SQLite Specifics
SQLite has limited ALTER TABLE support. To rename/remove columns:
1. Create new table with desired schema
2. Copy data: `INSERT INTO new SELECT ... FROM old`
3. Drop old table
4. Rename new table

## Measurement Criteria
- Migration completes in < 30s for tables under 1M rows
- Zero downtime: application continues serving traffic during migration
- Row counts match before/after
