import mongoose from 'mongoose';

const agentTaskSchema = new mongoose.Schema({
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  taskName: { type: String, required: true }, 
  assignedAgent: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['blocked', 'pending', 'in_progress', 'completed', 'failed'], 
    default: 'pending' 
  },
  dependsOn: [{ type: String }], 
  inputPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
  agentOutput: { type: mongoose.Schema.Types.Mixed, default: null },
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  errorLog: { type: String, default: null }
}, { timestamps: true });

agentTaskSchema.index({ assignedAgent: 1, status: 1 });
agentTaskSchema.index({ contractId: 1 });

export default mongoose.model('AgentTask', agentTaskSchema);