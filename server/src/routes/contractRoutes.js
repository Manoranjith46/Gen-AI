import express from 'express';
import multer from 'multer';
import { uploadFile, processContract, getContractStatus, listContracts } from '../controllers/contractController.js';

const router = express.Router();

// Configure multer for file uploads (store in memory as buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Route: POST /api/contracts/upload-file (Direct file upload)
router.post('/upload-file', upload.single('pdf'), uploadFile);

// Route: POST /api/contracts/upload (Legacy GCS URI endpoint)
router.post('/upload', processContract);

// Route: GET /api/contracts (List all contracts for history)
router.get('/', listContracts);

// Route: GET /api/contracts/:id (Polled by the React frontend)
router.get('/:id', getContractStatus);

export default router;