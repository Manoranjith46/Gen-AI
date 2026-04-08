import styles from './DagVisualizer.module.css';

const NODE_CONFIG = {
  'Document Ingestion': {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    label: 'Document Ingestion',
    description: 'OCR & Text Extraction'
  },
  'Verification_Agent': {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <path d="M20 8v6M23 11h-6" />
      </svg>
    ),
    label: 'Verification Agent',
    description: 'Identity & Zone Validation'
  },
  'EC_Agent': {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    label: 'EC Agent',
    description: 'Encumbrance Check'
  },
  'Stamp_Duty_Agent': {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    label: 'Stamp Duty Agent',
    description: 'Tax Calculation'
  }
};

function DagNode({ taskName, status }) {
  const config = NODE_CONFIG[taskName] || {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    label: taskName,
    description: 'Processing'
  };

  const statusConfig = {
    pending: { className: styles.nodePending, label: 'Pending' },
    blocked: { className: styles.nodeBlocked, label: 'Waiting' },
    in_progress: { className: styles.nodeInProgress, label: 'Processing' },
    completed: { className: styles.nodeCompleted, label: 'Complete' }
  };

  const { className, label: statusLabel } = statusConfig[status] || statusConfig.pending;

  return (
    <div className={`${styles.node} ${className}`}>
      <div className={styles.nodeIcon}>
        {config.icon}
        {status === 'in_progress' && <div className={styles.pulseRing} />}
      </div>
      <div className={styles.nodeContent}>
        <span className={styles.nodeLabel}>{config.label}</span>
        <span className={styles.nodeDescription}>{config.description}</span>
      </div>
      <div className={styles.nodeStatus}>
        {status === 'completed' && (
          <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {status === 'in_progress' && <div className={styles.spinner} />}
        {(status === 'pending' || status === 'blocked') && (
          <span className={styles.statusDot} />
        )}
        <span className={styles.statusText}>{statusLabel}</span>
      </div>
    </div>
  );
}

function DagVisualizer({ tasks = [] }) {
  // Extract tasks by type
  const getTaskStatus = (taskName) => {
    const task = tasks.find(t => t.taskName === taskName);
    return task?.status || 'pending';
  };

  const documentIngestionStatus = getTaskStatus('Document Ingestion');
  const verificationStatus = getTaskStatus('Verification_Agent');
  const ecStatus = getTaskStatus('EC_Agent');
  const stampDutyStatus = getTaskStatus('Stamp_Duty_Agent');

  // Determine connector states
  const firstConnectorActive = documentIngestionStatus === 'completed';
  const secondConnectorActive = verificationStatus === 'completed' || ecStatus === 'completed';

  return (
    <div className={styles.container}>
      <div className={styles.dag}>
        {/* Row 1: Document Ingestion */}
        <div className={styles.row}>
          <DagNode taskName="Document Ingestion" status={documentIngestionStatus} />
        </div>

        {/* Connector: Row 1 to Row 2 */}
        <div className={styles.connectorContainer}>
          <div className={`${styles.connectorVertical} ${firstConnectorActive ? styles.connectorActive : ''}`} />
          <div className={`${styles.connectorSplit} ${firstConnectorActive ? styles.connectorActive : ''}`}>
            <div className={styles.connectorHorizontal} />
            <div className={styles.connectorDot} />
            <div className={styles.connectorDot} />
          </div>
        </div>

        {/* Row 2: Verification & EC Agents */}
        <div className={styles.rowDouble}>
          <DagNode taskName="Verification_Agent" status={verificationStatus} />
          <DagNode taskName="EC_Agent" status={ecStatus} />
        </div>

        {/* Connector: Row 2 to Row 3 */}
        <div className={styles.connectorContainer}>
          <div className={`${styles.connectorMerge} ${secondConnectorActive ? styles.connectorActive : ''}`}>
            <div className={styles.connectorHorizontal} />
            <div className={styles.connectorDot} />
            <div className={styles.connectorDot} />
          </div>
          <div className={`${styles.connectorVertical} ${secondConnectorActive ? styles.connectorActive : ''}`} />
        </div>

        {/* Row 3: Stamp Duty Agent */}
        <div className={styles.row}>
          <DagNode taskName="Stamp_Duty_Agent" status={stampDutyStatus} />
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendPending}`} />
          <span>Pending</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendBlocked}`} />
          <span>Blocked</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendInProgress}`} />
          <span>Processing</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendCompleted}`} />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}

export default DagVisualizer;
