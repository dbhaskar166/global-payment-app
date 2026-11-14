import React from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { StatusBadge } from '../common/StatusBadge';
import { 
  ArrowUpRight, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  Send, 
  RefreshCw,
  ExternalLink,
  PlusCircle,
  FileCheck2
} from 'lucide-react';
import { formatCurrencyAmount } from '../../engine/validation';

export const DashboardView: React.FC<{ onOpenScenarios: () => void }> = ({ onOpenScenarios }) => {
  const { 
    payments, 
    gateways, 
    setActiveNav, 
    setSelectedPayment, 
    ingestPayment,
    currentUser 
  } = usePaymentHub();

  const totalPayments = payments.length;
  const creditConfirmed = payments.filter(p => p.status === 'CREDIT_CONFIRMED' || p.status === 'SETTLED').length;
  const pendingApproval = payments.filter(p => p.status === 'PENDING_APPROVAL').length;
  const onHold = payments.filter(p => p.status === 'ON_HOLD').length;
  const inRepair = payments.filter(p => p.status === 'REPAIR_REQUIRED').length;
  const rejected = payments.filter(p => p.status === 'REJECTED').length;

  const totalVolumeUsd = payments.reduce((acc, p) => acc + (p.currency === 'USD' ? p.amount : p.amount * 1.1), 0);

  const handleQuickIngest = (source: 'GCMS' | 'TRADE_PROCESSOR' | 'TREASURY') => {
    const ts = Date.now().toString().slice(-4);
    if (source === 'GCMS') {
      ingestPayment({
        paymentId: `GPH-GCMS-${ts}`,
        sourceSystem: 'GCMS',
        sourceApplication: 'GlobalCashEngine',
        paymentType: 'SWIFT_PACS_008',
        currency: 'USD',
        amount: 380000,
        debtor: { entityName: 'ACME CORP GLOBAL', accountNumber: 'ACC-US-100234', country: 'US' },
        creditor: { entityName: 'ROTTERDAM PORT LOGISTICS', accountNumber: 'ACC-NL-330198', country: 'NL' },
        paymentPurpose: 'Ocean Freight Clearing INV-2026',
        charges: 'SHA',
      });
    } else if (source === 'TREASURY') {
      ingestPayment({
        paymentId: `GPH-TREAS-${ts}`,
        sourceSystem: 'TREASURY',
        paymentType: 'SWIFT_PACS_009',
        currency: 'EUR',
        amount: 2800000,
        debtor: { entityName: 'GLOBAL BANK TREASURY DESK', accountNumber: 'ACC-EU-330198', country: 'DE' },
        creditor: { entityName: 'BANQUE NATIONALE DE PARIS', accountNumber: 'ACC-FR-998811', country: 'FR' },
        paymentPurpose: 'Institutional Overnight Liquidity Sweep',
        charges: 'OUR',
      });
    } else {
      ingestPayment({
        paymentId: `GPH-TRADE-${ts}`,
        sourceSystem: 'TRADE_PROCESSOR',
        paymentType: 'SWIFT_PACS_008',
        currency: 'USD',
        amount: 520000,
        debtor: { entityName: 'VERTEX TRADING PTE', accountNumber: 'ACC-SG-500122', country: 'US' },
        creditor: { entityName: 'SHANGHAI MARITIME FREIGHT', accountNumber: 'ACC-CN-881122', country: 'CN' },
        paymentPurpose: 'Letter of Credit LC-33990',
        charges: 'SHA',
      });
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payment Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Centralized orchestration, control evaluation, ISO 20022 messaging, and real-time settlement telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveNav('manual-payments')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Manual Payment</span>
          </button>
          <button
            onClick={onOpenScenarios}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Acceptance Scenarios</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Ingested</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {totalPayments}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono tabular-nums truncate">
            ~${(totalVolumeUsd / 1_000_000).toFixed(2)}M Volume
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>Settled / Credit Confirmed</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {creditConfirmed}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Beneficiary credited
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <span>Pending Approval</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {pendingApproval}
          </div>
          <button 
            onClick={() => setActiveNav('approval-workbench')}
            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-flex items-center gap-1"
          >
            Review workbench <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center justify-between">
            <span>On Hold</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
            {onHold}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Sanctions / Duplicates
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center justify-between">
            <span>Repair Required</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-orange-600 dark:text-orange-400 mt-1">
            {inRepair}
          </div>
          <button 
            onClick={() => setActiveNav('repair')}
            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-flex items-center gap-1"
          >
            Open repair desk <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Rejected</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-600 dark:text-slate-400 mt-1">
            {rejected}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Terminal state
          </div>
        </div>
      </div>

      {/* Gateway Availability & Connectivity Strip */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Gateway Availability & Connectivity Health
            </h2>
          </div>
          <button
            onClick={() => setActiveNav('gateways')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Manage Connectivity Rules →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {gateways.map(gw => (
            <div 
              key={gw.id} 
              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700/60 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{gw.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                  gw.status === 'ONLINE' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' :
                  gw.status === 'DEGRADED' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' :
                  'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                }`}>
                  {gw.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Protocol: {gw.protocol}</span>
                <span className="font-mono text-[10px]">Cut-off: {gw.cutOffTimeUtc}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>CB: {gw.circuitBreakerState}</span>
                <span className="font-mono tabular-nums">Queue: {gw.activeQueueDepth}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upstream Simulation Ingestion Panel */}
      <div className="p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">
              Live Ingestion Engine (REST / Kafka / MQ)
            </div>
            <h3 className="text-base font-bold">
              Simulate Inbound Payment Instructions
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Inject real-time instructions from connected Product Processors. Ingestion assigns a unique Payment ID, validates schema, enriches SSI from AMC, executes controls, transforms to ISO 20022 / ISSAC, and submits to gateway.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleQuickIngest('GCMS')}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              + GCMS pacs.008 ($380k)
            </button>
            <button
              onClick={() => handleQuickIngest('TREASURY')}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              + Treasury pacs.009 (€2.8M)
            </button>
            <button
              onClick={() => handleQuickIngest('TRADE_PROCESSOR')}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-sky-600 hover:bg-sky-500 text-white transition-colors"
            >
              + Trade Finance ($520k)
            </button>
          </div>
        </div>
      </div>

      {/* Recent Payments Data Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Recent Payment Processing Activity
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live updates across ingestion, controls evaluation, and gateway confirmation
            </div>
          </div>
          <button
            onClick={() => setActiveNav('payments')}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            View All Payments ({payments.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="py-2.5 px-4">Payment ID & UETR</th>
                <th className="py-2.5 px-4">Source System</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4">Debtor → Creditor</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Gateway</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {payments.slice(0, 8).map(payment => (
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
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                      {payment.uetr}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {payment.sourceSystem}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {payment.channel}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    {payment.paymentType.replace('SWIFT_', '').replace('DOMESTIC_', '')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrencyAmount(payment.amount, payment.currency)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                      {payment.debtor.entityName}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                      → {payment.creditor.entityName}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={payment.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[11px]">
                    {payment.gatewayRecord?.gatewayName ? (
                      <span className="truncate max-w-[120px] block">
                        {payment.gatewayRecord.gatewayName.replace(' Gateway', '')}
                      </span>
                    ) : (
                      <span className="text-slate-400">Pending</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPayment(payment);
                      }}
                      className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
