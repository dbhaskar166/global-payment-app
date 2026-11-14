import React from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { GatewayAdapterConfig } from '../../types/payment';
import { 
  Server, 
  Activity, 
  AlertOctagon, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  SlidersHorizontal 
} from 'lucide-react';

export const GatewayManagementView: React.FC = () => {
  const { gateways, updateGateway, showToast } = usePaymentHub();

  const handleToggleStatus = (gw: GatewayAdapterConfig) => {
    const nextStatus = gw.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    const nextCb = nextStatus === 'OFFLINE' ? 'OPEN' : 'CLOSED';
    updateGateway(gw.id, { status: nextStatus, circuitBreakerState: nextCb });
  };

  const handleTripCircuitBreaker = (gw: GatewayAdapterConfig) => {
    const nextCb = gw.circuitBreakerState === 'CLOSED' ? 'OPEN' : 'CLOSED';
    updateGateway(gw.id, { circuitBreakerState: nextCb });
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Payment Gateway Connectivity & Adapters
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Pluggable gateway integration framework for SWIFT (BOX, CitiSwitch) and Domestic Networks (ISSAC, RTGS, ACH).
        </p>
      </div>

      {/* Gateway Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gateways.map(gw => {
          const isOnline = gw.status === 'ONLINE';
          const isCbOpen = gw.circuitBreakerState === 'OPEN';

          return (
            <div
              key={gw.id}
              className={`p-6 bg-white dark:bg-slate-900 rounded-lg border transition-all space-y-4 shadow-sm ${
                !isOnline || isCbOpen
                  ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-base">
                    {gw.name}
                  </div>
                  <div className="font-mono text-xs text-slate-400 mt-0.5">{gw.id}</div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isOnline ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {gw.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    isCbOpen ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    CB: {gw.circuitBreakerState}
                  </span>
                </div>
              </div>

              {/* Endpoint & Protocol */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px] font-sans text-slate-500">
                  <span>Protocol: {gw.protocol}</span>
                  <span>Timeout: {gw.timeoutMs}ms</span>
                </div>
                <div className="truncate text-slate-700 dark:text-slate-300 text-[11px]">
                  Endpoint: {gw.endpoint}
                </div>
                <div className="text-[10px] text-slate-400">
                  Secrets Ref: vault://secret/gateway/{gw.id.toLowerCase()}/credentials
                </div>
              </div>

              {/* Operational Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500">Cut-off Time (UTC)</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono mt-0.5">{gw.cutOffTimeUtc}</div>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500">Active Queue Depth</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono mt-0.5 tabular-nums">{gw.activeQueueDepth} msgs</div>
                </div>
              </div>

              {/* Supported Currencies & Types */}
              <div className="space-y-1 text-xs">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Supported Currencies</div>
                <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                  {gw.supportedCurrencies.map(c => (
                    <span key={c} className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Interactive Simulation Controls */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(gw)}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold transition-colors ${
                    isOnline
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isOnline ? 'Set Offline (Test Failover)' : 'Restore Online'}
                </button>

                <button
                  type="button"
                  onClick={() => handleTripCircuitBreaker(gw)}
                  className="px-3 py-1.5 rounded text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {isCbOpen ? 'Reset CB' : 'Trip CB'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
