import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'extracting', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  },
  gcsUri: { type: String, required: true }, 
  finalAnnotations: { type: mongoose.Schema.Types.Mixed, default: {} },
  errorLog: { type: String, default: null }
});

export default mongoose.model('Contract', contractSchema);