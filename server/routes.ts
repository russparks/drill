import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertActionSchema, updateActionSchema, insertProjectSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Actions routes
  app.get("/api/actions", async (req, res) => {
    try {
      const filters = {
        discipline: req.query.discipline as string,
        phase: req.query.phase as string,
        status: req.query.status as string,
        assigneeId: req.query.assigneeId ? parseInt(req.query.assigneeId as string) : undefined,
        assignee: req.query.assignee as string,
        projectId: req.query.projectId ? parseInt(req.query.projectId as string) : undefined,
        search: req.query.search as string,
      };

      // Remove undefined values
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      );

      const actions = await storage.getAllActions(cleanFilters);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch actions" });
    }
  });

  app.get("/api/actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const action = await storage.getAction(id);
      
      if (!action) {
        return res.status(404).json({ message: "Action not found" });
      }
      
      res.json(action);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch action" });
    }
  });

  app.post("/api/actions", async (req, res) => {
    try {
      console.log('Received action data:', req.body);
      const validatedData = insertActionSchema.parse(req.body);
      console.log('Validated action data:', validatedData);
      const action = await storage.createAction(validatedData);
      res.status(201).json(action);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('Validation errors:', error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.log('Server error:', error);
      res.status(500).json({ message: "Failed to create action" });
    }
  });

  app.patch("/api/actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateActionSchema.parse(req.body);
      const action = await storage.updateAction(id, validatedData);
      
      if (!action) {
        return res.status(404).json({ message: "Action not found" });
      }
      
      res.json(action);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update action" });
    }
  });

  app.delete("/api/actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAction(id);
      
      if (!success) {
        return res.status(404).json({ message: "Action not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete action" });
    }
  });

  // Stats route
  app.get("/api/stats", async (req, res) => {
    try {
      const actionStats = await storage.getActionStats();
      const projects = await storage.getAllProjects();
      const users = await storage.getAllUsers();
      
      const stats = {
        ...actionStats,
        projects: projects.length,
        teamMembers: users.length,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Users routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      console.log('Received user data:', req.body);
      const validatedData = insertUserSchema.parse(req.body);
      console.log('Validated user data:', validatedData);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        console.log('User validation errors:', error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.constraint === 'users_email_unique') {
          return res.status(400).json({ message: "Email address already exists" });
        }
        if (error.constraint === 'users_username_unique') {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      console.log('User creation error:', error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Projects routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, validatedData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, validatedData);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProject(id);
      
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Google Maps API key endpoint
  app.get("/api/google-maps-key", async (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(404).json({ message: "Google Maps API key not configured" });
      }
      res.send(apiKey);
    } catch (error) {
      res.status(500).json({ message: "Failed to get API key" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
