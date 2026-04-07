import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { startDaemon } from './daemon.js';

// Import Routes
import contractRoutes from './routes/contractRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

// Mount the Routes
app.use('/api/contracts', contractRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected: DAG State Machine is online.');
    startDaemon(); // <--- ADD THIS LINE HERE
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Orchestration Server running on port ${PORT}`);
});