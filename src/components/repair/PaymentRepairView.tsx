import React, { useState } from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { PaymentInstruction } from '../../types/payment';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrencyAmount } from '../../engine/validation';
import { 
  Wrench, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle2, 
  Send, 
  Save 
} from 'lucide-react';

export const PaymentRepairView: React.FC = () => {
  const { payments, repairAndResubmitPayment, setSelectedPayment, showToast, currentUser } = usePaymentHub();

  const repairList = payments.filter(p => p.status === 'REPAIR_REQUIRED');
  const [selectedRepairId, setSelectedRepairId] = useState<string>(repairList[0]?.paymentId || '');

  const activePayment = repairList.find(p => p.paymentId === selectedRepairId) || repairList[0];

  // Editable repair fields
  const [debtorAccount, setDebtorAccount] = useState(activePayment?.debtor?.accountNumber || '');
  const [creditorAccount, setCreditorAccount] = useState(activePayment?.creditor?.accountNumber || '');
  const [debtorBic, setDebtorBic] = useState(activePayment?.debtorAgent?.bic || '');
  const [creditorBic, setCreditorBic] = useState(activePayment?.creditorAgent?.bic || '');
  const [amount, setAmount] = useState<number>(activePayment?.amount || 0);
  const [remittance, setRemittance] = useState(activePayment?.remittanceInformation || '');
  const [repairReason, setRepairReason] = useState('Corrected missing debtor account from customer mandate');

  // Sync state when activePayment changes
  React.useEffect(() => {
    if (activePayment) {
      setDebtorAccount(activePayment.debtor?.accountNumber || '');
      setCreditorAccount(activePayment.creditor?.accountNumber || '');
      setDebtorBic(activePayment.debtorAgent?.bic || '');
      setCreditorBic(activePayment.creditorAgent?.bic || '');
      setAmount(activePayment.amount || 0);
      setRemittance(activePayment.remittanceInformation || '');
    }
  }, [selectedRepairId]);

  const handleResubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayment) return;

    repairAndResubmitPayment(activePayment.paymentId, {
      amount,
      debtor: { ...activePayment.debtor, accountNumber: debtorAccount },
      creditor: { ...activePayment.creditor, accountNumber: creditorAccount },
      debtorAgent: { ...activePayment.debtorAgent, bic: debtorBic },
      creditorAgent: { ...activePayment.creditorAgent, bic: creditorBic },
      remittanceInformation: remittance,
    }, repairReason);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Payment Repair & Exception Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Operations repair desk for payments halted by schema validation, SSI errors, or formatting defects.
        </p>
      </div>

      {repairList.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Repair Queue List */}
          <div className="lg:col-span-1 space-y-2">
            <div className="text-xs font-semibold text-slate-500 mb-2">
              Exceptions Pending Repair ({repairList.length})
            </div>
            {repairList.map(p => {
              const isSelected = p.paymentId === activePayment?.paymentId;
              return (
                <div
                  key={p.paymentId}
                  onClick={() => setSelectedRepairId(p.paymentId)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all text-xs space-y-2 ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{p.paymentId}</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrencyAmount(p.amount, p.currency)}
                    </span>
                  </div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    {p.debtor.entityName} → {p.creditor.entityName}
                  </div>
                  <div className="text-rose-600 dark:text-rose-400 text-[11px] font-medium">
                    {p.controlResults.find(c => !c.passed)?.message || 'Validation error'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Repair Form */}
          {activePayment && (
            <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">{activePayment.paymentId}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 font-bold">
                      REPAIR REQUIRED
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-1">UETR: {activePayment.uetr}</div>
                </div>

                <button
                  onClick={() => setSelectedPayment(activePayment)}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Inspect 360 View
                </button>
              </div>

              {/* Validation Errors Alert Box */}
              <div className="p-4 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-lg space-y-2 text-xs">
                <div className="font-semibold text-orange-900 dark:text-orange-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span>Validation & Control Errors</span>
                </div>
                {activePayment.controlResults.filter(c => !c.passed).map((c, i) => (
                  <div key={i} className="text-orange-800 dark:text-orange-300 pl-6 leading-relaxed">
                    · {c.message}
                  </div>
                ))}
              </div>

              {/* Editable Fields Form */}
              <form onSubmit={handleResubmit} className="space-y-4 text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1">
                  Correct Permitted Fields
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                      Debtor Account Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={debtorAccount}
                      onChange={(e) => setDebtorAccount(e.target.value)}
                      placeholder="e.g. ACC-US-100234"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                      Creditor Account Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={creditorAccount}
                      onChange={(e) => setCreditorAccount(e.target.value)}
                      placeholder="e.g. ACC-GB-550198"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Debtor BIC</label>
                    <input
                      type="text"
                      value={debtorBic}
                      onChange={(e) => setDebtorBic(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-slate-100 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Creditor BIC</label>
                    <input
                      type="text"
                      value={creditorBic}
                      onChange={(e) => setCreditorBic(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-slate-100 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Amount</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono tabular-nums text-slate-900 dark:text-slate-100 font-semibold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Remittance Information</label>
                  <input
                    type="text"
                    value={remittance}
                    onChange={(e) => setRemittance(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Repair Audit Reason <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={repairReason}
                    onChange={(e) => setRepairReason(e.target.value)}
                    placeholder="Explanation for audit log (e.g. Populated missing debtor account verified with ERP mandate)"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-xs"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Re-validate, Re-run Controls & Resubmit</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
          <div className="font-semibold text-slate-700 dark:text-slate-300">No Exception Payments Pending Repair</div>
          <p className="text-xs">All payment instructions have either validated cleanly or are progressing through active workflows.</p>
        </div>
      )}
    </div>
  );
};
