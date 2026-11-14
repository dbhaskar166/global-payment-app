import React, { useState } from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { PaymentControlConfig } from '../../types/payment';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Sliders, 
  Save, 
  AlertTriangle, 
  Lock, 
  CheckCircle2 
} from 'lucide-react';

export const ControlsConfigView: React.FC = () => {
  const { controls, updateControl, showToast, currentUser } = usePaymentHub();
  const [selectedControlId, setSelectedControlId] = useState<string>(controls[0].id);

  const activeControl = controls.find(c => c.id === selectedControlId) || controls[0];

  const handleToggle = (controlId: string) => {
    const ctrl = controls.find(c => c.id === controlId);
    if (!ctrl) return;
    updateControl(controlId, { enabled: !ctrl.enabled });
  };

  const handleUpdateFailureAction = (action: PaymentControlConfig['failureAction']) => {
    updateControl(activeControl.id, { failureAction: action });
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Payment Controls Engine & Rulebook
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configurable pre-execution risk controls: Large Payment limits, Sanctions screening, Duplicate detection, and Dual-Blind validation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Rule List */}
        <div className="lg:col-span-1 space-y-2">
          {controls.map(ctrl => {
            const isSelected = ctrl.id === selectedControlId;
            return (
              <div
                key={ctrl.id}
                onClick={() => setSelectedControlId(ctrl.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all text-xs space-y-2 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-500">{ctrl.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    ctrl.enabled 
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {ctrl.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">
                  {ctrl.name}
                </div>
                <div className="text-slate-500 line-clamp-2">
                  {ctrl.description}
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                  <span>Severity: <strong className="text-rose-600 dark:text-rose-400">{ctrl.severity}</strong></span>
                  <span className="font-mono">v{ctrl.version}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Control Detail & Rules Editor */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{activeControl.id}</span>
                <span className="text-slate-400">·</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{activeControl.name}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">{activeControl.description}</p>
            </div>

            <button
              onClick={() => handleToggle(activeControl.id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                activeControl.enabled
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {activeControl.enabled ? 'Disable Control' : 'Enable Control'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Execution Order</label>
              <input
                type="number"
                disabled
                value={activeControl.executionOrder}
                className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Failure Action</label>
              <select
                value={activeControl.failureAction}
                onChange={(e) => handleUpdateFailureAction(e.target.value as any)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-100"
              >
                <option value="REJECT">Reject Payment</option>
                <option value="HOLD">Hold Payment (Investigation)</option>
                <option value="SEND_TO_REPAIR">Send to Repair Desk</option>
                <option value="REQUIRE_APPROVAL">Require Checker Approval</option>
                <option value="RETRY">Automatic Retry</option>
                <option value="WARNING">Continue with Warning</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Severity</label>
              <input
                type="text"
                disabled
                value={activeControl.severity}
                className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-semibold text-rose-600 dark:text-rose-400"
              />
            </div>
          </div>

          {/* Rule Configuration JSON */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span>Rule Configuration Matrix</span>
              <span className="text-[11px] font-normal text-slate-500">Requires Maker-Checker on activation</span>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto">
              {JSON.stringify(activeControl.rules, null, 2)}
            </pre>
          </div>

          {/* Applicable Scope */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="font-semibold text-slate-800 dark:text-slate-200">Applicable Scope</div>
            <div className="flex flex-wrap gap-1">
              <span className="text-slate-500 mr-2">Currencies:</span>
              {activeControl.applicableCurrencies.map(c => (
                <span key={c} className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px]">
                  {c}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="text-slate-500 mr-2">Payment Types:</span>
              {activeControl.applicablePaymentTypes.map(t => (
                <span key={t} className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px]">
                  {t.replace('SWIFT_', '').replace('DOMESTIC_', '')}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>Maker: {currentUser.name} · Modification will require Checker approval before deployment</span>
            <button
              onClick={() => showToast(`Control ${activeControl.id} saved for Checker approval.`, 'success')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs"
            >
              Save Control Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
