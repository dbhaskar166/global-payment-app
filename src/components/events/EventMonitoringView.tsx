import React, { useState } from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { PaymentEvent } from '../../types/payment';
import { 
  Activity, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Share2, 
  Database, 
  FileText 
} from 'lucide-react';

export const EventMonitoringView: React.FC = () => {
  const { events, replayEvent, payments, setSelectedPayment, showToast } = usePaymentHub();
  const [filterType, setFilterType] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<PaymentEvent | null>(events[0] || null);

  const filteredEvents = events.filter(e => filterType === 'ALL' || e.eventType === filterType);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Downstream Payment Event Outbox
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time transactional event streaming to Audit, Accounting/GL, Reconciliation, and Regulatory systems.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Event Types ({events.length})</option>
            <option value="PaymentInstructionReceived">PaymentInstructionReceived</option>
            <option value="PaymentValidated">PaymentValidated</option>
            <option value="PaymentEnriched">PaymentEnriched</option>
            <option value="PaymentControlPassed">PaymentControlPassed</option>
            <option value="PaymentHeld">PaymentHeld</option>
            <option value="PaymentApproved">PaymentApproved</option>
            <option value="PaymentTransformed">PaymentTransformed</option>
            <option value="PaymentSubmitted">PaymentSubmitted</option>
            <option value="PaymentCreditConfirmed">PaymentCreditConfirmed</option>
            <option value="PaymentRepaired">PaymentRepaired</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Stream Column */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
            <span>Published Events Stream</span>
            <span className="text-slate-500 font-mono">Count: {filteredEvents.length}</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(evt => {
                const isSelected = selectedEvent?.eventId === evt.eventId;
                return (
                  <div
                    key={evt.eventId}
                    onClick={() => setSelectedEvent(evt)}
                    className={`p-4 cursor-pointer transition-colors text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{evt.eventType}</span>
                      <span className="text-[11px] text-slate-400">{evt.eventTimestamp.slice(11, 23)}Z</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        Payment: <strong>{evt.paymentId}</strong>
                      </span>
                      <span className="text-slate-500">{evt.sourceSystem}</span>
                    </div>

                    <div className="flex items-center gap-1 pt-1">
                      {evt.deliveryStatus.map(d => (
                        <span key={d.target} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                          {d.target.slice(0, 4)}: {d.status}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No events match this filter. Ingest or process a payment to trigger lifecycle events.
              </div>
            )}
          </div>
        </div>

        {/* Selected Event Payload & Outbox Details */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="font-semibold text-slate-900 dark:text-white">Event Delivery Inspector</span>
            {selectedEvent && (
              <button
                onClick={() => replayEvent(selectedEvent.eventId)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs transition-colors"
                title="Replay event to downstream consumers"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Replay Event</span>
              </button>
            )}
          </div>

          {selectedEvent ? (
            <div className="space-y-4">
              <div className="space-y-1 font-mono text-xs">
                <div className="text-slate-500 font-sans text-[11px]">Event Identifier</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedEvent.eventId}</div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  Consumer Delivery Status (Guaranteed Exactly-Once)
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  {selectedEvent.deliveryStatus.map(d => (
                    <div key={d.target} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span>{d.target}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{d.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Audit Metadata</div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                  <div>Node: {selectedEvent.auditMetadata.nodeId}</div>
                  <div>Trace ID: {selectedEvent.auditMetadata.traceId}</div>
                  <div>Actor: {selectedEvent.auditMetadata.actor}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Event Payload</div>
                <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded border border-slate-800 max-h-60 overflow-x-auto">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-center py-12">
              Select an event to inspect downstream delivery guarantees.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
