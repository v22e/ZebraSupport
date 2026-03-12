CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS notification_preferences;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS demo_requests;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS plan_limits;
DROP TABLE IF EXISTS organisations;
DROP TYPE IF EXISTS role_enum;
DROP TYPE IF EXISTS organisation_status;
DROP TYPE IF EXISTS plan_tier;
DROP TYPE IF EXISTS demo_request_status;

CREATE TYPE role_enum AS ENUM ('superadmin', 'org_owner', 'org_admin', 'user');
CREATE TYPE organisation_status AS ENUM ('active', 'suspended');
CREATE TYPE plan_tier AS ENUM ('free', 'plus', 'pro');
CREATE TYPE demo_request_status AS ENUM ('new', 'contacted', 'converted', 'closed');

CREATE TABLE organisations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  plan plan_tier NOT NULL DEFAULT 'free',
  plan_updated_at TIMESTAMPTZ,
  status organisation_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE plan_limits (
  plan VARCHAR PRIMARY KEY,
  max_users INTEGER,
  max_tickets INTEGER,
  analytics VARCHAR,
  csv_export BOOLEAN
);

INSERT INTO plan_limits (plan, max_users, max_tickets, analytics, csv_export)
VALUES
  ('free', 3, 50, 'basic', false),
  ('plus', 10, 500, 'full', false),
  ('pro', NULL, NULL, 'full', true);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organisations(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role role_enum NOT NULL DEFAULT 'user',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  refresh_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (NOT (role = 'superadmin' AND org_id IS NOT NULL)),
  CHECK (NOT (role <> 'superadmin' AND org_id IS NULL))
);

CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requester_name VARCHAR(120) NOT NULL,
  requester_email VARCHAR(180) NOT NULL,
  company VARCHAR(180) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Auto-Replied', 'Escalated', 'Closed')),
  priority VARCHAR(10) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  topic VARCHAR(80),
  ai_reply TEXT,
  manual_reply TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE demo_requests (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  company VARCHAR,
  phone VARCHAR,
  message TEXT,
  interested_plan VARCHAR,
  org_id INTEGER REFERENCES organisations(id) ON DELETE SET NULL,
  status demo_request_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  org_id INTEGER REFERENCES organisations(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  body TEXT,
  link VARCHAR,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_org_id ON notifications(org_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

CREATE TABLE notification_preferences (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR,
  enabled BOOLEAN DEFAULT true,
  PRIMARY KEY (user_id, type)
);

INSERT INTO organisations (id, name, plan, plan_updated_at, status)
VALUES (1, 'ZebraSupport Demo Org', 'free', NOW(), 'active');

INSERT INTO users (id, org_id, name, email, password_hash, role, active)
VALUES
  (1, NULL, 'Zebra Platform Admin', 'superadmin@zebrasupport.io', crypt('SuperAdmin123!', gen_salt('bf')), 'superadmin', TRUE),
  (2, 1, 'Zara Bennett', 'admin@zebrasupport.io', crypt('Password123!', gen_salt('bf')), 'org_owner', TRUE),
  (3, 1, 'Riley Stone', 'agent@zebrasupport.io', crypt('Password123!', gen_salt('bf')), 'user', TRUE),
  (4, 1, 'Demo User', 'user@zebrasupport.io', crypt('Password123!', gen_salt('bf')), 'user', TRUE);

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
VALUES
  (
    1,
    4,
    3,
    'Cannot log into my account',
    'I am unable to log in with my registered credentials. Please help me restore access.',
    'Demo User',
    'user@zebrasupport.io',
    'ZebraSupport Demo Org',
    'Open',
    'Medium',
    'Account Access',
    false,
    false,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    1,
    4,
    3,
    'Invoice not received for March',
    'I have not received the March invoice yet. Could you resend it to my billing email?',
    'Demo User',
    'user@zebrasupport.io',
    'ZebraSupport Demo Org',
    'Closed',
    'Low',
    'Billing Query',
    true,
    false,
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '8 days'
  ),
  (
    1,
    4,
    3,
    'App crashes on mobile browser',
    'The app crashes whenever I open the ticket list on mobile Safari.',
    'Demo User',
    'user@zebrasupport.io',
    'ZebraSupport Demo Org',
    'Escalated',
    'High',
    NULL,
    false,
    false,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '20 hours'
  );

INSERT INTO notification_preferences (user_id, type, enabled)
SELECT
  u.id,
  t.type,
  true
FROM users u
CROSS JOIN (
  VALUES
    ('ticket_created'),
    ('ticket_replied'),
    ('ticket_escalated'),
    ('ticket_closed'),
    ('ticket_assigned'),
    ('ticket_auto_replied'),
    ('user_invited'),
    ('user_role_changed'),
    ('user_deactivated'),
    ('plan_limit_warning'),
    ('plan_limit_reached'),
    ('demo_request_received'),
    ('org_suspended'),
    ('new_org_registered')
) AS t(type);

SELECT setval('organisations_id_seq', COALESCE((SELECT MAX(id) FROM organisations), 1), true);
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1), true);
SELECT setval('tickets_id_seq', COALESCE((SELECT MAX(id) FROM tickets), 1), true);
SELECT setval('demo_requests_id_seq', COALESCE((SELECT MAX(id) FROM demo_requests), 1), true);
SELECT setval('notifications_id_seq', COALESCE((SELECT MAX(id) FROM notifications), 1), true);
