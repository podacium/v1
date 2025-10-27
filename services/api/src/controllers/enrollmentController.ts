// src/controllers/enrollmentController.ts
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const enrollmentController = {
  async getAll(req: Request, res: Response) {
    try {
      const enrollments = await prisma.enrollment.findMany({
        include: {
          user: true,
          course: true,
        },
      });
      res.status(200).json({ success: true, data: enrollments });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch enrollments' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const enrollment = await prisma.enrollment.findUnique({
        where: { id },
        include: {
          user: true,
          course: {
            include: {
              schedules: true,
              dataAssets: true,
            },
          },
        },
      });

      if (!enrollment) {
        return res.status(404).json({ success: false, error: 'Enrollment not found' });
      }

      res.status(200).json({ success: true, data: enrollment });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch enrollment' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { userId, courseId, progress, completed } = req.body;

      if (!userId || !courseId) {
        return res.status(400).json({ success: false, error: 'User ID and Course ID are required' });
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          userId,
          courseId,
          progress: progress || 0,
          completed: completed || false,
        },
        include: {
          user: true,
          course: true,
        },
      });

      res.status(201).json({ success: true, data: enrollment });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create enrollment' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { progress, completed } = req.body;

      const enrollment = await prisma.enrollment.update({
        where: { id },
        data: {
          ...(progress !== undefined && { progress }),
          ...(completed !== undefined && { completed }),
        },
        include: {
          user: true,
          course: true,
        },
      });

      res.status(200).json({ success: true, data: enrollment });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update enrollment' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.enrollment.delete({
        where: { id },
      });

      res.status(200).json({ success: true, message: 'Enrollment deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete enrollment' });
    }
  },
};