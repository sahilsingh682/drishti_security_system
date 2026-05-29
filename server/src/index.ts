import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createOrder } from './controllers/OrderController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/api/orders/checkout', createOrder);
app.post('/api/orders/verify-payment', verifyPayment);

app.get('/', (req, res) => {
  res.send('Drishti Security API is running securely! 🛡️');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});