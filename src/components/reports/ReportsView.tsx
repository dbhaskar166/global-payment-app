import React from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { formatCurrencyAmount } from '../../engine/validation';
import { BarChart3, TrendingUp, PieChart, Clock, ShieldCheck } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { payments } = usePaymentHub();

  const currencyBreakdown = payments.reduce((acc, p) => {
    acc[p.currency] = (acc[p.currency] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  const statusBreakdown = payments.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceBreakdown = payments.reduce((acc, p) => {
    acc[p.sourceSystem] = (acc[p.sourceSystem] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Payment Analytics & Operations Reports
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Aggregated throughput, multi-currency volumes, gateway ACK latencies, and controls efficacy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Multi-Currency Volumes */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Multi-Currency Volume
            </h2>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="space-y-3">
            {Object.entries(currencyBreakdown).map(([ccy, total]) => (
              <div key={ccy} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{ccy}</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrencyAmount(total, ccy)}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${Math.min(100, Math.max(15, (total / 5000000) * 100))}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source System Ingestion Ratio */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Source Product Processors
            </h2>
            <PieChart className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-3">
            {Object.entries(sourceBreakdown).map(([src, count]) => (
              <div key={src} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">{src}</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">{count} payments</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lifecycle Status Distribution */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Lifecycle Status Distribution
            </h2>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="space-y-2 text-xs">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">{status}</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
