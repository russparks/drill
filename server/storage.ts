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
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Projects
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  getAllProjects(): Promise<Project[]>;

  // Actions
  getAction(id: number): Promise<ActionWithRelations | undefined>;
  getAllActions(filters?: {
    discipline?: string;
    status?: string;
    assigneeId?: number;
    assignee?: string;
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

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // First check if user has any actions assigned
      const userActions = await db.select().from(actions).where(eq(actions.assigneeId, id));
      if (userActions.length > 0) {
        // Set assigneeId to null for all actions assigned to this user
        await db.update(actions).set({ assigneeId: null }).where(eq(actions.assigneeId, id));
      }
      
      const result = await db.delete(users).where(eq(users.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
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

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    try {
      // First check if project has any actions
      const projectActions = await db.select().from(actions).where(eq(actions.projectId, id));
      if (projectActions.length > 0) {
        // Set projectId to null for all actions in this project
        await db.update(actions).set({ projectId: null }).where(eq(actions.projectId, id));
      }
      
      const result = await db.delete(projects).where(eq(projects.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
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
    phase?: string;
    status?: string;
    assigneeId?: number;
    assignee?: string;
    projectId?: number;
    search?: string;
  }): Promise<ActionWithRelations[]> {
    const conditions = [];

    if (filters?.discipline) {
      conditions.push(eq(actions.discipline, filters.discipline));
    }

    if (filters?.phase) {
      conditions.push(eq(actions.phase, filters.phase));
    }

    if (filters?.status) {
      conditions.push(eq(actions.status, filters.status));
    }

    if (filters?.assigneeId) {
      conditions.push(eq(actions.assigneeId, filters.assigneeId));
    }

    if (filters?.assignee) {
      conditions.push(ilike(users.name, `%${filters.assignee}%`));
    }

    if (filters?.projectId) {
      conditions.push(eq(actions.projectId, filters.projectId));
    }

    if (filters?.search) {
      conditions.push(
        ilike(actions.description, `%${filters.search}%`)
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
