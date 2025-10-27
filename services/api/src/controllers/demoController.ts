import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const demoController = {
  async getAll(req: Request, res: Response) {
    try {
      const demos = await prisma.demo.findMany({
        include: {
          course: true,
          user: true,
        },
      });
      res.status(200).json({ success: true, data: demos });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch demos' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const demo = await prisma.demo.findUnique({
        where: { id },
        include: {
          course: true,
          user: true,
        },
      });

      if (!demo) {
        return res.status(404).json({ success: false, error: 'Demo not found' });
      }

      res.status(200).json({ success: true, data: demo });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch demo' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { courseId, userId, title, description } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, error: 'Title is required' });
      }

      const demo = await prisma.demo.create({
        data: {
          title,
          description: description || '',
          courseId: courseId || null,
          userId: userId || null,
        },
        include: {
          course: true,
          user: true,
        },
      });

      res.status(201).json({ success: true, data: demo });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create demo' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, courseId, userId } = req.body;

      const demo = await prisma.demo.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(courseId !== undefined && { courseId }),
          ...(userId !== undefined && { userId }),
        },
        include: {
          course: true,
          user: true,
        },
      });

      res.status(200).json({ success: true, data: demo });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update demo' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.demo.delete({
        where: { id },
      });

      res.status(200).json({ success: true, message: 'Demo deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete demo' });
    }
  },
};