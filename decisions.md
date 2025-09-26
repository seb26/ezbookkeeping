# Decisions

## transaction.vendor_id and transaction_template.vendor_id being `NOT NULL DEFAULT 0`

These may be the first major field introduced to table `transaction` since version 0.2.

Codebase does not have database migration infrastructure.

Chose from scenarios:
- transaction.vendor_id is `NOT NULL DEFAULT 0`
- transaction.vendor_id is `NOT NULL`, migration sql is run inside go app
- transaction.vendor_id is NOT NULL, migration sql is run external to the app using golang-migrate

Chosen to set to `NOT NULL DEFAULT 0` because quicker to implement this, than to implement migration.

Migration is OK but requires work to support postgres, sqlite and mysql backends.

Migrations have to be idempotent and postgres can but sqlite cannot without app logic to check existing columns, which means go code and adding migration functions.

Honestly probably not too much work given that I am here typing out this explanation...

Open to a proper migration code if my fork is to be released...