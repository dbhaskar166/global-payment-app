import React, { useState } from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { 
  transformToPacs008, 
  transformToPacs009, 
  transformToIssacDomestic, 
  transformToAchFixedWidth 
} from '../../engine/transformations';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Layers, 
  ArrowRight,
  Code2
} from 'lucide-react';

export const MessageMappingView: React.FC = () => {
  const { payments, showToast } = usePaymentHub();
  const [selectedFormat, setSelectedFormat] = useState<'pacs.008' | 'pacs.009' | 'ISSAC' | 'ACH'>('pacs.008');
  const [copied, setCopied] = useState(false);

  // Sample payment for live transformation preview
  const samplePayment = payments[0];

  const getTransformedPreview = () => {
    switch (selectedFormat) {
      case 'pacs.008':
        return transformToPacs008(samplePayment);
      case 'pacs.009':
        return transformToPacs009(samplePayment);
      case 'ISSAC':
        return transformToIssacDomestic(samplePayment);
      case 'ACH':
        return transformToAchFixedWidth(samplePayment);
    }
  };

  const currentPreview = getTransformedPreview();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPreview.rawPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied payload to clipboard', 'info');
  };

  const formatSpecs = {
    'pacs.008': {
      title: 'SWIFT ISO 20022 — pacs.008.001.10',
      subtitle: 'FI-to-FI Customer Credit Transfer (CBPR+ Compliant)',
      schema: 'urn:iso:std:iso:20022:tech:xsd:pacs.008.001.10',
      description: 'Used for cross-border and high-value customer payments. Includes Business Application Header (AppHdr head.001), Group Header, and Credit Transfer Transaction Information.',
    },
    'pacs.009': {
      title: 'SWIFT ISO 20022 — pacs.009.001.10',
      subtitle: 'FI-to-FI Financial Institution Credit Transfer (Core & COV)',
      schema: 'urn:iso:std:iso:20022:tech:xsd:pacs.009.001.10',
      description: 'Used for bank-to-bank treasury movements, central bank liquidity operations, and interbank nostro rebalancing.',
    },
    'ISSAC': {
      title: 'ISSAC Domestic Instant Clearing — JSON V2.4',
      subtitle: 'Real-time Domestic Settlement Specification',
      schema: 'ISSAC-INSTANT-CLEARING-2.4.SCHEMA.JSON',
      description: 'Ultra-low latency domestic clearing packet with direct sort-code routing and sub-second confirmation hooks.',
    },
    'ACH': {
      title: 'Domestic ACH — NACHA Fixed-Width 94-Byte Format',
      subtitle: 'Standard US Automated Clearing House batch structure',
      schema: 'NACHA-RECORD-SPEC-2026',
      description: 'Batch file format with 94-character fixed records: Record 1 (File Header), Record 5 (Batch Header), Record 6 (Entry Detail CCD/PPD), Record 8 (Batch Control), Record 9 (File Control).',
    },
  };

  const currentSpec = formatSpecs[selectedFormat];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Message Transformation & Schema Mapping
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configurable financial message transformation engine supporting ISO 20022 CBPR+ and domestic clearing formats.
        </p>
      </div>

      {/* Format Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {(['pacs.008', 'pacs.009', 'ISSAC', 'ACH'] as const).map(fmt => (
          <button
            key={fmt}
            onClick={() => setSelectedFormat(fmt)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              selectedFormat === fmt
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {fmt}
          </button>
        ))}
      </div>

      {/* Format Header Card */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-base font-bold text-slate-900 dark:text-white">{currentSpec.title}</div>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
            {currentSpec.schema}
          </span>
        </div>
        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{currentSpec.subtitle}</div>
        <p className="text-xs text-slate-500 leading-relaxed">{currentSpec.description}</p>
      </div>

      {/* Side-by-Side: Canonical Mapping Model & Transformed Payload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Canonical Model */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Inbound Canonical Data Model (Normalized)
            </span>
            <span className="font-mono text-xs text-blue-600 dark:text-blue-400">
              {samplePayment.paymentId}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 font-mono space-y-1">
              <div><strong className="font-sans text-slate-500">UETR:</strong> {samplePayment.uetr}</div>
              <div><strong className="font-sans text-slate-500">Amount / Currency:</strong> {samplePayment.amount} {samplePayment.currency}</div>
              <div><strong className="font-sans text-slate-500">Value Date:</strong> {samplePayment.valueDate}</div>
              <div><strong className="font-sans text-slate-500">Charges:</strong> {samplePayment.charges}</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 font-mono space-y-1">
              <div><strong className="font-sans text-slate-500">Debtor Entity:</strong> {samplePayment.debtor.entityName}</div>
              <div><strong className="font-sans text-slate-500">Debtor Account:</strong> {samplePayment.debtor.accountNumber}</div>
              <div><strong className="font-sans text-slate-500">Debtor Agent BIC:</strong> {samplePayment.debtorAgent.bic}</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 font-mono space-y-1">
              <div><strong className="font-sans text-slate-500">Creditor Entity:</strong> {samplePayment.creditor.entityName}</div>
              <div><strong className="font-sans text-slate-500">Creditor Account:</strong> {samplePayment.creditor.accountNumber}</div>
              <div><strong className="font-sans text-slate-500">Creditor Agent BIC:</strong> {samplePayment.creditorAgent.bic}</div>
            </div>
          </div>
        </div>

        {/* Transformed Output */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              2. Transformed Financial Message
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>

          <pre className="flex-1 p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto whitespace-pre leading-relaxed max-h-[480px]">
            {currentPreview.rawPayload}
          </pre>
        </div>
      </div>
    </div>
  );
};
