import React, { useState } from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { AMC_SSI_DIRECTORY, retrieveSsiFromAmc } from '../../engine/orchestrator';
import { StandingSettlementInstruction, PaymentType, PaymentPriority } from '../../types/payment';
import { 
  Building2, 
  Send, 
  Search, 
  CheckCircle2, 
  FileText, 
  Save, 
  AlertCircle 
} from 'lucide-react';

export const ManualPaymentView: React.FC = () => {
  const { ingestPayment, currentUser, setActiveNav, showToast, setSelectedPayment } = usePaymentHub();

  const [paymentType, setPaymentType] = useState<PaymentType>('SWIFT_PACS_008');
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState<number>(185000);
  const [valueDate, setValueDate] = useState('2026-11-06');
  const [priority, setPriority] = useState<PaymentPriority>('HIGH');
  const [charges, setCharges] = useState<'OUR' | 'SHA' | 'BEN'>('SHA');

  // Debtor
  const [debtorEntity, setDebtorEntity] = useState('ACME CORP GLOBAL');
  const [debtorAccount, setDebtorAccount] = useState('ACC-US-100234');
  const [debtorCountry, setDebtorCountry] = useState('US');
  const [debtorBic, setDebtorBic] = useState('CITIUS33XXX');

  // Creditor
  const [creditorName, setCreditorName] = useState('SHANGHAI OVERSEAS TRADING');
  const [creditorAccount, setCreditorAccount] = useState('ACC-CN-778899');
  const [creditorCountry, setCreditorCountry] = useState('CN');
  const [creditorBic, setCreditorBic] = useState('BKCHCNBJXXX');
  const [intermediaryBic, setIntermediaryBic] = useState('');

  // Remittance
  const [paymentPurpose, setPaymentPurpose] = useState('Commercial Supplier Settlement');
  const [remittanceInfo, setRemittanceInfo] = useState('INVOICE SH-99120 SUPPLIES');
  const [makerComments, setMakerComments] = useState('Manual payment initiated by Operations Maker under contract terms');

  // AMC SSI state
  const [selectedSsi, setSelectedSsi] = useState<StandingSettlementInstruction | null>(
    AMC_SSI_DIRECTORY['ACC-US-100234'] || null
  );
  const [showSsiDirectory, setShowSsiDirectory] = useState(false);

  const handleAccountChange = (acc: string) => {
    setDebtorAccount(acc);
    const ssi = retrieveSsiFromAmc(acc);
    if (ssi) {
      setSelectedSsi(ssi);
      setDebtorBic(ssi.correspondentBic);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!debtorAccount || !creditorAccount || !amount || amount <= 0) {
      showToast('Please fill all mandatory fields with positive amount.', 'error');
      return;
    }

    const isHighValue = amount >= 1000000;
    const isDualBlind = amount >= 2000000;

    const payment = ingestPayment({
      sourceSystem: 'MANUAL_UI',
      sourceApplication: 'OperationsPortal',
      channel: 'INTERNAL',
      paymentType,
      currency,
      amount,
      valueDate,
      paymentPriority: priority,
      charges,
      debtor: {
        entityName: debtorEntity,
        accountNumber: debtorAccount,
        country: debtorCountry,
      },
      creditor: {
        entityName: creditorName,
        accountNumber: creditorAccount,
        country: creditorCountry,
      },
      debtorAgent: {
        bic: debtorBic,
        name: selectedSsi?.correspondentBic ? 'Citibank AMC Settled' : 'Citibank N.A.',
        country: debtorCountry,
      },
      creditorAgent: {
        bic: creditorBic,
        name: creditorName + ' Agent Bank',
        country: creditorCountry,
      },
      paymentPurpose,
      remittanceInformation: remittanceInfo,
      approvalWorkflow: {
        requiredLevel: isDualBlind ? 2 : 1,
        dualBlind: isDualBlind,
        maker: {
          userId: currentUser.userId,
          userName: currentUser.name,
          timestamp: new Date().toISOString(),
          comment: makerComments,
        },
      },
    }, true);

    setSelectedPayment(payment);
    if (payment.status === 'PENDING_APPROVAL') {
      setActiveNav('approval-workbench');
    } else {
      setActiveNav('payments');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Manual Payment Creation
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Initiate manual payment instructions with automated AMC Standing Settlement Instructions (SSI) enrichment.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Parameters */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Payment Classification & Value
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
              >
                <option value="SWIFT_PACS_008">SWIFT pacs.008 (Customer Transfer)</option>
                <option value="SWIFT_PACS_009">SWIFT pacs.009 (FI Transfer)</option>
                <option value="DOMESTIC_ISSAC">ISSAC Domestic Instant Clearing</option>
                <option value="DOMESTIC_RTGS">Domestic RTGS</option>
                <option value="DOMESTIC_ACH">Domestic ACH</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="SGD">SGD - Singapore Dollar</option>
                <option value="CHF">CHF - Swiss Franc</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono tabular-nums font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Value Date</label>
              <input
                type="date"
                value={valueDate}
                onChange={(e) => setValueDate(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PaymentPriority)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
              >
                <option value="NORMAL">Normal Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent / Real-Time</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Charges</label>
              <select
                value={charges}
                onChange={(e) => setCharges(e.target.value as any)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
              >
                <option value="SHA">SHA - Shared</option>
                <option value="OUR">OUR - Debtor pays all</option>
                <option value="BEN">BEN - Creditor pays all</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Maker Officer</label>
              <input
                type="text"
                disabled
                value={`${currentUser.name} (${currentUser.role})`}
                className="w-full p-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded text-slate-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Debtor & AMC SSI Integration */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>2. Debtor & AMC SSI Integration (Account Management System)</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowSsiDirectory(!showSsiDirectory)}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              {showSsiDirectory ? 'Hide AMC Directory' : 'Browse AMC SSI Directory'}
            </button>
          </div>

          {/* AMC Directory Selector */}
          {showSsiDirectory && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-900 space-y-2">
              <div className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                Select Standing Settlement Instruction from AMC:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {Object.values(AMC_SSI_DIRECTORY).map(ssi => (
                  <button
                    key={ssi.id}
                    type="button"
                    onClick={() => {
                      setSelectedSsi(ssi);
                      setDebtorAccount(ssi.debtorAccount);
                      setDebtorEntity(ssi.entityId);
                      setDebtorBic(ssi.correspondentBic);
                      setShowSsiDirectory(false);
                      showToast(`AMC SSI ${ssi.id} applied for ${ssi.entityId}`, 'success');
                    }}
                    className={`p-2 rounded text-left border text-xs transition-colors ${
                      selectedSsi?.id === ssi.id
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <div className="font-bold truncate">{ssi.entityId}</div>
                    <div className="text-[11px] font-mono">{ssi.debtorAccount} · {ssi.currency}</div>
                    <div className="text-[10px] opacity-80">Nostro: {ssi.nostroAccount}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active SSI Banner */}
          {selectedSsi && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong className="text-emerald-900 dark:text-emerald-200">Enriched with AMC SSI:</strong> {selectedSsi.id} · Nostro: {selectedSsi.nostroAccount} · BIC: {selectedSsi.correspondentBic}
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold rounded">
                ACTIVE
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Debtor Entity</label>
              <input
                type="text"
                value={debtorEntity}
                onChange={(e) => setDebtorEntity(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Debtor Account</label>
              <input
                type="text"
                value={debtorAccount}
                onChange={(e) => handleAccountChange(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Debtor Country</label>
              <input
                type="text"
                value={debtorCountry}
                onChange={(e) => setDebtorCountry(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Debtor Agent BIC</label>
              <input
                type="text"
                value={debtorBic}
                onChange={(e) => setDebtorBic(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono uppercase"
                required
              />
            </div>
          </div>
        </div>

        {/* Creditor Details */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            3. Creditor (Beneficiary) & Intermediary Agent
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Creditor Entity Name</label>
              <input
                type="text"
                value={creditorName}
                onChange={(e) => setCreditorName(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Creditor Account Number</label>
              <input
                type="text"
                value={creditorAccount}
                onChange={(e) => setCreditorAccount(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Creditor Country</label>
              <input
                type="text"
                value={creditorCountry}
                onChange={(e) => setCreditorCountry(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Creditor Agent BIC / Routing</label>
              <input
                type="text"
                value={creditorBic}
                onChange={(e) => setCreditorBic(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono uppercase"
                required
              />
            </div>
          </div>
        </div>

        {/* Remittance & Maker Comments */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            4. Remittance & Operations Maker Notes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Payment Purpose / Description</label>
              <input
                type="text"
                value={paymentPurpose}
                onChange={(e) => setPaymentPurpose(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Remittance Information</label>
              <input
                type="text"
                value={remittanceInfo}
                onChange={(e) => setRemittanceInfo(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Maker Submission Comments</label>
            <input
              type="text"
              value={makerComments}
              onChange={(e) => setMakerComments(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Submit Payment Instruction</span>
          </button>
        </div>
      </form>
    </div>
  );
};
