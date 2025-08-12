-- 1) Adiciona a coluna user_id (nullable inicialmente)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id text;

-- 2) Popula user_id casando (client_id, email) entre users e employees
UPDATE employees e
SET user_id = u.id
FROM users u
WHERE u.client_id = e.client_id
  AND LOWER(u.email) = LOWER(e.email)
  AND e.user_id IS NULL;

-- 3) Tornar NOT NULL apenas se todos os registros estiverem populados
DO $$
DECLARE
  missing_count integer;
BEGIN
  SELECT COUNT(*) INTO missing_count FROM employees WHERE user_id IS NULL;
  IF missing_count = 0 THEN
    ALTER TABLE employees ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- 4) Cria unicidade por (client_id, user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'employees_client_id_user_id_key'
  ) THEN
    CREATE UNIQUE INDEX employees_client_id_user_id_key ON employees (client_id, user_id);
  END IF;
END $$;

-- 5) Adiciona FK para users(id) com delete em cascata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'employees' AND constraint_name = 'employees_user_id_fkey'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6) Remove a coluna password da tabela employees, se existir
ALTER TABLE employees DROP COLUMN IF EXISTS password;


