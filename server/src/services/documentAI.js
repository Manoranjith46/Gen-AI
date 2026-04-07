import { v1 } from '@google-cloud/documentai';

export async function extractTextFromPDF(gcsUri, processorId) {
  const projectId = process.env.GCP_PROJECT_ID;
  
  // 1. MUST MATCH YOUR CONSOLE: Change this to 'us' if your processor is in the US region, 
  // or 'global' if it is in the Global region.
  const location = 'us'; 

  const client = new v1.DocumentProcessorServiceClient({
    apiEndpoint: `${location}-documentai.googleapis.com`,
  });

  // 2. This is the resource name that is likely failing
  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  const request = {
    name,
    gcsDocument: {
      gcsUri: gcsUri,
      mimeType: 'application/pdf',
    },
  };

  try {
    console.log(`[DocumentAI] Testing Path: ${name}`);
    const [result] = await client.processDocument(request);
    return result.document.text;
  } catch (error) {
    console.error(`[DocumentAI] Error ${error.code}: ${error.details}`);
    throw error;
  }
}