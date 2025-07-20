import { 
  users, 
  projects, 
  actions,
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type Action,
  type InsertAction,
  type UpdateAction,
  type ActionWithRelations
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Projects
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  getAllProjects(): Promise<Project[]>;

  // Actions
  getAction(id: number): Promise<ActionWithRelations | undefined>;
  getAllActions(filters?: {
    discipline?: string;
    status?: string;
    assigneeId?: number;
    projectId?: number;
    search?: string;
  }): Promise<ActionWithRelations[]>;
  createAction(action: InsertAction): Promise<Action>;
  updateAction(id: number, updates: UpdateAction): Promise<Action | undefined>;
  deleteAction(id: number): Promise<boolean>;
  getActionStats(): Promise<{
    open: number;
    closed: number;
    total: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  // Actions
  async getAction(id: number): Promise<ActionWithRelations | undefined> {
    const [action] = await db
      .select()
      .from(actions)
      .leftJoin(users, eq(actions.assigneeId, users.id))
      .leftJoin(projects, eq(actions.projectId, projects.id))
      .where(eq(actions.id, id));

    if (!action) return undefined;

    return {
      ...action.actions,
      assignee: action.users || undefined,
      project: action.projects || undefined,
    };
  }

  async getAllActions(filters?: {
    discipline?: string;
    status?: string;
    assigneeId?: number;
    projectId?: number;
    search?: string;
  }): Promise<ActionWithRelations[]> {
    const conditions = [];

    if (filters?.discipline) {
      conditions.push(eq(actions.discipline, filters.discipline));
    }

    if (filters?.status) {
      conditions.push(eq(actions.status, filters.status));
    }

    if (filters?.assigneeId) {
      conditions.push(eq(actions.assigneeId, filters.assigneeId));
    }

    if (filters?.projectId) {
      conditions.push(eq(actions.projectId, filters.projectId));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(actions.title, `%${filters.search}%`),
          ilike(actions.description, `%${filters.search}%`)
        )
      );
    }

    const baseQuery = db
      .select()
      .from(actions)
      .leftJoin(users, eq(actions.assigneeId, users.id))
      .leftJoin(projects, eq(actions.projectId, projects.id))
      .orderBy(desc(actions.createdAt));

    const results = conditions.length > 0 
      ? await baseQuery.where(and(...conditions))
      : await baseQuery;

    return results.map(result => ({
      ...result.actions,
      assignee: result.users || undefined,
      project: result.projects || undefined,
    }));
  }

  async createAction(insertAction: InsertAction): Promise<Action> {
    const [action] = await db
      .insert(actions)
      .values({
        ...insertAction,
        updatedAt: new Date(),
      })
      .returning();
    return action;
  }

  async updateAction(id: number, updates: UpdateAction): Promise<Action | undefined> {
    const [action] = await db
      .update(actions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(actions.id, id))
      .returning();
    return action || undefined;
  }

  async deleteAction(id: number): Promise<boolean> {
    const result = await db
      .delete(actions)
      .where(eq(actions.id, id))
      .returning();
    return result.length > 0;
  }

  async getActionStats(): Promise<{
    open: number;
    closed: number;
    total: number;
  }> {
    const allActions = await db.select().from(actions);
    
    const stats = {
      open: allActions.filter(a => a.status === 'open').length,
      closed: allActions.filter(a => a.status === 'closed').length,
      total: allActions.length,
    };

    return stats;
  }
}

export const storage = new DatabaseStorage();
