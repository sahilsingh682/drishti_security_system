// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import orderRoutes from './routes/orderRoutes'; // 🚀 Added our new router

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// // 🚀 Plug in the router! Anything going to /api/orders will be handled by orderRoutes.ts
// app.use('/api/orders', orderRoutes);

// app.get('/', (req, res) => {
//   res.send('Drishti Security API is running securely! 🛡️');
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import orderRoutes from './routes/orderRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/orders', orderRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Drishti Security API is running securely! 🛡️');
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
