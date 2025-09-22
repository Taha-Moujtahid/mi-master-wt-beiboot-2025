
import { Controller, Post, Get, Put, Delete, Body, Req, UseGuards, Query, Param, UploadedFiles, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { KeycloakAuthGuard } from '../keycloak-auth.guard';
import { Request } from 'express';
import { minioClient, MINIO_BUCKET } from '../minio';
import { opensearchClient } from '../opensearch';
import { projects, images } from '../schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { FilesInterceptor } from '@nestjs/platform-express';
import { exiftool } from 'exiftool-vendored';
import * as fs from 'fs';
import * as path from 'path';



@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // POST /projects/:projectId/images
  @UseGuards(KeycloakAuthGuard)
  @Post(':projectId/images')
  @UseInterceptors(FilesInterceptor('images'))
  async uploadImages(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const user = (req as any).user;
    if (!files || files.length === 0) throw new BadRequestException('No files uploaded');
    // Check project ownership
    const [project] = await db.select().from(projects).where(eq(projects.id, +projectId));
    if (!project || project.userId !== user.id) throw new BadRequestException('Unauthorized or project not found');
    // Upload to MinIO and index in OpenSearch
    const uploaded = [];
    for (const file of files) {
      const objectName = `${user.id}/${projectId}/${file.originalname}`;
      await minioClient.putObject(MINIO_BUCKET, objectName, file.buffer);
      const [img] = await db.insert(images).values({
        url: objectName,
        filename: file.originalname,
        projectId: +projectId,
        userId: user.id,
      }).returning();
      await opensearchClient.index({
        index: 'images',
        id: String(img.id),
        body: { ...img, projectPublic: project.public === 1 },
      });
      uploaded.push(img);
    }
    return uploaded;
  }

  // PUT /projects/:projectId/image/:imageId
  @UseGuards(KeycloakAuthGuard)
  @Put(':projectId/image/:imageId')
  async updateImage(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('imageId') imageId: string,
    @Body() body: { name?: string }
  ) {
    const user = (req as any).user;
    // Check image ownership
    const [img] = await db.select().from(images).where(eq(images.id, +imageId));
    if (!img || img.userId !== user.id || img.projectId !== +projectId) throw new BadRequestException('Unauthorized or image not found');
    // Optionally rename in MinIO (not implemented here)
    // Update DB and OpenSearch
    await db.update(images).set({ url: body.name || img.url }).where(eq(images.id, +imageId));
    await opensearchClient.update({
      index: 'images',
      id: String(imageId),
      body: { doc: { url: body.name || img.url } },
    });
    return { success: true };
  }

  // DELETE /projects/:projectId/image/:imageId
  @UseGuards(KeycloakAuthGuard)
  @Delete(':projectId/image/:imageId')
  async deleteImage(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('imageId') imageId: string
  ) {
    const user = (req as any).user;
    // Check image ownership
    const [img] = await db.select().from(images).where(eq(images.id, +imageId));
    if (!img || img.userId !== user.id || img.projectId !== +projectId) throw new BadRequestException('Unauthorized or image not found');
    // Delete from MinIO
    await minioClient.removeObject(MINIO_BUCKET, img.url);
    // Delete from DB and OpenSearch
    await db.delete(images).where(eq(images.id, +imageId));
    await opensearchClient.delete({ index: 'images', id: String(imageId) });
    return { success: true };
  }

  // GET /projects/:projectId/images
  @UseGuards(KeycloakAuthGuard)
  @Get(':projectId/images')
  async getProjectImages(@Req() req: Request, @Param('projectId') projectId: string) {
    // If user is authenticated, allow if owner; else only if public
    let userId = undefined;
    try { userId = (req as any).user?.id; } catch {}
    const [project] = await db.select().from(projects).where(eq(projects.id, +projectId));
    if (!project) throw new BadRequestException('Project not found');
    if (project.public !== 1 && (!userId || project.userId !== userId)) throw new BadRequestException('Unauthorized');
    const imgs = await db.select().from(images).where(eq(images.projectId, +projectId));
    // Generate signed URLs for each image
    const signedImgs = await Promise.all(imgs.map(async (img) => {
      let signedUrl = null;
      try {
        signedUrl = await minioClient.presignedGetObject(
          MINIO_BUCKET,
          img.url,
          60 * 60 // 1 hour expiry
        );
      } catch (e) {
        signedUrl = null;
      }
      return { ...img, url: signedUrl };
    }));
    return signedImgs;
  }

  // POST /projects
  @UseGuards(KeycloakAuthGuard)
  @Post()
  async createProject(@Req() req: Request, @Body() body: { name: string; public?: boolean }) {
    const user = (req as any).user;
    return this.projectsService.createProject(user.id, body.name, body.public ?? false);
  }

  // GET /projects (user)
  @UseGuards(KeycloakAuthGuard)
  @Get()
  async getProjects(@Req() req: Request) {
    const user = (req as any).user;
    return this.projectsService.getProjects(user.id);
  }

  // GET /projects (anonym, public)
  @Get('public')
  async getPublicProjects() {
    return this.projectsService.getPublicProjects();
  }

  // PUT /projects
  @UseGuards(KeycloakAuthGuard)
  @Put()
  async updateProject(@Req() req: Request, @Body() body: { projectId: number; name: string; public: boolean }) {
    const user = (req as any).user;
    return this.projectsService.updateProject(user.id, body.projectId, body.name, body.public);
  }

   // GET /projects/:projectId/images/:imageId/metadata
  @UseGuards(KeycloakAuthGuard)
  @Get(':projectId/images/:imageId/metadata')
  async getImageMetadata(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('imageId') imageId: string
  ) {
    // Check image ownership or public project
    let userId = undefined;
    try { userId = (req as any).user?.id; } catch {}
    const [img] = await db.select().from(images).where(eq(images.id, +imageId));
    if (!img || img.projectId !== +projectId) throw new BadRequestException('Image not found');
    const [project] = await db.select().from(projects).where(eq(projects.id, +projectId));
    if (!project) throw new BadRequestException('Project not found');
    if (project.public !== 1 && (!userId || project.userId !== userId)) throw new BadRequestException('Unauthorized');

    // Download image from MinIO to temp file
    const tempDir = path.join('/tmp', 'beiboot-images');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, img.filename ?? `image_${img.id}`);
    const fileStream = fs.createWriteStream(tempPath);
    const dataStream = await minioClient.getObject(MINIO_BUCKET, img.url);
    await new Promise((resolve, reject) => {
      if (!dataStream) return reject(new Error('No data stream returned from MinIO'));
      dataStream.pipe(fileStream);
      dataStream.on('end', resolve);
      dataStream.on('error', reject);
    });

    // Read metadata
    let tags = {};
    try {
      tags = await exiftool.read(tempPath);
    } catch (err) {
      throw new BadRequestException('Could not read metadata');
    }
    // Optionally: Save to DB here (not implemented yet)
    return { imageId, tags };
  }

  // POST /projects/:projectId/images/:imageId/metadata
  @UseGuards(KeycloakAuthGuard)
  @Post(':projectId/images/:imageId/metadata')
  async setImageMetadata(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('imageId') imageId: string,
    @Body() body: { tags: Record<string, any> }
  ) {
    let userId = undefined;
    try { userId = (req as any).user?.id; } catch {}
    const [img] = await db.select().from(images).where(eq(images.id, +imageId));
    if (!img || img.projectId !== +projectId) throw new BadRequestException('Image not found');
    const [project] = await db.select().from(projects).where(eq(projects.id, +projectId));
    if (!project) throw new BadRequestException('Project not found');
    if (project.public !== 1 && (!userId || project.userId !== userId)) throw new BadRequestException('Unauthorized');

    // Download image from MinIO to temp file
    const tempDir = path.join('/tmp', 'beiboot-images');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, img.filename ?? `image_${img.id}`);
    const fileStream = fs.createWriteStream(tempPath);
    const dataStream = await minioClient.getObject(MINIO_BUCKET, img.url);
    await new Promise((resolve, reject) => {
      if (!dataStream) return reject(new Error('No data stream returned from MinIO'));
      dataStream.pipe(fileStream);
      dataStream.on('end', resolve);
      dataStream.on('error', reject);
    });

    // Write metadata
    const tags = sanitizeTags(body.tags || {});
    try {
      await exiftool.write(tempPath, tags);
    } catch (err) {
      throw new BadRequestException('Could not write metadata');
    }

    // Upload back to MinIO (overwrite)
    const updatedBuffer = fs.readFileSync(tempPath);
    await minioClient.putObject(MINIO_BUCKET, img.url, updatedBuffer);
    // Optionally: Update DB here (not implemented yet)
    return { success: true };
  }
}

// Helper function to sanitize tags for exiftool
function sanitizeTags(tags: Record<string, any>) {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(tags)) {
    if (value === null || value === undefined) {
      sanitized[key] = '';
      continue;
    }
    if (typeof value === 'object') {
      if (value._ctor === 'ExifDateTime' || value._ctor === 'ExifDate') {
        sanitized[key] = value.rawValue;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(v =>
          typeof v === 'object' && (v._ctor === 'ExifDateTime' || v._ctor === 'ExifDate')
            ? v.rawValue
            : v.rawValue
        );
      } else if (typeof value.value === 'number' || typeof value.value === 'string') {
        sanitized[key] = value.value;
      }
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
