// src/controllers/dataAssetController.ts
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const dataAssetController = {
  async getAll(req: Request, res: Response) {
    try {
      const dataAssets = await prisma.dataAsset.findMany({
        include: {
          course: true,
        },
      });
      res.status(200).json({ success: true, data: dataAssets });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch data assets' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dataAsset = await prisma.dataAsset.findUnique({
        where: { id },
        include: {
          course: true,
        },
      });

      if (!dataAsset) {
        return res.status(404).json({ success: false, error: 'Data asset not found' });
      }

      res.status(200).json({ success: true, data: dataAsset });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch data asset' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { courseId, title, type, url } = req.body;

      if (!title || !type) {
        return res.status(400).json({ success: false, error: 'Title and type are required' });
      }

      const dataAsset = await prisma.dataAsset.create({
        data: {
          title,
          type,
          url: url || '',
          courseId: courseId || null,
        },
        include: {
          course: true,
        },
      });

      res.status(201).json({ success: true, data: dataAsset });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create data asset' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, type, url, courseId } = req.body;

      const dataAsset = await prisma.dataAsset.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(type && { type }),
          ...(url && { url }),
          ...(courseId !== undefined && { courseId }),
        },
        include: {
          course: true,
        },
      });

      res.status(200).json({ success: true, data: dataAsset });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update data asset' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.dataAsset.delete({
        where: { id },
      });

      res.status(200).json({ success: true, message: 'Data asset deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete data asset' });
    }
  },
};