-- Enable RLS on realtime.messages to prevent unauthorized broadcast/presence subscriptions.
-- Postgres_changes subscriptions are not affected by this; they continue to enforce RLS on the source tables.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop any prior policy with the same name to keep this migration idempotent.
DROP POLICY IF EXISTS "Users can access only their own realtime topics" ON realtime.messages;

-- Allow access only when the channel topic is scoped to the authenticated user's ID.
-- Expected topic format: "user:<auth.uid()>" or "user:<auth.uid()>:<anything>".
CREATE POLICY "Users can access only their own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() = 'user:' || auth.uid()::text)
  OR (realtime.topic() LIKE 'user:' || auth.uid()::text || ':%')
);

CREATE POLICY "Users can send only to their own realtime topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (realtime.topic() = 'user:' || auth.uid()::text)
  OR (realtime.topic() LIKE 'user:' || auth.uid()::text || ':%')
);