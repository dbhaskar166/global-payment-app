import React from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { Share2, Server, CheckCircle2, Sliders, Shield } from 'lucide-react';

export const DownstreamConfigView: React.FC = () => {
  const downstreamApps = [
    {
      id: 'APP-AUDIT',
      name: 'Enterprise Audit System',
      endpoint: 'kafka://prod-cluster:9092/audit.events',
      deliveryGuarantee: 'EXACTLY_ONCE',
      activeStatus: 'ACTIVE',
      supportedEvents: ['PaymentInstructionReceived', 'PaymentApproved', 'PaymentRejected', 'PaymentCreditConfirmed', 'PaymentRepaired'],
      retryPolicy: 'Exponential backoff (3 attempts)',
    },
    {
      id: 'APP-GL',
      name: 'General Ledger & Core Accounting',
      endpoint: 'kafka://prod-cluster:9092/accounting.gl.postings',
      deliveryGuarantee: 'AT_LEAST_ONCE',
      activeStatus: 'ACTIVE',
      supportedEvents: ['PaymentSettled', 'PaymentCreditConfirmed', 'PaymentReturned'],
      retryPolicy: 'Dead-letter queue on 5 retries',
    },
    {
      id: 'APP-RECON',
      name: 'Intraday Nostro Reconciliation Application',
      endpoint: 'mq://recon-server:1414/RECON_IN_QL',
      deliveryGuarantee: 'EXACTLY_ONCE',
      activeStatus: 'ACTIVE',
      supportedEvents: ['PaymentSubmitted', 'PaymentAcknowledged', 'PaymentSettled'],
      retryPolicy: 'Linear retry 2000ms',
    },
    {
      id: 'APP-DATALAKE',
      name: 'Enterprise Analytics Data Lake',
      endpoint: 's3://global-bank-datalake/payments/raw/',
      deliveryGuarantee: 'AT_LEAST_ONCE',
      activeStatus: 'ACTIVE',
      supportedEvents: ['ALL_LIFECYCLE_EVENTS'],
      retryPolicy: 'Batch ingestion queue',
    },
    {
      id: 'APP-REG-REPORTING',
      name: 'Regulatory Reporting Engine (FinCEN / MAS / FCA)',
      endpoint: 'https://regreport.internal.bank.net/api/v1/crossborder',
      deliveryGuarantee: 'EXACTLY_ONCE',
      activeStatus: 'ACTIVE',
      supportedEvents: ['PaymentHeld', 'PaymentCreditConfirmed'],
      retryPolicy: 'Immediate alert on delivery failure',
    },
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Downstream Application Integration Configuration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure external consumers subscribing to payment lifecycle events for audit, accounting, and compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {downstreamApps.map(app => (
          <div
            key={app.id}
            className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-base">{app.name}</div>
                <div className="font-mono text-xs text-slate-400">{app.id}</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {app.activeStatus}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 space-y-1 font-mono text-xs">
              <div className="text-slate-500 text-[11px] font-sans">Egress Transport Endpoint</div>
              <div className="truncate text-slate-800 dark:text-slate-200">{app.endpoint}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500">Delivery Guarantee</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono mt-0.5">{app.deliveryGuarantee}</div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500">Retry Policy</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{app.retryPolicy}</div>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Subscribed Event Types</div>
              <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                {app.supportedEvents.map(e => (
                  <span key={e} className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
