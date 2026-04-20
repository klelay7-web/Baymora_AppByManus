-- Migration 0035: Conversation status + lastActivityAt
-- Note: conversations table already has title and status columns.
-- We need to add lastActivityAt and expand status options.
-- TiDB doesn't support ALTER COLUMN on enum easily, so we add a new column.
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS lastActivityAt TIMESTAMP NULL;
