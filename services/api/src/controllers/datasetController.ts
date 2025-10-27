// src/controllers/datasetController.ts
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const datasetController = {
  async getAll(req: Request, res: Response) {
    try {
      const datasets = await prisma.dataset.findMany({
        include: {
          uploadedBy: true,
          dashboards: true,
          projects: true,
        },
      });
      res.status(200).json({ success: true, data: datasets });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch datasets' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dataset = await prisma.dataset.findUnique({
        where: { id },
        include: {
          uploadedBy: true,
          dashboards: true,
          projects: true,
        },
      });

      if (!dataset) {
        return res.status(404).json({ success: false, error: 'Dataset not found' });
      }

      res.status(200).json({ success: true, data: dataset });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch dataset' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { userId, title, description, source, fileUrl, industry, country, isPublic } = req.body;

      if (!userId || !title) {
        return res.status(400).json({ success: false, error: 'User ID and title are required' });
      }

      const dataset = await prisma.dataset.create({
        data: {
          title,
          description: description || '',
          source: source || '',
          fileUrl: fileUrl || '',
          industry: industry || '',
          country: country || '',
          userId,
          isPublic: isPublic || false,
        },
        include: {
          uploadedBy: true,
          dashboards: true,
          projects: true,
        },
      });

      res.status(201).json({ success: true, data: dataset });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create dataset' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, source, fileUrl, industry, country, isPublic } = req.body;

      const dataset = await prisma.dataset.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(source && { source }),
          ...(fileUrl && { fileUrl }),
          ...(industry && { industry }),
          ...(country && { country }),
          ...(isPublic !== undefined && { isPublic }),
        },
        include: {
          uploadedBy: true,
          dashboards: true,
          projects: true,
        },
      });

      res.status(200).json({ success: true, data: dataset });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update dataset' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.dataset.delete({
        where: { id },
      });

      res.status(200).json({ success: true, message: 'Dataset deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete dataset' });
    }
  },
};