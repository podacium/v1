import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const aiChatController = {
  async getAll(req: Request, res: Response) {
    try {
      const aiChats = await prisma.aIChat.findMany({
        include: {
          user: true,
        },
      });
      res.status(200).json({ success: true, data: aiChats });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch AI chats' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const aiChat = await prisma.aIChat.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

      if (!aiChat) {
        return res.status(404).json({ success: false, error: 'AI chat not found' });
      }

      res.status(200).json({ success: true, data: aiChat });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch AI chat' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { userId, context, messages } = req.body;

      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
      }

      const aiChat = await prisma.aIChat.create({
        data: {
          userId,
          context: context || '',
          messages: messages || [],
        },
        include: {
          user: true,
        },
      });

      res.status(201).json({ success: true, data: aiChat });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create AI chat' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { context, messages } = req.body;

      const aiChat = await prisma.aIChat.update({
        where: { id },
        data: {
          ...(context && { context }),
          ...(messages && { messages }),
        },
        include: {
          user: true,
        },
      });

      res.status(200).json({ success: true, data: aiChat });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update AI chat' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.aIChat.delete({
        where: { id },
      });

      res.status(200).json({ success: true, message: 'AI chat deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete AI chat' });
    }
  },
};