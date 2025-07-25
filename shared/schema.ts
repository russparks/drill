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
  postcode: text("postcode"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  
  // Package 1
  packageOneNumber: text("package_one_number"),
  packageOneStartDate: timestamp("package_one_start_date"),
  packageOneEndDate: timestamp("package_one_end_date"),
  packageOneCompany: text("package_one_company"),
  
  // Package 2
  packageTwoNumber: text("package_two_number"),
  packageTwoStartDate: timestamp("package_two_start_date"),
  packageTwoEndDate: timestamp("package_two_end_date"),
  packageTwoCompany: text("package_two_company"),
  
  // Package 3
  packageThreeNumber: text("package_three_number"),
  packageThreeStartDate: timestamp("package_three_start_date"),
  packageThreeEndDate: timestamp("package_three_end_date"),
  packageThreeCompany: text("package_three_company"),
  
  // Package 4
  packageFourNumber: text("package_four_number"),
  packageFourStartDate: timestamp("package_four_start_date"),
  packageFourEndDate: timestamp("package_four_end_date"),
  packageFourCompany: text("package_four_company"),
  
  // Package 5
  packageFiveNumber: text("package_five_number"),
  packageFiveStartDate: timestamp("package_five_start_date"),
  packageFiveEndDate: timestamp("package_five_end_date"),
  packageFiveCompany: text("package_five_company"),
  
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
  
  // Package date transformations
  packageOneStartDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  packageOneEndDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  packageTwoStartDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  packageTwoEndDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  packageThreeStartDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  packageThreeEndDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  packageFourStartDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  packageFourEndDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  packageFiveStartDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  packageFiveEndDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
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
