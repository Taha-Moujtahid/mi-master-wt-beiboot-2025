import { pgTable, serial, text, integer, timestamp, foreignKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Keycloak user id
  username: text('username').notNull(),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  userId: text('user_id').notNull().references(() => users.id),
  public: integer('public').notNull().default(0), // 0 = private, 1 = public
  createdAt: timestamp('created_at').defaultNow(),
});

export const images = pgTable('images', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  filename: text('filename'),
  projectId: integer('project_id').notNull().references(() => projects.id),
  userId: text('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});
