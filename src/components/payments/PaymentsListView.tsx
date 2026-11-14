import React, { useState, useMemo } from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { StatusBadge, HoldBadge } from '../common/StatusBadge';
import { formatCurrencyAmount } from '../../engine/validation';
import { 
  Search, 
  Filter, 
  Download, 
  PlusCircle, 
  Eye, 
  Wrench, 
  CheckSquare, 
  RotateCcw 
} from 'lucide-react';

export const PaymentsListView: React.FC<{ onOpenDetail: (p: any) => void }> = ({ onOpenDetail }) => {
  const { payments, setActiveNav, setSelectedPayment } = usePaymentHub();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery = !query || 
        payment.paymentId.toLowerCase().includes(query) ||
        payment.uetr.toLowerCase().includes(query) ||
        payment.debtor.entityName.toLowerCase().includes(query) ||
        payment.creditor.entityName.toLowerCase().includes(query) ||
        payment.debtor.accountNumber.toLowerCase().includes(query) ||
        payment.creditor.accountNumber.toLowerCase().includes(query) ||
        payment.sourceTransactionId?.toLowerCase().includes(query);

      const matchesStatus = selectedStatus === 'ALL' || payment.status === selectedStatus;
      const matchesSource = selectedSource === 'ALL' || payment.sourceSystem === selectedSource;
      const matchesCurrency = selectedCurrency === 'ALL' || payment.currency === selectedCurrency;

      return matchesQuery && matchesStatus && matchesSource && matchesCurrency;
    });
  }, [payments, searchQuery, selectedStatus, selectedSource, selectedCurrency]);

  const exportCsv = () => {
    const headers = ['PaymentId', 'UETR', 'SourceSystem', 'Type', 'Currency', 'Amount', 'Status', 'Debtor', 'Creditor', 'ValueDate'];
    const rows = filteredPayments.map(p => [
      p.paymentId,
      p.uetr,
      p.sourceSystem,
      p.paymentType,
      p.currency,
      p.amount,
      p.status,
      `"${p.debtor.entityName}"`,
      `"${p.creditor.entityName}"`,
      p.valueDate,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payments_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payments Ledger & Monitoring
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global payment transactions across all product processors, currencies, and gateways.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setActiveNav('manual-payments')}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Payment</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Payment ID, UETR, Source Tx, Debtor, or Creditor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses ({payments.length})</option>
              <option value="CREDIT_CONFIRMED">Credit Confirmed</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="REPAIR_REQUIRED">Repair Required</option>
              <option value="SETTLED">Settled</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Source system filter */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Sources</option>
              <option value="GCMS">GCMS</option>
              <option value="TRADE_PROCESSOR">Trade Processor</option>
              <option value="TREASURY">Treasury</option>
              <option value="CORP_PAY">Corporate Payments</option>
              <option value="MANUAL_UI">Manual Operations</option>
            </select>

            {/* Currency filter */}
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Currencies</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="SGD">SGD</option>
            </select>
          </div>
        </div>

        {/* Filter count & quick clear */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>Showing {filteredPayments.length} of {payments.length} transactions</span>
          {(selectedStatus !== 'ALL' || selectedSource !== 'ALL' || selectedCurrency !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStatus('ALL');
                setSelectedSource('ALL');
                setSelectedCurrency('ALL');
                setSearchQuery('');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="py-2.5 px-4">Payment ID & Ref</th>
                <th className="py-2.5 px-4">Source</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4">Debtor → Creditor</th>
                <th className="py-2.5 px-4">Status & Holds</th>
                <th className="py-2.5 px-4">Gateway Reference</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredPayments.length > 0 ? (
                filteredPayments.map(payment => (
                  <tr
                    key={payment.paymentId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedPayment(payment);
                    }}
                  >
                    <td className="py-3 px-4 font-mono">
                      <div className="font-semibold text-blue-600 dark:text-blue-400">
                        {payment.paymentId}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {payment.sourceTransactionId}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {payment.sourceSystem}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {payment.channel}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {payment.paymentType.replace('SWIFT_', '').replace('DOMESTIC_', '')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrencyAmount(payment.amount, payment.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {payment.debtor.entityName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        → {payment.creditor.entityName}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge status={payment.status} size="sm" />
                        {payment.holds.filter(h => h.active).map(h => (
                          <HoldBadge key={h.reason} reason={h.reason} />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {payment.gatewayRecord?.gatewayReference || (
                        <span className="text-slate-400 font-sans">Pending Routing</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayment(payment);
                        }}
                        className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="View 360 Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {payment.status === 'REPAIR_REQUIRED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPayment(payment);
                            setActiveNav('repair');
                          }}
                          className="p-1 text-orange-600 hover:text-orange-700 rounded hover:bg-orange-50 dark:hover:bg-orange-950"
                          title="Open in Repair Desk"
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                      )}
                      {payment.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPayment(payment);
                            setActiveNav('approval-workbench');
                          }}
                          className="p-1 text-amber-600 hover:text-amber-700 rounded hover:bg-amber-50 dark:hover:bg-amber-950"
                          title="Review Approval"
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No payment instructions match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
