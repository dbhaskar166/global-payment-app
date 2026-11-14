import React, { useState } from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrencyAmount } from '../../engine/validation';
import { 
  CheckSquare, 
  ShieldCheck, 
  Eye, 
  Check, 
  X, 
  AlertCircle, 
  Clock, 
  Lock,
  ArrowRight
} from 'lucide-react';

export const ApprovalWorkbenchView: React.FC<{ onOpenDetail: (p: any) => void }> = ({ onOpenDetail }) => {
  const { 
    payments, 
    approvePayment, 
    rejectPayment, 
    currentUser, 
    setSelectedPayment, 
    showToast 
  } = usePaymentHub();

  const [commentMap, setCommentMap] = useState<Record<string, string>>({});

  const pendingPayments = payments.filter(p => p.status === 'PENDING_APPROVAL');

  const handleApprove = (paymentId: string, checkerNum: 1 | 2) => {
    const comment = commentMap[paymentId] || 'Approved in Workbench';
    approvePayment(paymentId, checkerNum, comment);
  };

  const handleReject = (paymentId: string) => {
    const comment = commentMap[paymentId] || 'Rejected in Workbench';
    rejectPayment(paymentId, comment);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Maker-Checker Approval Workbench
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review and authorize pending high-value transactions, dual-blind approvals, and manual operational instructions.
        </p>
      </div>

      {/* Segregation of Duties Banner */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Enforced Dual-Control & Segregation of Duties:</strong> The operator who created or modified the instruction (Maker) cannot approve the payment. Independent Checkers must review without prior exposure.
          </span>
        </div>
        <span className="font-mono text-[11px] bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded font-bold">
          Active Role: {currentUser.role}
        </span>
      </div>

      {/* Pending Items List */}
      <div className="space-y-4">
        {pendingPayments.length > 0 ? (
          pendingPayments.map(payment => {
            const isDualBlind = payment.approvalWorkflow?.dualBlind || payment.approvalWorkflow?.requiredLevel === 2;
            const checker1Status = payment.approvalWorkflow?.checker1?.status || 'PENDING';
            const checker2Status = payment.approvalWorkflow?.checker2?.status || 'PENDING';
            const isMaker = payment.approvalWorkflow?.maker.userId === currentUser.userId;

            return (
              <div 
                key={payment.paymentId}
                className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                      {payment.paymentId}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono text-xs font-semibold">
                      {payment.paymentType}
                    </span>
                    {isDualBlind && (
                      <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold text-xs">
                        DUAL-BLIND REQUIRED
                      </span>
                    )}
                  </div>

                  <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {formatCurrencyAmount(payment.amount, payment.currency)}
                  </div>
                </div>

                {/* Parties Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 font-sans uppercase">Debtor Account</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 font-sans truncate">{payment.debtor.entityName}</div>
                    <div className="text-slate-500">{payment.debtor.accountNumber}</div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 font-sans uppercase">Creditor Account</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 font-sans truncate">{payment.creditor.entityName}</div>
                    <div className="text-slate-500">{payment.creditor.accountNumber}</div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 font-sans uppercase">Initiator (Maker)</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 font-sans">
                      {payment.approvalWorkflow?.maker.userName || 'Automated GCMS Ingestion'}
                    </div>
                    <div className="text-slate-500 text-[10px]">{payment.receivedTimestamp.slice(0, 19)}Z</div>
                  </div>
                </div>

                {/* Dual-Blind Checkers Status */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-600 dark:text-slate-400">Checker 1:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        checker1Status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {checker1Status}
                      </span>
                    </div>

                    {isDualBlind && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-600 dark:text-slate-400">Checker 2 (Blind):</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          checker2Status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {checker2Status}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPayment(payment);
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect full instruction →
                  </button>
                </div>

                {/* Checker Verification Form */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-3">
                  <input
                    type="text"
                    placeholder="Approval / Rejection audit notes (e.g. Verified contract PO-8891 with Treasury)"
                    value={commentMap[payment.paymentId] || ''}
                    onChange={(e) => setCommentMap(prev => ({ ...prev, [payment.paymentId]: e.target.value }))}
                    className="flex-1 w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
                  />

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* If checker 1 pending */}
                    {checker1Status === 'PENDING' && (
                      <button
                        onClick={() => handleApprove(payment.paymentId, 1)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Sign as Checker 1</span>
                      </button>
                    )}

                    {/* If dual-blind and checker 1 approved, checker 2 pending */}
                    {isDualBlind && checker1Status === 'APPROVED' && checker2Status === 'PENDING' && (
                      <button
                        onClick={() => handleApprove(payment.paymentId, 2)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Sign as Checker 2 (Dual-Blind)</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleReject(payment.paymentId)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
            <CheckSquare className="w-8 h-8 mx-auto text-emerald-500" />
            <div className="font-semibold text-slate-700 dark:text-slate-300">Approval Queue is Clear</div>
            <p className="text-xs">No payment instructions currently pending Maker-Checker or Dual-Blind sign-off.</p>
          </div>
        )}
      </div>
    </div>
  );
};
