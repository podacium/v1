import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const projectController = {
  async getAll(req: Request, res: Response) {
    try {
      const projects = await prisma.project.findMany({
        include: {
          user: true,
          dataset: true,
        },
      });
      res.status(200).json({ success: true, data: projects });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch projects' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          user: true,
          dataset: true,
        },
      });

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      res.status(200).json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch project' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { userId, title, description, datasetId, status } = req.body;

      if (!userId || !title) {
        return res.status(400).json({ success: false, error: 'User ID and title are required' });
      }

      const project = await prisma.project.create({
        data: {
          userId,
          title,
          description: description || '',
          datasetId: datasetId || null,
          status: status || 'DRAFT',
        },
        include: {
          user: true,
          dataset: true,
        },
      });

      res.status(201).json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create project' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, datasetId, status } = req.body;

      const project = await prisma.project.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(datasetId !== undefined && { datasetId }),
          ...(status && { status }),
        },
        include: {
          user: true,
          dataset: true,
        },
      });

      res.status(200).json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update project' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.project.delete({
        where: { id },
      });

      res.status(200).json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete project' });
    }
  },
};