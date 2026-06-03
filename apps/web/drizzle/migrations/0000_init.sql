CREATE TYPE user_role AS ENUM ('user', 'admin', 'banned');
CREATE TYPE chat_type AS ENUM ('direct', 'group');
CREATE TYPE member_role AS ENUM ('member', 'admin');
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE attachment_type AS ENUM ('image', 'file');
CREATE TYPE report_status AS ENUM ('open', 'in_review', 'resolved', 'dismissed');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id varchar(255) NOT NULL UNIQUE,
  email varchar(320) NOT NULL,
  username varchar(40) NOT NULL UNIQUE,
  avatar_url text,
  bio varchar(280),
  role user_role NOT NULL DEFAULT 'user',
  is_online boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_online_idx ON users(is_online);
CREATE INDEX users_role_idx ON users(role);
CREATE INDEX users_username_search_idx ON users(lower(username));

CREATE TABLE chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type chat_type NOT NULL,
  created_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chats_type_idx ON chats(type);
CREATE INDEX chats_last_message_idx ON chats(last_message_at);

CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL UNIQUE REFERENCES chats(id) ON DELETE CASCADE,
  name varchar(80) NOT NULL,
  description varchar(600),
  avatar_url text,
  created_by_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX groups_name_idx ON groups(lower(name));

CREATE TABLE group_members (
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX group_members_role_idx ON group_members(role);
CREATE INDEX group_members_user_idx ON group_members(user_id);

CREATE TABLE chat_members (
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  last_read_message_id uuid,
  muted boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chat_id, user_id)
);
CREATE INDEX chat_members_user_idx ON chat_members(user_id);
CREATE INDEX chat_members_role_idx ON chat_members(role);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body text,
  reply_to_message_id uuid,
  edited_at timestamptz,
  deleted_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_chat_created_idx ON messages(chat_id, created_at);
CREATE INDEX messages_sender_idx ON messages(sender_id);
CREATE INDEX messages_reply_idx ON messages(reply_to_message_id);
CREATE INDEX messages_body_search_idx ON messages USING GIN (to_tsvector('english', coalesce(body, '')));

CREATE TABLE attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type attachment_type NOT NULL,
  url text NOT NULL,
  file_name varchar(255) NOT NULL,
  mime_type varchar(120) NOT NULL,
  size_bytes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX attachments_message_idx ON attachments(message_id);
CREATE INDEX attachments_type_idx ON attachments(type);

CREATE TABLE reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji varchar(20) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX reactions_message_user_emoji_uniq ON reactions(message_id, user_id, emoji);
CREATE INDEX reactions_message_idx ON reactions(message_id);

CREATE TABLE message_reads (
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
CREATE INDEX message_reads_user_idx ON message_reads(user_id);

CREATE TABLE typing_status (
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_typing boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chat_id, user_id)
);
CREATE INDEX typing_status_updated_idx ON typing_status(updated_at);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  type varchar(60) NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_created_idx ON notifications(user_id, created_at);
CREATE INDEX notifications_unread_idx ON notifications(user_id, read_at);

CREATE TABLE friendships (
  requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (requester_id, addressee_id)
);
CREATE INDEX friendships_addressee_idx ON friendships(addressee_id);
CREATE INDEX friendships_status_idx ON friendships(status);

CREATE TABLE blocked_users (
  blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);
CREATE INDEX blocked_users_blocked_idx ON blocked_users(blocked_id);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reason varchar(240) NOT NULL,
  status report_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reports_status_idx ON reports(status);
CREATE INDEX reports_created_idx ON reports(created_at);
