// src/controllers/courseController.ts
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const courseController = {
  async getAll(req: Request, res: Response) {
    try {
      const courses = await prisma.course.findMany({
        include: {
          enrollments: true,
          schedules: true,
          dataAssets: true,
          demos: true,
        },
      });
      res.status(200).json({ success: true, data: courses });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch courses' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          enrollments: {
            include: {
              user: true,
            },
          },
          schedules: true,
          dataAssets: true,
          demos: true,
        },
      });

      if (!course) {
        return res.status(404).json({ success: false, error: 'Course not found' });
      }

      res.status(200).json({ success: true, data: course });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch course' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { title, description, category, level, duration, lessons, features, language, thumbnailUrl, isPopular, isNew } = req.body;

      if (!title || !description || !category || !level) {
        return res.status(400).json({ success: false, error: 'Title, description, category, and level are required' });
      }

      const course = await prisma.course.create({
        data: {
          title,
          description,
          category,
          level,
          duration: duration || '',
          lessons: lessons || 0,
          features: features || [],
          language: language || '',
          thumbnailUrl: thumbnailUrl || '',
          isPopular: isPopular || false,
          isNew: isNew || false,
        },
        include: {
          enrollments: true,
          schedules: true,
          dataAssets: true,
          demos: true,
        },
      });

      res.status(201).json({ success: true, data: course });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create course' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, category, level, duration, lessons, features, language, thumbnailUrl, isPopular, isNew } = req.body;

      const course = await prisma.course.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(category && { category }),
          ...(level && { level }),
          ...(duration && { duration }),
          ...(lessons !== undefined && { lessons }),
          ...(features && { features }),
          ...(language && { language }),
          ...(thumbnailUrl && { thumbnailUrl }),
          ...(isPopular !== undefined && { isPopular }),
          ...(isNew !== undefined && { isNew }),
        },
        include: {
          enrollments: {
            include: {
              user: true,
            },
          },
          schedules: true,
          dataAssets: true,
          demos: true,
        },
      });

      res.status(200).json({ success: true, data: course });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update course' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.course.delete({
        where: { id },
      });

      res.status(200).json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete course' });
    }
  },
};