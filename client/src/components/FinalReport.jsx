import { useCallback } from 'react';
import { jsPDF } from 'jspdf';
import styles from './FinalReport.module.css';

function StatusBadge({ value, trueLabel = 'Yes', falseLabel = 'No' }) {
  const isTrue = value === true || value === 'true';
  return (
    <span className={`${styles.badge} ${isTrue ? styles.badgeSuccess : styles.badgeWarning}`}>
      {isTrue ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      {isTrue ? trueLabel : falseLabel}
    </span>
  );
}

function formatCurrency(amount, currency) {
  if (amount === undefined || amount === null) return 'N/A';

  // Validate currency code - must be a valid 3-letter ISO 4217 code
  const validCurrency = currency && /^[A-Z]{3}$/i.test(currency) ? currency.toUpperCase() : 'INR';

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: validCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  return formatter.format(amount);
}

function FinalReport({ reportData }) {
  const { verification = {}, encumbrance = {}, stampDuty = {} } = reportData || {};

  // Generate and download PDF report
  const handleDownloadPDF = useCallback(() => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Helper function to add text
    const addText = (text, x, y, options = {}) => {
      const { fontSize = 12, fontStyle = 'normal', color = [0, 0, 0] } = options;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      doc.setTextColor(...color);
      doc.text(text, x, y);
      return y + (fontSize * 0.5);
    };

    // Helper function to add a section header
    const addSectionHeader = (title, y) => {
      doc.setFillColor(59, 130, 246);
      doc.rect(15, y - 5, pageWidth - 30, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 20, y + 2);
      doc.setTextColor(0, 0, 0);
      return y + 15;
    };

    // Title
    doc.setFillColor(30, 30, 40);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Real Estate Contract Analysis', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 32, { align: 'center' });

    yPos = 55;

    // Verification Section
    yPos = addSectionHeader('Verification Results', yPos);

    yPos = addText(`Identities Valid: ${verification.identities_valid ? 'Yes' : 'No'}`, 20, yPos);
    yPos += 5;
    yPos = addText(`Zone Type: ${verification.zone_type || 'Unknown'}`, 20, yPos);
    yPos += 5;

    if (verification.flagged_issues && verification.flagged_issues.length > 0) {
      yPos = addText('Flagged Issues:', 20, yPos, { fontStyle: 'bold' });
      yPos += 3;
      verification.flagged_issues.forEach((issue) => {
        yPos = addText(`  • ${issue}`, 25, yPos);
        yPos += 3;
      });
    }

    yPos += 10;

    // Encumbrance Section
    yPos = addSectionHeader('Encumbrance Check', yPos);

    yPos = addText(`Clear Title Likely: ${encumbrance.clear_title_likely ? 'Yes' : 'No'}`, 20, yPos);
    yPos += 5;

    if (encumbrance.risk_factors && encumbrance.risk_factors.length > 0) {
      yPos = addText('Risk Factors:', 20, yPos, { fontStyle: 'bold' });
      yPos += 3;
      encumbrance.risk_factors.forEach((risk) => {
        yPos = addText(`  • ${risk}`, 25, yPos);
        yPos += 3;
      });
    } else {
      yPos = addText('No risk factors identified', 20, yPos, { color: [16, 185, 129] });
    }

    yPos += 10;

    // Financial Section
    yPos = addSectionHeader('Financial Analysis', yPos);

    // Validate currency code for PDF
    const pdfCurrency = stampDuty.currency && /^[A-Z]{3}$/i.test(stampDuty.currency)
      ? stampDuty.currency.toUpperCase()
      : 'INR';
    const formatAmount = (amount) => {
      if (amount === undefined || amount === null) return 'N/A';
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: pdfCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    yPos = addText(`Sale Price: ${formatAmount(stampDuty.extracted_sale_price)}`, 20, yPos);
    yPos += 5;
    yPos = addText(`Stamp Duty (7%): ${formatAmount(stampDuty.estimated_stamp_duty)}`, 20, yPos);
    yPos += 5;
    yPos = addText(`Registration Fee (1%): ${formatAmount(stampDuty.estimated_registration_fee)}`, 20, yPos);
    yPos += 8;

    const totalTaxes = (stampDuty.estimated_stamp_duty || 0) + (stampDuty.estimated_registration_fee || 0);
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos - 5, pageWidth - 30, 12, 'F');
    yPos = addText(`Total Estimated Taxes: ${formatAmount(totalTaxes)}`, 20, yPos + 2, { fontSize: 14, fontStyle: 'bold' });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFillColor(30, 30, 40);
    doc.rect(0, footerY - 5, pageWidth, 20, 'F');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    doc.text('Generated by Real Estate AI Pipeline', pageWidth / 2, footerY + 5, { align: 'center' });

    // Save the PDF
    doc.save(`contract-analysis-${new Date().toISOString().split('T')[0]}.pdf`);
  }, [verification, encumbrance, stampDuty]);

  // Print the report
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Verification Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
            </div>
            <div className={styles.cardTitle}>
              <h3>Verification Results</h3>
              <p>Identity & Property Validation</p>
            </div>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Identities Valid</span>
              <StatusBadge value={verification.identities_valid} trueLabel="Valid" falseLabel="Invalid" />
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Zone Type</span>
              <span className={styles.statValue}>{verification.zone_type || 'Unknown'}</span>
            </div>

            {verification.flagged_issues && verification.flagged_issues.length > 0 && (
              <div className={styles.issueSection}>
                <span className={styles.issueLabel}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Flagged Issues ({verification.flagged_issues.length})
                </span>
                <ul className={styles.issueList}>
                  {verification.flagged_issues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Encumbrance Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.cardIconPurple}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className={styles.cardTitle}>
              <h3>Encumbrance Check</h3>
              <p>Liens & Title Assessment</p>
            </div>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Clear Title Likely</span>
              <StatusBadge value={encumbrance.clear_title_likely} trueLabel="Clear" falseLabel="Issues Found" />
            </div>

            {encumbrance.risk_factors && encumbrance.risk_factors.length > 0 && (
              <div className={styles.issueSection}>
                <span className={styles.issueLabel}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Risk Factors ({encumbrance.risk_factors.length})
                </span>
                <ul className={styles.riskList}>
                  {encumbrance.risk_factors.map((risk, idx) => (
                    <li key={idx}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}

            {(!encumbrance.risk_factors || encumbrance.risk_factors.length === 0) && (
              <div className={styles.emptyState}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>No risk factors identified</span>
              </div>
            )}
          </div>
        </div>

        {/* Stamp Duty Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.cardIconGreen}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <div className={styles.cardTitle}>
              <h3>Financial Analysis</h3>
              <p>Tax & Fee Calculations</p>
            </div>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.financialGrid}>
              <div className={styles.financialItem}>
                <span className={styles.financialLabel}>Sale Price</span>
                <span className={styles.financialValue}>
                  {formatCurrency(stampDuty.extracted_sale_price, stampDuty.currency)}
                </span>
              </div>

              <div className={styles.financialItem}>
                <span className={styles.financialLabel}>Stamp Duty (7%)</span>
                <span className={`${styles.financialValue} ${styles.financialHighlight}`}>
                  {formatCurrency(stampDuty.estimated_stamp_duty, stampDuty.currency)}
                </span>
              </div>

              <div className={styles.financialItem}>
                <span className={styles.financialLabel}>Registration Fee (1%)</span>
                <span className={`${styles.financialValue} ${styles.financialHighlight}`}>
                  {formatCurrency(stampDuty.estimated_registration_fee, stampDuty.currency)}
                </span>
              </div>

              <div className={`${styles.financialItem} ${styles.financialTotal}`}>
                <span className={styles.financialLabel}>Total Estimated Taxes</span>
                <span className={styles.financialValue}>
                  {formatCurrency(
                    (stampDuty.estimated_stamp_duty || 0) + (stampDuty.estimated_registration_fee || 0),
                    stampDuty.currency
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Section */}
      <div className={styles.actions}>
        <button className={styles.downloadButton} onClick={handleDownloadPDF}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Full Report
        </button>
        <button className={styles.printButton} onClick={handlePrint}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print
        </button>
      </div>
    </div>
  );
}

export default FinalReport;
