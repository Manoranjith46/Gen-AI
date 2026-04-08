import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

const storage = new Storage();

/**
 * Upload a PDF file to Google Cloud Storage
 * @param {Buffer} fileBuffer - The PDF file buffer
 * @param {string} originalFilename - Original filename from user
 * @returns {Promise<{gcsUri: string, filename: string}>} - The GCS URI and filename
 */
export async function uploadPdfToGcs(fileBuffer, originalFilename) {
  try {
    const bucketName = process.env.GCS_BUCKET_NAME;

    if (!bucketName) {
      throw new Error('GCS_BUCKET_NAME environment variable is not set');
    }

    // Generate unique filename to avoid conflicts
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueId = uuidv4().split('-')[0]; // Use first part of UUID
    const sanitizedOriginal = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `contracts/${timestamp}_${uniqueId}_${sanitizedOriginal}`;

    // Get reference to the bucket and file
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);

    // Create a write stream to upload the file
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          originalName: originalFilename,
          uploadedAt: new Date().toISOString()
        }
      },
      resumable: false // For smaller files, non-resumable is faster
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('[GCS Upload] Error:', error);
        reject(new Error(`Failed to upload file to GCS: ${error.message}`));
      });

      stream.on('finish', () => {
        const gcsUri = `gs://${bucketName}/${filename}`;
        console.log(`[GCS Upload] ✅ Uploaded: ${gcsUri}`);

        resolve({
          gcsUri,
          filename: originalFilename
        });
      });

      // Write the file buffer to the stream
      stream.end(fileBuffer);
    });

  } catch (error) {
    console.error('[GCS Upload] Service Error:', error);
    throw error;
  }
}

/**
 * Validate that the uploaded file is a PDF
 * @param {Object} file - Multer file object
 * @returns {boolean} - True if valid PDF
 */
export function validatePdfFile(file) {
  // Check MIME type
  if (file.mimetype !== 'application/pdf') {
    return false;
  }

  // Check file extension
  if (!file.originalname.toLowerCase().endsWith('.pdf')) {
    return false;
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB in bytes
  if (file.size > maxSize) {
    return false;
  }

  return true;
}