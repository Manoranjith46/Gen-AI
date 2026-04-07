import Contract from '../models/Contract.js';
import AgentTask from '../models/AgentTask.js'; 
import { extractTextFromPDF } from '../services/documentAI.js';
import { runPrimaryAgent } from '../agents/primary.js';

/**
 * POST /api/contracts/upload
 * Expects body: { gcsUri: "gs://your-bucket/file.pdf", filename: "Deed.pdf" }
 */
export const processContract = async (req, res) => {

    // Inside src/controllers/contractController.js -> processContract function
(async () => {
  try {
    console.log("--- DEBUG: Starting Document AI Step ---");
    const rawText = await extractTextFromPDF(gcsUri, process.env.DOC_AI_PROCESSOR_ID);
    
    console.log("--- DEBUG: Text Extracted! Length:", rawText?.length);
    console.log("--- DEBUG: Calling Primary Agent now... ---");
    
    await runPrimaryAgent(newContract._id, rawText);
    
    console.log("--- DEBUG: Primary Agent Finished. Check MongoDB Tasks! ---");
  } catch (backgroundError) {
    console.error("--- DEBUG: BACKGROUND CRASH ---", backgroundError);
    await Contract.findByIdAndUpdate(newContract._id, { 
      status: 'failed', 
      errorLog: backgroundError.message 
    });
  }
})();

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
