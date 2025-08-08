---
title: "Database Migration Strategy"
shortId: "database-migrations"
projects: ["Node.js API Development"]
tags: ["Database", "Backend"]
---

# Database Migration Strategy

Best practices for handling database schema changes in production applications.

## Migration Principles

### 1. Always Backwards Compatible
- Add columns, don't remove
- Create new tables before dropping old ones
- Use feature flags for breaking changes

### 2. Test Migrations Thoroughly
```bash
# Test on copy of production data
pg_dump production_db | psql test_db
npm run migrate:test
```

### 3. Rollback Strategy
Every migration should have a rollback:
```sql
-- Migration up
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;

-- Migration down  
ALTER TABLE users DROP COLUMN email_verified;
```

## Deployment Checklist
- [ ] Test migration on staging
- [ ] Verify rollback procedure
- [ ] Monitor performance impact
- [ ] Update documentation