import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import courseRoutes from './routes/courseRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import dataAssetRoutes from './routes/dataAssetRoutes';
import datasetRoutes from './routes/datasetRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import projectRoutes from './routes/projectRoutes';
import aiChatRoutes from './routes/aiChatRoutes';
import demoRoutes from './routes/demoRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/users', userRoutes);
app.use('/courses', courseRoutes);
app.use('/enrollments', enrollmentRoutes);
app.use('/schedules', scheduleRoutes);
app.use('/data-assets', dataAssetRoutes);
app.use('/datasets', datasetRoutes);
app.use('/dashboards', dashboardRoutes);
app.use('/projects', projectRoutes);
app.use('/ai-chats', aiChatRoutes);
app.use('/demos', demoRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

export default app;