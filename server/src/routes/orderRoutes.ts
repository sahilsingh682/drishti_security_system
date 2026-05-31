import express from 'express';
import { createOrder, verifyPayment, updateOrderStatus } from '../controllers/OrderController';

const router = express.Router();

// Customer facing routes
router.post('/checkout', createOrder);
router.post('/verify-payment', verifyPayment);

// Admin / Technician facing routes
// Note: In a production environment, you would add an admin authentication middleware here!
router.put('/:orderId/status', updateOrderStatus);

export default router;