import React from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { History, ShieldCheck, Download, Search } from 'lucide-react';

export const AuditLedgerView: React.FC = () => {
  const { events, payments } = usePaymentHub();

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Immutable Audit Trail & Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tamper-evident operational audit trail capturing all state mutations, maker-checker signoffs, and gateway events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographic Log Sealed</span>
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Displaying latest {events.length} immutable ledger records</span>
          <span className="font-mono">Storage: Append-Only Immutable Store</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="py-2.5 px-4">Event ID & Timestamp</th>
                <th className="py-2.5 px-4">Action / Event Type</th>
                <th className="py-2.5 px-4">Payment ID</th>
                <th className="py-2.5 px-4">Actor & Service</th>
                <th className="py-2.5 px-4">Trace ID</th>
                <th className="py-2.5 px-4">State Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {events.slice(0, 20).map(evt => (
                <tr key={evt.eventId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{evt.eventId}</div>
                    <div className="text-[10px] text-slate-400">{evt.eventTimestamp}</div>
                  </td>
                  <td className="py-3 px-4 font-sans font-semibold text-blue-600 dark:text-blue-400">
                    {evt.eventType}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {evt.paymentId}
                  </td>
                  <td className="py-3 px-4 font-sans text-[11px]">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{evt.auditMetadata.actor}</div>
                    <div className="text-slate-400 font-mono text-[10px]">{evt.auditMetadata.serviceName}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {evt.auditMetadata.traceId}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase">
                      {evt.paymentStatus}
                    </span>
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
