import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import styles from './App.module.css';
import UploadArea from './components/UploadArea';
import DagVisualizer from './components/DagVisualizer';
import FinalReport from './components/FinalReport';
import History from './pages/History';
import Detail from './pages/Detail';


function HomePage() {
  const [contractId, setContractId] = useState(null);
  const [pipelineState, setPipelineState] = useState('idle'); // idle | uploading | processing | completed | failed
  const [tasks, setTasks] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  // Polling logic for contract status
  useEffect(() => {
    if (!contractId || pipelineState === 'completed' || pipelineState === 'failed') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`https://real-estate-api-943702612956.us-central1.run.app/api/contracts/${contractId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch contract status');
        }

        const data = await response.json();

        // Map agent tasks to visualization format
        const mappedTasks = [];

        // Document Ingestion status based on globalStatus
        if (data.globalStatus === 'extracting') {
          mappedTasks.push({ taskName: 'Document Ingestion', status: 'in_progress' });
        } else {
          mappedTasks.push({ taskName: 'Document Ingestion', status: 'completed' });
        }

        // Add agent tasks from the response
        if (data.agentTasks && data.agentTasks.length > 0) {
          data.agentTasks.forEach(task => {
            mappedTasks.push({
              taskName: task.assignedAgent,
              status: task.status
            });
          });
        }

        setTasks(mappedTasks);

        // Check final status
        if (data.globalStatus === 'completed') {
          setPipelineState('completed');

          const finalOutput = data.finalOutput || {};
          setReportData({
            verification: finalOutput['Verification_Agent'] || {},
            encumbrance: finalOutput['EC_Agent'] || {},
            stampDuty: finalOutput['Stamp_Duty_Agent'] || {}
          });
          clearInterval(pollInterval);
        } else if (data.globalStatus === 'failed') {
          setPipelineState('failed');
          setError(data.errorLog || 'Pipeline processing failed');
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [contractId, pipelineState]);

  // Handle file upload
  const handleUpload = useCallback(async (file) => {
    setError(null);
    setPipelineState('uploading');

    try {
      if (!file) {
        throw new Error('Please select a PDF file to upload.');
      }

      if (file.type !== 'application/pdf') {
        throw new Error('Please select a valid PDF file.');
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size must be less than 50MB.');
      }

      const formData = new FormData();
      formData.append('pdf', file);

      console.log(`[Upload] Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

      const response = await fetch(`https://real-estate-api-943702612956.us-central1.run.app/api/contracts/upload-file`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Upload failed');
      }

      const data = await response.json();
      setContractId(data.contractId);
      setPipelineState('processing');
      setTasks([{ taskName: 'Document Ingestion', status: 'in_progress' }]);

    } catch (err) {
      setError(err.message);
      setPipelineState('idle');
    }
  }, []);

  const handleReset = useCallback(() => {
    setContractId(null);
    setPipelineState('idle');
    setTasks([]);
    setReportData(null);
    setError(null);
  }, []);

  return (
    <>
      {error && (
        <div className={styles.errorBanner}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {pipelineState === 'idle' && (
        <UploadArea onUploadAction={handleUpload} />
      )}

      {pipelineState === 'uploading' && (
        <div className={styles.uploadingState}>
          <div className={styles.spinner} />
          <p>Initializing pipeline...</p>
        </div>
      )}

      {pipelineState === 'processing' && (
        <div className={styles.processingContainer}>
          <div className={styles.processingHeader}>
            <h2>Pipeline Processing</h2>
            <p className={styles.contractIdBadge}>
              Contract ID: <code>{contractId}</code>
            </p>
          </div>
          <DagVisualizer tasks={tasks} />
        </div>
      )}

      {pipelineState === 'completed' && reportData && (
        <div className={styles.completedContainer}>
          <div className={styles.completedHeader}>
            <div className={styles.successIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <h2>Analysis Complete</h2>
              <p className={styles.contractIdBadge}>
                Contract ID: <code>{contractId}</code>
              </p>
            </div>
          </div>
          <FinalReport reportData={reportData} />
          <div className={styles.actionButtons}>
            <button className={styles.resetButton} onClick={handleReset}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              New Analysis
            </button>
          </div>
        </div>
      )}

      {pipelineState === 'failed' && (
        <div className={styles.failedState}>
          <div className={styles.failedIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2>Pipeline Failed</h2>
          <p>{error || 'An unexpected error occurred'}</p>
          <button className={styles.retryButton} onClick={handleReset}>
            Try Again
          </button>
        </div>
      )}
    </>
  );
}

function App() {
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const isHome = location.pathname === '/';

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>RealEstate AI</span>
              <span className={styles.logoSubtitle}>Contract Analysis Pipeline</span>
            </div>
          </Link>

          <div className={styles.headerActions}>
            <Link to="/history" className={styles.historyButton}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              History
            </Link>

            {!isHome && (
              <Link to="/" className={styles.newAnalysisButton}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Analysis
              </Link>
            )}

            <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<History />} />
          <Route path="/analysis/:id" element={<Detail />} />
        </Routes>
      </main>

      <footer className={styles.footer}>
        <p>Real Estate AI Pipeline &copy; 2024</p>
      </footer>
    </div>
  );
}

export default App;
