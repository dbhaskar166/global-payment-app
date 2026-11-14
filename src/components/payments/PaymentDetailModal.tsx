import React, { useState } from 'react';
import { PaymentInstruction, PaymentEvent } from '../../types/payment';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { StatusBadge, HoldBadge } from '../common/StatusBadge';
import { formatCurrencyAmount } from '../../engine/validation';
import { 
  X, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  GitBranch, 
  Server, 
  Share2, 
  History, 
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface PaymentDetailModalProps {
  payment: PaymentInstruction;
  onClose: () => void;
}

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({ payment, onClose }) => {
  const { events, approvePayment, rejectPayment, releaseSanctionsHold, currentUser, showToast } = usePaymentHub();
  const [activeTab, setActiveTab] = useState<'summary' | 'canonical' | 'controls' | 'transformation' | 'gateway' | 'events' | 'audit'>('summary');
  const [copied, setCopied] = useState(false);
  const [complianceNotes, setComplianceNotes] = useState('');
  const [checkerComment, setCheckerComment] = useState('');

  const paymentEvents = events.filter(e => e.paymentId === payment.paymentId);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied to clipboard', 'info');
  };

  // 18 Lifecycle Steps visualizer
  const lifecycleSteps = [
    { num: 1, name: 'Instruction Ingested', done: true },
    { num: 2, name: 'Schema Validated', done: payment.status !== 'REPAIR_REQUIRED' },
    { num: 3, name: 'Canonical Mapping', done: payment.status !== 'REPAIR_REQUIRED' },
    { num: 4, name: 'AMC SSI Enriched', done: !!payment.ssiReference || payment.status === 'CREDIT_CONFIRMED' },
    { num: 5, name: 'Controls Evaluated', done: payment.controlResults.length > 0 },
    { num: 6, name: 'Risk Assessment', done: payment.controlResults.length > 0 },
    { num: 7, name: 'Maker-Checker Approval', done: payment.status === 'APPROVED' || payment.status === 'CREDIT_CONFIRMED' || payment.status === 'SETTLED' },
    { num: 8, name: 'Message Transformed', done: !!payment.transformedMessage },
    { num: 9, name: 'Gateway Routed', done: !!payment.gatewayRecord },
    { num: 10, name: 'Gateway Submitted', done: !!payment.gatewayRecord },
    { num: 11, name: 'Gateway ACK Received', done: payment.status === 'ACKNOWLEDGED' || payment.status === 'SETTLED' || payment.status === 'CREDIT_CONFIRMED' },
    { num: 12, name: 'Credit Confirmed', done: payment.status === 'CREDIT_CONFIRMED' },
    { num: 13, name: 'Downstream Published', done: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {payment.paymentId}
              </span>
              <StatusBadge status={payment.status} />
              {payment.holds.filter(h => h.active).map(h => (
                <HoldBadge key={h.reason} reason={h.reason} />
              ))}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
              <span>UETR: {payment.uetr}</span>
              <span>·</span>
              <span>Source: {payment.sourceSystem} ({payment.sourceApplication})</span>
              <span>·</span>
              <span>Type: {payment.paymentType}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lifecycle Ribbon */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max text-[11px]">
            {lifecycleSteps.map((st, idx) => (
              <React.Fragment key={st.num}>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded font-medium ${
                  st.done 
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  <span className="font-mono text-[10px]">{st.num}.</span>
                  <span>{st.name}</span>
                </div>
                {idx < lifecycleSteps.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
          {[
            { id: 'summary', label: 'Payment Summary' },
            { id: 'canonical', label: 'Canonical & AMC SSI' },
            { id: 'controls', label: `Controls & Sanctions (${payment.controlResults.length})` },
            { id: 'transformation', label: 'Message Payload' },
            { id: 'gateway', label: 'Gateway & Settlement' },
            { id: 'events', label: `Downstream Events (${paymentEvents.length})` },
            { id: 'audit', label: 'Audit Trail' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* TAB 1: Summary */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Financial Highlight Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 font-mono">
                <div>
                  <div className="text-[11px] font-sans text-slate-500">Amount & Currency</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                    {formatCurrencyAmount(payment.amount, payment.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-sans text-slate-500">Value Date</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {payment.valueDate}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-sans text-slate-500">Priority & Charges</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {payment.paymentPriority} / {payment.charges}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-sans text-slate-500">Source Tx ID</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
                    {payment.sourceTransactionId}
                  </div>
                </div>
              </div>

              {/* Debtor & Creditor Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-blue-600 dark:text-blue-400">
                    Debtor Information (Ordering Customer)
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{payment.debtor.entityName}</div>
                  <div className="font-mono text-slate-600 dark:text-slate-400">Account: {payment.debtor.accountNumber}</div>
                  <div className="text-slate-500">{payment.debtor.address || 'Standard Registered Office'}</div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 font-mono">
                    <span className="text-slate-500 font-sans">Debtor Agent: </span>
                    {payment.debtorAgent.name} ({payment.debtorAgent.bic || payment.debtorAgent.routingNumber})
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-emerald-600 dark:text-emerald-400">
                    Creditor Information (Beneficiary)
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{payment.creditor.entityName}</div>
                  <div className="font-mono text-slate-600 dark:text-slate-400">Account: {payment.creditor.accountNumber}</div>
                  <div className="text-slate-500">{payment.creditor.address || 'Standard Beneficiary Address'}</div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 font-mono">
                    <span className="text-slate-500 font-sans">Creditor Agent: </span>
                    {payment.creditorAgent.name} ({payment.creditorAgent.bic || payment.creditorAgent.routingNumber})
                  </div>
                </div>
              </div>

              {/* Remittance Information */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Remittance & Purpose
                </div>
                <div className="text-slate-800 dark:text-slate-200 font-medium">
                  {payment.paymentPurpose}
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  Unstructured: {payment.remittanceInformation}
                </div>
              </div>

              {/* Action Bar for Pending Approval / Holds */}
              {payment.status === 'PENDING_APPROVAL' && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
                    <Clock className="w-4 h-4" />
                    <span>Maker-Checker Approval Required</span>
                  </div>
                  <p className="text-amber-800 dark:text-amber-300">
                    This high-value payment requires authorized Checker verification before dispatch to SWIFT/Domestic clearing.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Checker verification comments (e.g. verified contract PO-991)"
                      value={checkerComment}
                      onChange={(e) => setCheckerComment(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs"
                    />
                    <button
                      onClick={() => approvePayment(payment.paymentId, 1, checkerComment || 'Approved in Workbench')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded"
                    >
                      Approve & Release
                    </button>
                    <button
                      onClick={() => rejectPayment(payment.paymentId, checkerComment || 'Rejected by Checker')}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {payment.status === 'ON_HOLD' && payment.sanctionsResult && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-rose-900 dark:text-rose-200">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Compliance Sanctions Action</span>
                  </div>
                  <p className="text-rose-800 dark:text-rose-300">
                    {payment.sanctionsResult.complianceNotes}
                  </p>
                  {currentUser.role === 'COMPLIANCE_OFFICER' || currentUser.role === 'SYSTEM_ADMIN' ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Compliance release rationale (e.g. Verified legitimate entity, false positive)"
                        value={complianceNotes}
                        onChange={(e) => setComplianceNotes(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-xs"
                      />
                      <button
                        onClick={() => releaseSanctionsHold(payment.paymentId, complianceNotes || 'Cleared after sanctions review')}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded whitespace-nowrap"
                      >
                        Authorize & Release Hold
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-rose-700 dark:text-rose-400 italic">
                      Current role: {currentUser.role}. Switch to 'Marcus Vance (COMPLIANCE OFFICER)' in header to authorize release.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Canonical & AMC SSI */}
          {activeTab === 'canonical' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                  <span>Account Management System (AMC) SSI Reference</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold uppercase">
                    Verified
                  </span>
                </div>
                {payment.ssiReference ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div>
                      <div className="text-slate-500 font-sans text-[11px]">SSI ID</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{payment.ssiReference.id}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-sans text-[11px]">Nostro Account</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{payment.ssiReference.nostroAccount}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-sans text-[11px]">Correspondent BIC</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{payment.ssiReference.correspondentBic}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-sans text-[11px]">Effective Validity</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{payment.ssiReference.effectiveDate} → {payment.ssiReference.expiryDate}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs">
                    No static AMC SSI pre-configured for this account. Standard auto-routing executed.
                  </div>
                )}
              </div>

              {/* Raw Inbound Payload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Original Inbound JSON Payload</span>
                  <button
                    onClick={() => handleCopy(payment.originalPayloadJson)}
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
                  {payment.originalPayloadJson}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Controls & Sanctions */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {payment.controlResults.map((ctrl, i) => (
                  <div 
                    key={i}
                    className={`p-4 rounded-lg border text-xs space-y-1.5 ${
                      ctrl.passed 
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold">
                        {ctrl.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        )}
                        <span className="font-mono text-slate-500">{ctrl.controlId}</span>
                        <span className="text-slate-900 dark:text-white">{ctrl.controlName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ctrl.passed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {ctrl.passed ? 'PASSED' : ctrl.failureAction}
                        </span>
                      </div>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 pl-6 leading-relaxed">
                      {ctrl.message}
                    </div>
                    <div className="text-[10px] text-slate-400 pl-6 font-mono">
                      Executed at: {ctrl.executedAt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Message Payload (ISO 20022 XML / ISSAC / ACH) */}
          {activeTab === 'transformation' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Transformed Financial Message: {payment.transformedMessage?.format || 'ISO 20022'}
                  </span>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Schema: {payment.transformedMessage?.schemaVersion || 'pacs.008.001.10'} · Hash: {payment.transformedMessage?.hash || 'N/A'}
                  </div>
                </div>
                {payment.transformedMessage && (
                  <button
                    onClick={() => handleCopy(payment.transformedMessage!.rawPayload)}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Message</span>
                  </button>
                )}
              </div>

              {payment.transformedMessage ? (
                <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto max-h-96 border border-slate-800 whitespace-pre leading-relaxed">
                  {payment.transformedMessage.rawPayload}
                </pre>
              ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed rounded-lg">
                  Message transformation pending approval or control release.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Gateway & Settlement */}
          {activeTab === 'gateway' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Gateway Connectivity & Clearing Confirmation
                </div>
                {payment.gatewayRecord ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div>
                      <div className="text-slate-500 font-sans text-[11px]">Selected Gateway</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{payment.gatewayRecord.gatewayName}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-sans text-[11px]">Gateway Reference</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{payment.gatewayRecord.gatewayReference}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-sans text-[11px]">Submission Time</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{payment.gatewayRecord.submissionTimestamp.slice(11, 23)}Z</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-sans text-[11px]">Credit Confirmation Time</div>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {payment.gatewayRecord.creditConfirmationTimestamp?.slice(11, 23) || 'Pending'}Z
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs">Payment not yet submitted to gateway.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: Downstream Events */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 mb-2">
                Transactional Outbox events published to downstream consumers (Audit, General Ledger, Reconciliation, Data Lake).
              </div>
              {paymentEvents.length > 0 ? (
                <div className="space-y-2">
                  {paymentEvents.map(evt => (
                    <div key={evt.eventId} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="font-bold text-blue-600 dark:text-blue-400">{evt.eventType}</div>
                        <div className="text-[11px] text-slate-400">ID: {evt.eventId} · Time: {evt.eventTimestamp.slice(11, 23)}Z</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {evt.deliveryStatus.map(d => (
                          <span key={d.target} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {d.target.slice(0, 4)}: {d.status}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 border border-dashed rounded-lg">
                  No downstream events recorded yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 7: Audit */}
          {activeTab === 'audit' && (
            <div className="space-y-2">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs text-slate-700 dark:text-slate-300">
                <div>Audit Trace: TRACE-{payment.uetr.slice(0, 8)}</div>
                <div>Node ID: GPH-NODE-PROD-01</div>
                <div>Received: {payment.receivedTimestamp}</div>
                <div>Last Mutation: {payment.lastUpdatedTimestamp}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="text-xs text-slate-500 font-mono">
            Payment Status: <span className="font-bold">{payment.status}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
