const pool = require("./db");

const MIGRATIONS = [
  "CREATE EXTENSION IF NOT EXISTS pgcrypto",
  `
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role')
         AND EXISTS (
           SELECT 1
           FROM pg_enum e
           JOIN pg_type t ON t.oid = e.enumtypid
           WHERE t.typname = 'user_role' AND e.enumlabel = 'agent'
         ) THEN
        ALTER TYPE user_role RENAME VALUE 'agent' TO 'user';
      END IF;

      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum')
         AND EXISTS (
           SELECT 1
           FROM pg_enum e
           JOIN pg_type t ON t.oid = e.enumtypid
           WHERE t.typname = 'role_enum' AND e.enumlabel = 'agent'
         ) THEN
        ALTER TYPE role_enum RENAME VALUE 'agent' TO 'user';
      END IF;
    END $$;
  `,
  `
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organisations') THEN
        ALTER TABLE organisations ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMPTZ;
      END IF;
    END $$;
  `,
  `
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
      ) THEN
        ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
      END IF;
    END $$;
  `,
  `
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets') THEN
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
      END IF;
    END $$;
  `,
  `
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organisations') THEN
        UPDATE organisations
        SET plan = 'free', plan_updated_at = NOW()
        WHERE id = 1 AND plan::text <> 'free';
      END IF;
    END $$;
  `,
  `
    CREATE TABLE IF NOT EXISTS plan_limits (
      plan VARCHAR PRIMARY KEY,
      max_users INTEGER,
      max_tickets INTEGER,
      analytics VARCHAR,
      csv_export BOOLEAN
    );
  `,
  `
    INSERT INTO plan_limits (plan, max_users, max_tickets, analytics, csv_export)
    VALUES
      ('free', 3, 50, 'basic', false),
      ('plus', 10, 500, 'full', false),
      ('pro', NULL, NULL, 'full', true)
    ON CONFLICT (plan) DO UPDATE
      SET max_users = EXCLUDED.max_users,
          max_tickets = EXCLUDED.max_tickets,
          analytics = EXCLUDED.analytics,
          csv_export = EXCLUDED.csv_export;
  `,
  `
    INSERT INTO users (org_id, name, email, password_hash, role, active)
    SELECT
      1,
      'Demo User',
      'user@zebrasupport.io',
      crypt('Password123!', gen_salt('bf')),
      'user',
      true
    WHERE EXISTS (SELECT 1 FROM organisations WHERE id = 1)
      AND NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = 'user@zebrasupport.io');
  `,
  `
    UPDATE tickets t
    SET submitted_by = u.id
    FROM users u
    WHERE t.submitted_by IS NULL
      AND t.org_id = u.org_id
      AND lower(t.requester_email) = lower(u.email);
  `,
  `
    INSERT INTO tickets (
      org_id,
      submitted_by,
      assigned_to,
      subject,
      description,
      requester_name,
      requester_email,
      company,
      status,
      priority,
      topic,
      is_read,
      is_demo,
      created_at,
      updated_at
    )
    SELECT
      u.org_id,
      u.id,
      assignee.id,
      demo.subject,
      demo.description,
      'Demo User',
      'user@zebrasupport.io',
      o.name,
      demo.status,
      demo.priority,
      demo.topic,
      demo.is_read,
      false,
      NOW() - demo.created_offset,
      NOW() - demo.updated_offset
    FROM users u
    JOIN organisations o ON o.id = u.org_id
    LEFT JOIN LATERAL (
      SELECT id
      FROM users
      WHERE org_id = u.org_id AND role IN ('org_admin', 'user') AND active = true
      ORDER BY CASE role WHEN 'org_admin' THEN 1 ELSE 2 END, id ASC
      LIMIT 1
    ) assignee ON true
    CROSS JOIN (
      VALUES
        (
          'Cannot log into my account',
          'I am unable to log in with my registered credentials. Please help me restore access.',
          'Open',
          'Medium',
          'Account Access',
          false,
          INTERVAL '3 days',
          INTERVAL '3 days'
        ),
        (
          'Invoice not received for March',
          'I have not received the March invoice yet. Could you resend it to my billing email?',
          'Closed',
          'Low',
          'Billing Query',
          true,
          INTERVAL '9 days',
          INTERVAL '8 days'
        ),
        (
          'App crashes on mobile browser',
          'The app crashes whenever I open the ticket list on mobile Safari.',
          'Escalated',
          'High',
          NULL,
          false,
          INTERVAL '1 day',
          INTERVAL '20 hours'
        )
    ) AS demo(subject, description, status, priority, topic, is_read, created_offset, updated_offset)
    WHERE lower(u.email) = 'user@zebrasupport.io'
      AND NOT EXISTS (
        SELECT 1 FROM tickets t2
        WHERE t2.org_id = u.org_id AND t2.subject = 'Cannot log into my account'
      );
  `
];

const runRuntimeMigrations = async () => {
  for (const migration of MIGRATIONS) {
    // eslint-disable-next-line no-await-in-loop
    await pool.query(migration);
  }
};

module.exports = {
  runRuntimeMigrations
};
