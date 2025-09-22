
import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { projects, users } from '../schema';
import { eq, or } from 'drizzle-orm';

@Injectable()
export class ProjectsService {
  // POST /projects
  async createProject(userId: string, name: string, isPublic: boolean = false) {
    // Check if user exists before creating a project
    let userResult = await db.select().from(users).where(eq(users.id, userId));
    if (!userResult.length) {
      await db.insert(users).values({ id: userId, username: 'unknown' });
    }
    const [project] = await db.insert(projects).values({ name, userId, public: isPublic ? 1 : 0 }).returning();
    return { id: project.id };
  }

  // GET /projects (user)
  async getProjects(userId: string) {
    // Return all projects owned by the user
    const result = await db.select().from(projects).where(eq(projects.userId, userId));
    return Array.isArray(result) ? result : [];
  }

  // GET /projects (anonym)
  async getPublicProjects() {
    // Return all public projects
    const result = await db.select().from(projects).where(eq(projects.public, 1));
    return Array.isArray(result) ? result : [];
  }

  // PUT /projects
  async updateProject(userId: string, projectId: number, name: string, isPublic: boolean) {
    // Only allow update if user owns the project
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) {
      throw new Error('Project not found');
    }
    if (project.userId !== userId) {
      throw new Error('Unauthorized');
    }
    await db.update(projects)
      .set({ name, public: isPublic ? 1 : 0 })
      .where(eq(projects.id, projectId));
    return { success: true };
  }
}
