import React, { useState } from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { 
  X, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Server,
  Activity,
  Layers,
  Wrench,
  CheckSquare
} from 'lucide-react';

interface ScenarioRunnerModalProps {
  onClose: () => void;
}

export const ScenarioRunnerModal: React.FC<ScenarioRunnerModalProps> = ({ onClose }) => {
  const { runScenario } = usePaymentHub();
  const [runningId, setRunningId] = useState<number | null>(null);
  const [scenarioResults, setScenarioResults] = useState<Record<number, string>>({});

  const scenarios = [
    {
      id: 1,
      title: 'Scenario 1: Product Processor Payment (GCMS → BOX → pacs.008)',
      category: 'Core Orchestration',
      description: 'Receive instruction from GCMS, validate schema, enrich AMC SSI, execute 5 controls, transform to pacs.008, route through SWIFT BOX, receive ACK and beneficiary Credit Confirmation, publish downstream events.',
    },
    {
      id: 2,
      title: 'Scenario 2: Financial Institution Payment (Treasury → CitiSwitch → pacs.009)',
      category: 'Institutional High-Value',
      description: 'Receive bank-to-bank liquidity instruction, validate institutional rules, transform to pacs.009.001.10, route via CitiSwitch SWIFT gateway, and track real-time gross settlement confirmation.',
    },
    {
      id: 3,
      title: 'Scenario 3: Domestic Instant Clearing (CORP_PAY → ISSAC)',
      category: 'Domestic Clearing',
      description: 'Receive domestic supplier payment, apply domestic sort-code validation, transform to ISSAC JSON Clearing format, route through ISSAC gateway, receive sub-second ACK and settlement.',
    },
    {
      id: 4,
      title: 'Scenario 4: Manual Payment with AMC SSI & Maker-Checker',
      category: 'Operations & AMC',
      description: 'Operations Maker creates payment, system automatically retrieves Standing Settlement Instructions (SSI) from AMC, executes controls, queues for Checker verification, and routes upon approval.',
    },
    {
      id: 5,
      title: 'Scenario 5: Sanctions Screening Alert & Compliance Hold',
      category: 'Sanctions & OFAC',
      description: 'Payment matches sanctioned entity on OFAC SDN list. Payment is immediately placed ON_HOLD. Authorized Compliance Officer investigates and decides release or rejection with an audit trail.',
    },
    {
      id: 6,
      title: 'Scenario 6: Duplicate Payment Detection & Resolution',
      category: 'Risk Controls',
      description: 'Candidate payment with identical debtor, creditor, amount, and value date arrives within the 60-minute window. Placed on DUPLICATE_SUSPECT hold for Operations investigation.',
    },
    {
      id: 7,
      title: 'Scenario 7: Dual-Blind Risk Approval',
      category: 'Dual-Control',
      description: 'High-value transfer exceeding $2M mandates two independent checkers. Checker 1 reviews blind, Checker 2 reviews independently without viewing Checker 1. Released only after both sign off.',
    },
    {
      id: 8,
      title: 'Scenario 8: Payment Pipeline Configuration & Activation',
      category: 'Configuration',
      description: 'Navigate to visual Pipeline Designer. Inspect 14 stages, toggle stages, test sandbox execution, submit for Checker signoff, and activate pipeline version.',
    },
    {
      id: 9,
      title: 'Scenario 9: Gateway Failure & Automated Circuit-Breaker Failover',
      category: 'Resilience & Failover',
      description: 'Primary SWIFT BOX gateway goes OFFLINE. Processing engine detects circuit-breaker trip, automatically reroutes transaction to secondary CitiSwitch gateway without duplicate execution.',
    },
    {
      id: 10,
      title: 'Scenario 10: Downstream Event Publication & Outbox Delivery',
      category: 'Event-Driven Outbox',
      description: 'Inspect Transactional Outbox publishing 18 distinct payment lifecycle events with guaranteed delivery tracking to Audit, General Ledger, Reconciliation, and Data Lake.',
    },
  ];

  const handleExecute = async (id: number) => {
    setRunningId(id);
    try {
      const result = await runScenario(id);
      setScenarioResults(prev => ({ ...prev, [id]: result }));
      // Close scenario modal after short delay so user lands on the resulting view
      setTimeout(() => {
        onClose();
      }, 700);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Mandatory Acceptance Criteria Scenarios (1 to 10)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Directly verify all 10 end-to-end scenarios required by Section 17 of the Master Prompt.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenarios List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
          {scenarios.map(sc => {
            const isRunning = runningId === sc.id;
            const result = scenarioResults[sc.id];

            return (
              <div 
                key={sc.id} 
                className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                        #{sc.id}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">
                        {sc.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                        {sc.category}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {sc.description}
                    </p>
                  </div>

                  <button
                    disabled={isRunning}
                    onClick={() => handleExecute(sc.id)}
                    className="self-start sm:self-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isRunning ? 'Running...' : 'Execute Scenario'}</span>
                  </button>
                </div>

                {/* Outcome Display */}
                {result && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-900 dark:text-emerald-200 flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{result}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end bg-slate-50 dark:bg-slate-900/80">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded text-xs transition-colors"
          >
            Close Runner
          </button>
        </div>
      </div>
    </div>
  );
};
