import { Router } from 'express';
import authRoutes from './authRoutes';
import plantRoutes from './plantRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/plants', plantRoutes);
router.use('/notifications', notificationRoutes);

// Health check for API routes
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API routes are working',
    timestamp: new Date().toISOString(),
  });
});

export default router;