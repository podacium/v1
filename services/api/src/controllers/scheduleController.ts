// src/controllers/scheduleController.ts
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const scheduleController = {
  async getAll(req: Request, res: Response) {
    try {
      const schedules = await prisma.schedule.findMany({
        include: {
          course: true,
        },
      });
      res.status(200).json({ success: true, data: schedules });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch schedules' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const schedule = await prisma.schedule.findUnique({
        where: { id },
        include: {
          course: {
            include: {
              enrollments: true,
              dataAssets: true,
            },
          },
        },
      });

      if (!schedule) {
        return res.status(404).json({ success: false, error: 'Schedule not found' });
      }

      res.status(200).json({ success: true, data: schedule });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch schedule' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { courseId, startDate, endDate, location } = req.body;

      if (!courseId || !startDate || !endDate) {
        return res.status(400).json({ success: false, error: 'Course ID, startDate, and endDate are required' });
      }

      const schedule = await prisma.schedule.create({
        data: {
          courseId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          location: location || '',
        },
        include: {
          course: true,
        },
      });

      res.status(201).json({ success: true, data: schedule });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create schedule' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { startDate, endDate, location } = req.body;

      const schedule = await prisma.schedule.update({
        where: { id },
        data: {
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(location && { location }),
        },
        include: {
          course: true,
        },
      });

      res.status(200).json({ success: true, data: schedule });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update schedule' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.schedule.delete({
        where: { id },
      });

      res.status(200).json({ success: true, message: 'Schedule deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete schedule' });
    }
  },
};