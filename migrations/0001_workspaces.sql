PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS task_checklists;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS columns;
DROP TABLE IF EXISTS board_members;
DROP TABLE IF EXISTS boards;

CREATE TABLE boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE board_members (
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('owner', 'member')),
  invited_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY(board_id, user_id)
);
CREATE INDEX idx_board_members_user ON board_members(user_id);
CREATE TABLE columns (
  id TEXT NOT NULL CHECK(id IN ('todo', 'in_progress', 'done')),
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position REAL NOT NULL,
  PRIMARY KEY(board_id, id)
);
CREATE INDEX idx_columns_board ON columns(board_id);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id),
  column_id TEXT NOT NULL CHECK(column_id IN ('todo', 'in_progress', 'done')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  due_date TEXT,
  position REAL NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO boards (id, name, created_at)
SELECT 'board-' || id, 'My Tasks', created_at FROM users;
INSERT INTO board_members (board_id, user_id, role)
SELECT 'board-' || id, id, 'owner' FROM users;
INSERT INTO columns (id, board_id, name, position)
SELECT defaults.column_id, boards.id, defaults.name, defaults.position
FROM (SELECT 'todo' AS column_id, 'To Do' AS name, 0 AS position UNION ALL
      SELECT 'in_progress', 'In Progress', 1 UNION ALL
      SELECT 'done', 'Done', 2) AS defaults
CROSS JOIN boards;
CREATE INDEX idx_tasks_board_column ON tasks(board_id, column_id);
CREATE INDEX idx_tasks_board_position ON tasks(board_id, column_id, position);
CREATE TABLE task_checklists (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
  position INTEGER NOT NULL
);
CREATE INDEX idx_checklists_task ON task_checklists(task_id, position);

PRAGMA foreign_keys=ON;
