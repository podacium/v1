import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const userController = {
  async getAll(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        include: {
          enrollments: true,
          projects: true,
          aiChats: true,
          demos: true,
          datasets: true,
        },
      });
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          enrollments: {
            include: {
              course: true,
            },
          },
          projects: true,
          aiChats: true,
          demos: true,
          datasets: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, role, organization, country } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email, password, firstName, and lastName are required' 
        });
      }

      const user = await prisma.user.create({
        data: {
          email,
          password,
          firstName,
          lastName,
          role: role || 'STUDENT',
          organization,
          country,
        },
        include: {
          enrollments: true,
          projects: true,
          aiChats: true,
          demos: true,
          datasets: true,
        },
      });

      res.status(201).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create user' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email, password, firstName, lastName, role, organization, country } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(email && { email }),
          ...(password && { password }),
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(role && { role }),
          ...(organization && { organization }),
          ...(country && { country }),
        },
        include: {
          enrollments: {
            include: {
              course: true,
            },
          },
          projects: true,
          aiChats: true,
          demos: true,
          datasets: true,
        },
      });

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update user' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.user.delete({
        where: { id },
      });

      res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
  },
};