-- Add user_id (text) to employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id text;

-- Populate user_id by matching (client_id, email)
UPDATE employees e
SET user_id = u.id
FROM users u
WHERE u.client_id = e.client_id
  AND LOWER(u.email) = LOWER(e.email)
  AND e.user_id IS NULL;

-- Add UNIQUE (client_id, user_id) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'employees_client_id_user_id_key'
  ) THEN
    CREATE UNIQUE INDEX employees_client_id_user_id_key ON employees (client_id, user_id);
  END IF;
END $$;

-- Add FK employees(user_id) -> users(id) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'employees' AND constraint_name = 'employees_user_id_fkey'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Conditionally set NOT NULL if no NULLs remain
DO $$
DECLARE
  missing_count integer;
BEGIN
  SELECT COUNT(*) INTO missing_count FROM employees WHERE user_id IS NULL;
  IF missing_count = 0 THEN
    ALTER TABLE employees ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Remove legacy password column if exists
ALTER TABLE employees DROP COLUMN IF EXISTS password;


