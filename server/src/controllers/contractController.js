import Contract from '../models/Contract.js';
import AgentTask from '../models/AgentTask.js';
import { extractTextFromPDF } from '../services/documentAI.js';
import { runPrimaryAgent } from '../agents/primary.js';
import { uploadPdfToGcs, validatePdfFile } from '../services/gcsUpload.js';

/**
 * POST /api/contracts/upload-file
 * Handles direct PDF file upload and processing
 * Expects multipart/form-data with 'pdf' field
 */
export const uploadFile = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded. Please select a file.' });
    }

    // Validate the uploaded file
    if (!validatePdfFile(req.file)) {
      return res.status(400).json({
        error: 'Invalid file. Please upload a PDF file smaller than 50MB.'
      });
    }

    console.log(`[Upload] 📄 Processing file: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Upload file to Google Cloud Storage
    const { gcsUri, filename } = await uploadPdfToGcs(req.file.buffer, req.file.originalname);

    // 1. Create the main tracker in MongoDB
    const newContract = new Contract({
      filename,
      gcsUri,
      status: 'extracting'
    });
    await newContract.save();

    // 2. Respond immediately so the React frontend doesn't timeout
    res.status(202).json({
      message: 'File uploaded successfully. Contract processing started.',
      contractId: newContract._id,
      filename,
      gcsUri
    });

    // 3. BACKGROUND PROCESSING: Do not 'await' this block in the main thread
    (async () => {
      try {
        console.log(`[Upload] 🔄 Starting background processing for contract: ${newContract._id}`);

        // Step A: Extract Text
        const rawText = await extractTextFromPDF(gcsUri, process.env.DOC_AI_PROCESSOR_ID);

        // Step B: Trigger the Primary Agent to slice the text and build the DAG
        await runPrimaryAgent(newContract._id, rawText);

      } catch (backgroundError) {
        console.error(`[Upload Background Error] Contract ${newContract._id}:`, backgroundError);
        await Contract.findByIdAndUpdate(newContract._id, {
          status: 'failed',
          errorLog: backgroundError.message
        });
      }
    })();

  } catch (error) {
    console.error('[Upload Error]:', error);

    // Handle specific GCS errors
    if (error.message.includes('GCS_BUCKET_NAME')) {
      return res.status(500).json({
        error: 'Storage configuration error. Please contact support.'
      });
    }

    if (error.message.includes('Failed to upload file to GCS')) {
      return res.status(500).json({
        error: 'Failed to upload file to cloud storage. Please try again.'
      });
    }

    res.status(500).json({
      error: 'Failed to process file upload. Please try again.'
    });
  }
};

/**
 * POST /api/contracts/upload
 * Legacy endpoint - Expects body: { gcsUri: "gs://your-bucket/file.pdf", filename: "Deed.pdf" }
 * DEPRECATED: Use /upload-file instead for direct file uploads
 */
export const processContract = async (req, res) => {
  try {
    const { gcsUri, filename } = req.body;

    if (!gcsUri || !filename) {
      return res.status(400).json({ error: 'gcsUri and filename are required.' });
    }

    // 1. Create the main tracker in MongoDB
    const newContract = new Contract({
      filename,
      gcsUri,
      status: 'extracting'
    });
    await newContract.save();

    // 2. Respond immediately so the React frontend doesn't timeout
    res.status(202).json({
      message: 'Contract accepted. Orchestration pipeline started.',
      contractId: newContract._id
    });

    // 3. BACKGROUND PROCESSING: Do not 'await' this block in the main thread
    (async () => {
      try {
        // Step A: Extract Text
        const rawText = await extractTextFromPDF(gcsUri, process.env.DOC_AI_PROCESSOR_ID);
        
        // Step B: Trigger the Primary Agent to slice the text and build the DAG
        await runPrimaryAgent(newContract._id, rawText);

      } catch (backgroundError) {
        console.error(`[Background Error] Contract ${newContract._id}:`, backgroundError);
        await Contract.findByIdAndUpdate(newContract._id, { 
          status: 'failed', 
          errorLog: backgroundError.message 
        });
      }
    })();

  } catch (error) {
    console.error('Controller Error:', error);
    res.status(500).json({ error: 'Failed to initialize contract processing.' });
  }
};

/**
 * GET /api/contracts
 * Lists all contracts with basic info for history view
 */
export const listContracts = async (req, res) => {
  try {
    const contracts = await Contract.find()
      .select('_id filename uploadDate status')
      .sort({ uploadDate: -1 })
      .lean();

    res.status(200).json(contracts);
  } catch (error) {
    console.error('List Contracts Error:', error);
    res.status(500).json({ error: 'Failed to retrieve contracts.' });
  }
};

/**
 * GET /api/contracts/:id
 * Fetches the high-level contract status AND the status of all sub-agent tasks
 */
export const getContractStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Get the high-level tracker
    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    // 2. Get the granular status of every sub-agent working on this contract
    const tasks = await AgentTask.find({ contractId: id })
      .select('assignedAgent status dependsOn errorLog') 
      .lean();

    // 3. Return the full state to the frontend
    res.status(200).json({
      contractId: contract._id,
      globalStatus: contract.status, 
      errorLog: contract.errorLog,
      finalOutput: contract.finalAnnotations, 
      agentTasks: tasks 
    });

  } catch (error) {
    console.error('Status Fetch Error:', error);
    res.status(500).json({ error: 'Failed to retrieve contract status.' });
  }
};
