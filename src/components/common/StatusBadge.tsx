import React from 'react';
import { PaymentStatus, HoldReason } from '../../types/payment';

interface StatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyle = () => {
    switch (status) {
      case 'CREDIT_CONFIRMED':
      case 'SETTLED':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
      case 'SUBMITTED':
      case 'ACKNOWLEDGED':
      case 'ROUTED':
      case 'TRANSFORMED':
        return 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800';
      case 'VALIDATED':
      case 'ENRICHED':
      case 'CONTROLS_PASSED':
      case 'APPROVED':
        return 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800';
      case 'ON_HOLD':
      case 'PENDING_APPROVAL':
        return 'text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';
      case 'REPAIR_REQUIRED':
        return 'text-orange-800 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800';
      case 'REJECTED':
      case 'RETURNED':
      case 'CANCELLED':
        return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800';
      case 'RECEIVED':
      default:
        return 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  const formatLabel = (s: string) => {
    return s.replace(/_/g, ' ');
  };

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium border rounded-md uppercase tracking-wider ${px} ${getStyle()}`}>
      {formatLabel(status)}
    </span>
  );
};

export const HoldBadge: React.FC<{ reason: HoldReason }> = ({ reason }) => {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
      {reason.replace(/_/g, ' ')}
    </span>
  );
};
