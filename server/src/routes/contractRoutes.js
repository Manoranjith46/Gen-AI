import express from 'express';
import { processContract, getContractStatus } from '../controllers/contractController.js';

const router = express.Router();

// Route: POST /api/contracts/upload (Triggers the Primary Agent)
router.post('/upload', processContract);

// Route: GET /api/contracts/:id (Polled by the React frontend)
router.get('/:id', getContractStatus);

export default router;