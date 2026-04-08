import { useState, useRef, useCallback } from 'react';
import styles from './UploadArea.module.css';

function UploadArea({ onUploadAction }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  }, []);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      return;
    }

    setIsLoading(true);
    try {
      // Call the parent component's upload action with just the file
      await onUploadAction(file);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const isFileSizeValid = file ? file.size <= 50 * 1024 * 1024 : true; // 50MB limit
  const canSubmit = file && isFileSizeValid && !isLoading;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.iconWrapper}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <div className={styles.headerText}>
            <h2>Analyze Contract</h2>
            <p>Upload a PDF real estate contract for AI analysis</p>
          </div>
        </div>

        <div className={styles.cardBody}>
          {/* File Upload Area */}
          <div
            className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''} ${file ? styles.dropZoneHasFile : ''} ${!isFileSizeValid ? styles.dropZoneError : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={!file ? handleBrowseClick : undefined}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className={styles.fileInput}
            />

            {!file ? (
              <>
                <div className={styles.dropIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 14.899A7 7 0 1115.71 8h1.79a4.5 4.5 0 012.5 8.242" />
                    <path d="M12 12v9" />
                    <path d="M8 17l4-4 4 4" />
                  </svg>
                </div>
                <div className={styles.dropText}>
                  <span className={styles.dropTitle}>Drop your PDF contract here</span>
                  <span className={styles.dropSubtitle}>
                    or <button type="button" className={styles.browseLink}>browse files</button>
                  </span>
                </div>
                <div className={styles.dropHint}>
                  <span>Support for PDF files up to 50MB</span>
                </div>
              </>
            ) : (
              <div className={styles.filePreview}>
                <div className={styles.fileIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{file.name}</span>
                  <span className={`${styles.fileSize} ${!isFileSizeValid ? styles.fileSizeError : ''}`}>
                    {formatFileSize(file.size)}
                    {!isFileSizeValid && ' (Too large - max 50MB)'}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Processing Info */}
          {file && isFileSizeValid && (
            <div className={styles.processingInfo}>
              <div className={styles.infoIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className={styles.infoText}>
                <span>Ready to analyze your contract with AI agents</span>
                <small>File will be securely uploaded and processed in Google Cloud</small>
              </div>
            </div>
          )}
        </div>

        <div className={styles.cardFooter}>
          <button
            className={`${styles.submitButton} ${isLoading ? styles.submitLoading : ''}`}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isLoading ? (
              <>
                <span className={styles.submitSpinner} />
                Uploading & Starting Analysis...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Start AI Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <div className={styles.infoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3>Secure Processing</h3>
          <p>Your documents are encrypted and processed securely in Google Cloud</p>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3>Multi-Agent Pipeline</h3>
          <p>Verification, Encumbrance, and Stamp Duty agents work in parallel</p>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3>Comprehensive Report</h3>
          <p>Get identity verification, lien checks, and tax calculations</p>
        </div>
      </div>
    </div>
  );
}

export default UploadArea;