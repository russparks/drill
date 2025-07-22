import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  discipline: text("discipline"), // operations, commercial, design, she, qa
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  projectNumber: text("project_number"),
  name: text("name").notNull(),
  startOnSiteDate: timestamp("start_on_site_date"),
  contractCompletionDate: timestamp("contract_completion_date"),
  constructionCompletionDate: timestamp("construction_completion_date"),
  status: text("status", { enum: ["tender", "precon", "construction", "aftercare"] }).notNull().default("tender"),
  description: text("description"),
  value: text("value"),
  retention: text("retention"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  discipline: text("discipline").notNull(), // operations, commercial, design, she, qa, general
  phase: text("phase").notNull().default("construction"), // tender, precon, construction, aftercare, strategy  
  status: text("status").notNull().default("open"), // open, closed, overdue
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  assigneeId: integer("assignee_id").references(() => users.id),
  projectId: integer("project_id").references(() => projects.id),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedActions: many(actions),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  actions: many(actions),
}));

export const actionsRelations = relations(actions, ({ one }) => ({
  assignee: one(users, {
    fields: [actions.assigneeId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [actions.projectId],
    references: [projects.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
}).extend({
  startOnSiteDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  contractCompletionDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  constructionCompletionDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
});

export const insertActionSchema = createInsertSchema(actions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
});

export const updateActionSchema = insertActionSchema.partial();

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertAction = z.infer<typeof insertActionSchema>;
export type UpdateAction = z.infer<typeof updateActionSchema>;
export type Action = typeof actions.$inferSelect;

// Extended types with relations
export type ActionWithRelations = Action & {
  assignee?: User;
  project?: Project;
};
