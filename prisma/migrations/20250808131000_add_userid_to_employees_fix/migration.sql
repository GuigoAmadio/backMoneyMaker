-- Ajuste incremental: adiciona e popula user_id em employees e remove password

-- 1) Adiciona a coluna user_id (TEXT, para compatibilidade com ids TEXT existentes)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id text;

-- 2) Popula user_id casando (client_id, email) entre users e employees
UPDATE employees e
SET user_id = u.id
FROM users u
WHERE u.client_id = e.client_id
  AND LOWER(u.email) = LOWER(e.email)
  AND e.user_id IS NULL;

-- 3) Índice único em (client_id, user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'employees_client_id_user_id_key'
  ) THEN
    CREATE UNIQUE INDEX employees_client_id_user_id_key ON employees (client_id, user_id);
  END IF;
END $$;

-- 4) FK para users(id)
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

-- 5) Remove coluna password, se existir
ALTER TABLE employees DROP COLUMN IF EXISTS password;


