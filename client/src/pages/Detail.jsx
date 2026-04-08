import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import FinalReport from '../components/FinalReport';
import DagVisualizer from '../components/DagVisualizer';
import styles from './Detail.module.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

function Detail() {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await fetch(`${API_BASE}/contracts/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Analysis not found');
          }
          throw new Error('Failed to fetch analysis');
        }
        const data = await response.json();
        setContract(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContract();

    // Poll for updates if still processing
    const pollInterval = setInterval(async () => {
      if (contract?.globalStatus === 'completed' || contract?.globalStatus === 'failed') {
        clearInterval(pollInterval);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/contracts/${id}`);
        if (response.ok) {
          const data = await response.json();
          setContract(data);
          if (data.globalStatus === 'completed' || data.globalStatus === 'failed') {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [id, contract?.globalStatus]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>Error</h3>
          <p>{error}</p>
          <Link to="/history" className={styles.backLink}>
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  const isProcessing = contract.globalStatus === 'processing' || contract.globalStatus === 'extracting';
  const isCompleted = contract.globalStatus === 'completed';
  const isFailed = contract.globalStatus === 'failed';

  // Map agent tasks for visualization
  const tasks = [];
  if (contract.globalStatus === 'extracting') {
    tasks.push({ taskName: 'Document Ingestion', status: 'in_progress' });
  } else {
    tasks.push({ taskName: 'Document Ingestion', status: 'completed' });
  }
  if (contract.agentTasks && contract.agentTasks.length > 0) {
    contract.agentTasks.forEach(task => {
      tasks.push({
        taskName: task.assignedAgent,
        status: task.status
      });
    });
  }

  // Map finalOutput to report format
  const reportData = contract.finalOutput ? {
    verification: contract.finalOutput['Verification_Agent'] || {},
    encumbrance: contract.finalOutput['EC_Agent'] || {},
    stampDuty: contract.finalOutput['Stamp_Duty_Agent'] || {}
  } : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/history" className={styles.backButton}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to History
        </Link>

        <div className={styles.titleSection}>
          {isCompleted && (
            <div className={styles.successIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          )}
          {isFailed && (
            <div className={styles.failedIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
          )}
          {isProcessing && (
            <div className={styles.processingIcon}>
              <div className={styles.pulseRing} />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          )}
          <div>
            <h1>
              {isCompleted && 'Analysis Complete'}
              {isFailed && 'Analysis Failed'}
              {isProcessing && 'Processing...'}
            </h1>
            <p className={styles.contractIdBadge}>
              Contract ID: <code>{id}</code>
            </p>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className={styles.processingSection}>
          <DagVisualizer tasks={tasks} />
        </div>
      )}

      {isFailed && (
        <div className={styles.failedSection}>
          <p>{contract.errorLog || 'An unexpected error occurred during processing.'}</p>
        </div>
      )}

      {isCompleted && reportData && (
        <FinalReport reportData={reportData} />
      )}
    </div>
  );
}

export default Detail;
