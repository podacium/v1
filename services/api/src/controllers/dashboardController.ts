import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const dashboardController = {
  async getAll(req: Request, res: Response) {
    try {
      const dashboards = await prisma.dashboard.findMany({
        include: {
          dataset: true,
        },
      });
      res.status(200).json({ success: true, data: dashboards });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch dashboards' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dashboard = await prisma.dashboard.findUnique({
        where: { id },
        include: {
          dataset: true,
        },
      });

      if (!dashboard) {
        return res.status(404).json({ success: false, error: 'Dashboard not found' });
      }

      res.status(200).json({ success: true, data: dashboard });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch dashboard' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { datasetId, title, description, configJson } = req.body;

      if (!datasetId || !title || !configJson) {
        return res.status(400).json({ success: false, error: 'Dataset ID, title, and configJson are required' });
      }

      const dashboard = await prisma.dashboard.create({
        data: {
          datasetId,
          title,
          description: description || '',
          configJson,
        },
        include: {
          dataset: true,
        },
      });

      res.status(201).json({ success: true, data: dashboard });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create dashboard' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, configJson } = req.body;

      const dashboard = await prisma.dashboard.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(configJson && { configJson }),
        },
        include: {
          dataset: true,
        },
      });

      res.status(200).json({ success: true, data: dashboard });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update dashboard' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.dashboard.delete({
        where: { id },
      });

      res.status(200).json({ success: true, message: 'Dashboard deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete dashboard' });
    }
  },
};