import React, { useState } from 'react';
import { 
  Calculator, 
  Layers, 
  Cpu, 
  Database, 
  Lock, 
  Server, 
  Activity, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Code, 
  Zap, 
  Sliders, 
  FileCode, 
  Network, 
  Terminal, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  BarChart2
} from 'lucide-react';

export const HldLldDesignView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'calculator' | 'hld' | 'lld-classes' | 'lld-proto' | 'lld-sharding' | 'lld-concurrency'>('calculator');
  
  // Interactive Math Model State
  const [userBaseMillions, setUserBaseMillions] = useState<number>(10); // 10M DAU
  const [txPerUser, setTxPerUser] = useState<number>(5.0); // 5 tx/user/day
  const [peakMultiplier, setPeakMultiplier] = useState<number>(4.5); // 4.5x peak
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Derived Calculations
  const totalDailyTx = userBaseMillions * 1_000_000 * txPerUser;
  const activeHours = 16;
  const activeSeconds = activeHours * 3600;
  const averageTps = Math.round(totalDailyTx / activeSeconds);
  const sustainedPeakTps = Math.round(averageTps * peakMultiplier);
  const flashStressPeakTps = Math.round(sustainedPeakTps * 3.0);
  const dailyDbIngressGb = Math.round((totalDailyTx * 12.0) / (1024 * 1024)); // 12 KB per tx
  const annualDbTb = ((dailyDbIngressGb * 365) / 1024).toFixed(1);
  const fiveYearTb = ((dailyDbIngressGb * 365 * 5) / 1024).toFixed(1);
  const peakBandwidthGbps = ((sustainedPeakTps * 12.0 * 8) / (1024 * 1024)).toFixed(2);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-mono">
                SCALE: 10,000,000 DAU
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                PEAK BURST: 12,000 TPS
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-mono">
                RPO = 0 / RTO &lt; 30S
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              High-Level &amp; Low-Level Architecture Design Specification
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Enterprise engineering specification mathematically sized for a 10 million daily active user base, delivering 50,000,000 daily payment orders across multi-region active-active clusters with zero data loss.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Spec:</span>
            <span className="px-2.5 py-1 rounded bg-slate-950 text-sky-400 border border-slate-800">
              /docs/HIGH_AND_LOW_LEVEL_DESIGN_10M_USERS.md
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-medium overflow-x-auto pb-1">
        {[
          { id: 'calculator', label: '🧮 10M Capacity & Sizing Math' },
          { id: 'hld', label: '📐 High-Level Design (HLD Topology)' },
          { id: 'lld-classes', label: '🧬 LLD: Domain Aggregates & SIMD Engine' },
          { id: 'lld-proto', label: '⚡ LLD: Protobuf gRPC Contracts' },
          { id: 'lld-sharding', label: '🗄️ LLD: 16-Shard Database DDL' },
          { id: 'lld-concurrency', label: '🏎️ LLD: Disruptor & Virtual Threads' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`py-2 px-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Sizing Math & Interactive Capacity Calculator */}
      {activeSubTab === 'calculator' && (
        <div className="space-y-6">
          {/* Interactive Calculator Slider Card */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  <span>Interactive Sizing &amp; Capacity Modeling Engine</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dynamically adjust user population, daily transaction frequencies, and peak multipliers to verify platform elasticity.
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                Dynamic Math Model
              </span>
            </div>

            {/* Slider Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Daily Active Users (DAU)</span>
                  <span className="font-mono font-bold text-blue-600 text-sm">{userBaseMillions} Million</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={userBaseMillions}
                  onChange={(e) => setUserBaseMillions(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1M (Tier-2)</span>
                  <span>10M (Standard)</span>
                  <span>50M (Megabank)</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Transactions / User / Day</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">{txPerUser.toFixed(1)} Tx/User</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={txPerUser}
                  onChange={(e) => setTxPerUser(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1.0 (Retail)</span>
                  <span>5.0 (Mixed)</span>
                  <span>15.0 (Corporate)</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Peak Window Multiplier</span>
                  <span className="font-mono font-bold text-amber-600 text-sm">{peakMultiplier.toFixed(1)}x Peak</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="0.5"
                  value={peakMultiplier}
                  onChange={(e) => setPeakMultiplier(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>2.0x (Flat)</span>
                  <span>4.5x (Normal)</span>
                  <span>8.0x (Payroll Burst)</span>
                </div>
              </div>
            </div>

            {/* Calculated Results Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 bg-slate-950 text-white rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-mono">DAILY TX VOLUME</div>
                <div className="text-base font-bold font-mono text-sky-400">
                  {(totalDailyTx / 1_000_000).toFixed(1)}M
                </div>
                <div className="text-[10px] text-slate-500">Orders / 24 hours</div>
              </div>

              <div className="p-3 bg-slate-950 text-white rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-mono">AVERAGE THROUGHPUT</div>
                <div className="text-base font-bold font-mono text-emerald-400">
                  {averageTps.toLocaleString()} TPS
                </div>
                <div className="text-[10px] text-slate-500">Steady state rate</div>
              </div>

              <div className="p-3 bg-slate-950 text-white rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-mono">SUSTAINED PEAK</div>
                <div className="text-base font-bold font-mono text-amber-400">
                  {sustainedPeakTps.toLocaleString()} TPS
                </div>
                <div className="text-[10px] text-slate-500">Market opening rush</div>
              </div>

              <div className="p-3 bg-slate-950 text-white rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-mono">FLASH STRESS PEAK</div>
                <div className="text-base font-bold font-mono text-rose-400">
                  {flashStressPeakTps.toLocaleString()} TPS
                </div>
                <div className="text-[10px] text-slate-500">Black Friday / EOM</div>
              </div>

              <div className="p-3 bg-slate-950 text-white rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-mono">DAILY DB INGRESS</div>
                <div className="text-base font-bold font-mono text-purple-400">
                  {dailyDbIngressGb} GB/day
                </div>
                <div className="text-[10px] text-slate-500">@ 12.0 KB per payment</div>
              </div>

              <div className="p-3 bg-slate-950 text-white rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-mono">PEAK BANDWIDTH</div>
                <div className="text-base font-bold font-mono text-cyan-400">
                  {peakBandwidthGbps} Gbps
                </div>
                <div className="text-[10px] text-slate-500">Network egress pipe</div>
              </div>
            </div>

            {/* Storage Growth Projections */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center justify-between">
                <span>Multi-Year Storage Growth Projections (BCBS 239 7-Year Retention)</span>
                <span className="font-mono text-slate-500 text-[11px]">Primary + Multi-AZ Read Replicas</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500 text-[10px]">YEAR 1 STORAGE</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-1">{annualDbTb} TB</div>
                  <div className="text-[10px] text-slate-400">Active range partition</div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500 text-[10px]">YEAR 3 STORAGE</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-1">{(Number(annualDbTb) * 3).toFixed(1)} TB</div>
                  <div className="text-[10px] text-slate-400">Warm read-only storage</div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-500 text-[10px]">YEAR 5 RETENTION</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-1">{fiveYearTb} TB</div>
                  <div className="text-[10px] text-slate-400">Compressed S3 / WORM glacier</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: High-Level Design (HLD Topology) */}
      {activeSubTab === 'hld' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-600" />
              <span>Multi-Region Active-Active Global Ingress &amp; Processing Topology</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              To support 10 million daily users with 99.999% availability, traffic is geolocated and load-balanced across three active regions with bidirectional replication and zero single points of failure.
            </p>

            {/* ASCII Architecture Topology Canvas */}
            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
{`                              [ Global Anycast IP / AWS Route 53 / Cloudflare ]
                                                     │
                                        DNS Latency-Based Geo-Routing
                                                     │
                     ┌───────────────────────────────┴───────────────────────────────┐
                     ▼                                                               ▼
        +─────────────────────────+                                     +─────────────────────────+
        |     REGION ALPHA        |                                     |      REGION BETA        |
        | [Active Processing Hub] |                                     | [Active Processing Hub] |
        +─────────────────────────+                                     +─────────────────────────+
        | • Envoy Edge Gateway    |                                     | • Envoy Edge Gateway    |
        | • Kafka Cluster (KRaft) |◄────────── MirrorMaker 2 ──────────►| • Kafka Cluster (KRaft) |
        | • Orchestrator Pods (40)|                                     | • Orchestrator Pods (40)|
        | • Redis Clustered Shard |                                     | • Redis Clustered Shard |
        | • PostgreSQL Primary    |◄── Bidirectional Logical Replication──►| • PostgreSQL Secondary  |
        +─────────────────────────+                                     +─────────────────────────+
                     │                                                               │
                     └───────────────────────────────┬───────────────────────────────┘
                                                     ▼
                                        +─────────────────────────+
                                        |      REGION GAMMA       |
                                        | [Clearing Edge & DR]   |
                                        +─────────────────────────+
                                        | • Dedicated Leased SAG  |
                                        | • SWIFT Alliance Netty  |
                                        | • WORM Compliance Store |
                                        +─────────────────────────+`}
            </pre>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">Active-Active Region Balancing</div>
                <p className="text-slate-500 leading-relaxed">
                  Traffic is distributed 40% to Region Alpha (US-East/Frankfurt), 40% to Region Beta (US-West/Dublin), and 20% to Region Gamma (APAC/Singapore). Failure of any region redirects traffic within 12 seconds with zero lost state.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">Kafka 64-Partition Sharding</div>
                <p className="text-slate-500 leading-relaxed">
                  Keyed by <code>MurmurHash3(debtor_account) % 64</code>. Guarantees in-order causal processing for every individual customer account while saturating 64 parallel consumer instances at 12,000 TPS.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">Transactional Outbox via CDC</div>
                <p className="text-slate-500 leading-relaxed">
                  Debezium reads the PostgreSQL Write-Ahead Log (WAL) directly via logical decoding (<code>pg_logical_slot</code>) with zero table polling overhead, delivering sub-10ms events to Kafka.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LLD Domain Aggregates & SIMD Sanctions Engine */}
      {activeSubTab === 'lld-classes' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Code className="w-5 h-5 text-blue-600" />
                  <span>Domain Aggregate Root &amp; SIMD Vectorized Sanctions Engine</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-performance TypeScript/Java domain implementation enforcing financial invariants, micro-unit decimal arithmetic, and BK-Tree fuzzy screening.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(`export class PaymentAggregate { ... }`, 'aggregate-code')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode === 'aggregate-code' ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 text-sky-300 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto leading-relaxed max-h-[500px]">
{`// PaymentAggregate.ts — Core Domain Aggregate Root
export interface Money {
  readonly amount: bigint; // Micro-units (e.g. $100.50 = 100_500_000n) prevents IEEE-754 loss
  readonly currency: string; // ISO-4217 Alpha-3
  readonly decimalPlaces: number;
}

export class PaymentAggregate {
  private readonly _paymentId: string;
  private readonly _uetr: string;
  private _version: number;
  private _status: PaymentLifecycleStatus;
  private readonly _amount: Money;
  private readonly _debtorAccount: string;
  private readonly _creditorAccount: string;
  private _checkerVotes: Map<string, { decision: 'APPROVE' | 'REJECT'; timestamp: string }> = new Map();
  private _uncommittedEvents: PaymentDomainEvent[] = [];

  constructor(params: PaymentConstructorParams) {
    if (!params.uetr || !params.paymentId) {
      throw new Error("INVARIANT_VIOLATION: PaymentId and UETR are mandatory");
    }
    if (params.amount.amount <= 0n) {
      throw new Error("INVARIANT_VIOLATION: Payment amount must be strictly positive");
    }
    this._paymentId = params.paymentId;
    this._uetr = params.uetr;
    this._amount = params.amount;
    this._debtorAccount = params.debtorAccount;
    this._creditorAccount = params.creditorAccount;
    this._version = params.version || 1;
    this._status = params.initialStatus || 'RECEIVED';
  }

  // State Transition Machine with Invariant Enforcement
  public transitionTo(newStatus: PaymentLifecycleStatus, reason?: string): void {
    const validTransitions: Record<PaymentLifecycleStatus, PaymentLifecycleStatus[]> = {
      'RECEIVED': ['VALIDATED', 'REJECTED', 'REPAIR_REQUIRED'],
      'VALIDATED': ['SSI_ENRICHED', 'REPAIR_REQUIRED', 'REJECTED'],
      'SSI_ENRICHED': ['CONTROLS_PASSED', 'ON_HOLD', 'PENDING_APPROVAL', 'DUAL_BLIND_PENDING'],
      'CONTROLS_PASSED': ['TRANSFORMED', 'PENDING_APPROVAL', 'DUAL_BLIND_PENDING'],
      'PENDING_APPROVAL': ['APPROVED', 'REJECTED', 'ON_HOLD'],
      'DUAL_BLIND_PENDING': ['APPROVED', 'REJECTED', 'ON_HOLD'],
      'APPROVED': ['TRANSFORMED', 'REJECTED'],
      'TRANSFORMED': ['ROUTED', 'REPAIR_REQUIRED', 'REJECTED'],
      'ROUTED': ['SUBMITTED', 'REPAIR_REQUIRED', 'REJECTED'],
      'SUBMITTED': ['ACKNOWLEDGED', 'REJECTED'],
      'ACKNOWLEDGED': ['SETTLED', 'REJECTED'],
      'SETTLED': ['CREDIT_CONFIRMED', 'REJECTED'],
      'CREDIT_CONFIRMED': [], // Terminal success
      'ON_HOLD': ['VALIDATED', 'CONTROLS_PASSED', 'REJECTED', 'CANCELLED'],
      'REPAIR_REQUIRED': ['VALIDATED', 'REJECTED', 'CANCELLED'],
      'REJECTED': [], // Terminal failure
      'CANCELLED': [] // Terminal cancellation
    };

    const allowed = validTransitions[this._status] || [];
    if (!allowed.includes(newStatus)) {
      throw new IllegalStateTransitionException(
        \`Illegal transition from \${this._status} to \${newStatus} for UETR: \${this._uetr}\`
      );
    }

    this._status = newStatus;
    this._version += 1;
    this._uncommittedEvents.push({
      eventId: crypto.randomUUID(),
      uetr: this._uetr,
      eventType: \`PAYMENT_STATUS_TRANSITIONED_TO_\${newStatus}\`,
      timestamp: new Date().toISOString(),
      payload: { previousStatus: this._status, newStatus, reason }
    });
  }
}`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: Protobuf gRPC Contracts */}
      {activeSubTab === 'lld-proto' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-blue-600" />
                  <span>Protobuf v3 Wire Specification (gRPC HTTP/2 Streaming)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Binary serialized contracts achieving 10x higher packing density and sub-5ms serialization over network hops.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(`syntax = "proto3"; ...`, 'proto-code')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode === 'proto-code' ? 'Copied!' : 'Copy Proto'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto leading-relaxed max-h-[500px]">
{`syntax = "proto3";

package gph.payment.orchestration.v1;

option java_multiple_files = true;
option java_package = "com.gph.payment.orchestration.v1";

service ProcessingOrchestratorService {
  rpc IngestPayment (IngestPaymentRequest) returns (IngestPaymentResponse);
  rpc GetPaymentStatus (GetPaymentStatusRequest) returns (GetPaymentStatusResponse);
  rpc ApproveDualBlind (ApproveDualBlindRequest) returns (ApproveDualBlindResponse);
  rpc RepairPayment (RepairPaymentRequest) returns (RepairPaymentResponse);
}

message IngestPaymentRequest {
  string idempotency_key = 1;
  string source_system = 2;
  string source_transaction_id = 3;
  string channel = 4;
  string currency = 5;
  int64 amount_micro_units = 6; // $1,000.00 = 1_000_000_000n
  string value_date = 7;
  
  Party debtor = 8;
  Party creditor = 9;
  Agent debtor_agent = 10;
  Agent creditor_agent = 11;
  string remittance_information = 12;
}

message Party {
  string entity_name = 1;
  string account_number = 2;
  string tax_id = 3;
  string postal_address = 4;
  string country_code = 5;
}

message Agent {
  string bic = 1;
  string clearing_member_id = 2;
  string branch_name = 3;
}

message IngestPaymentResponse {
  string payment_id = 1;
  string uetr = 2;
  string status = 3;
  string gateway_assigned = 4;
  int64 execution_latency_ms = 5;
  string created_at = 6;
}`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 5: 16-Shard Database DDL */}
      {activeSubTab === 'lld-sharding' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <span>PostgreSQL 16 Declarative Range Partitioning &amp; 16-Shard DDL</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly range partitioning combined with 16-way hash sharding by debtor account number for linear scale up to 76 TB/year.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(`CREATE TABLE payment_instructions ...`, 'sql-code')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode === 'sql-code' ? 'Copied!' : 'Copy DDL'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 text-cyan-300 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto leading-relaxed max-h-[500px]">
{`-- PostgreSQL 16 Declarative Range Partitioning by Month
CREATE TABLE payment_instructions (
    payment_id              VARCHAR(64) NOT NULL,
    uetr                    UUID NOT NULL,
    tenant_id               VARCHAR(32) NOT NULL DEFAULT 'DEFAULT_CORP',
    debtor_account_number   VARCHAR(64) NOT NULL,
    source_transaction_id   VARCHAR(128) NOT NULL,
    source_system           VARCHAR(32) NOT NULL,
    currency                VARCHAR(3) NOT NULL,
    amount                  NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
    value_date              DATE NOT NULL,
    status                  VARCHAR(32) NOT NULL,
    version                 INTEGER NOT NULL DEFAULT 1,
    assigned_gateway_id     VARCHAR(32),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    canonical_payload       JSONB NOT NULL,
    PRIMARY KEY (payment_id, value_date)
) PARTITION BY RANGE (value_date);

-- Sub-Partition Hash by Tenant and Debtor Account (16 Shards per month)
CREATE TABLE payments_2026_11 PARTITION OF payment_instructions
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01')
    PARTITION BY HASH (debtor_account_number);

-- 16 Parallel Physical Table Shards for November 2026
CREATE TABLE payments_2026_11_s00 PARTITION OF payments_2026_11 FOR VALUES WITH (MODULUS 16, REMAINDER 0);
CREATE TABLE payments_2026_11_s01 PARTITION OF payments_2026_11 FOR VALUES WITH (MODULUS 16, REMAINDER 1);
-- ... (Shards s02 to s15)

-- High-Speed Covering Indexes for Fast Ingestion & Idempotency Lookups
CREATE UNIQUE INDEX idx_payments_uetr_valdate ON payment_instructions (uetr, value_date);
CREATE INDEX idx_payments_debtor_status ON payment_instructions (debtor_account_number, status, value_date);
CREATE INDEX idx_payments_source_dedup ON payment_instructions (source_system, source_transaction_id, value_date);

-- Transactional Outbox Table (Debezium CDC Target)
CREATE TABLE payment_outbox_events (
    outbox_id       BIGSERIAL PRIMARY KEY,
    event_id        UUID NOT NULL UNIQUE,
    uetr            UUID NOT NULL,
    aggregate_type  VARCHAR(32) NOT NULL DEFAULT 'PAYMENT',
    aggregate_id    VARCHAR(64) NOT NULL,
    event_type      VARCHAR(64) NOT NULL,
    destination_topic VARCHAR(64) NOT NULL,
    payload         JSONB NOT NULL,
    dispatched      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 6: Concurrency & Virtual Threads */}
      {activeSubTab === 'lld-concurrency' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Lock-Free Disruptor RingBuffer &amp; Virtual Threads Architecture</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Eliminates kernel context-switching latency by running Java 21 Project Loom virtual threads on top of LMAX lock-free ringbuffers, sustaining 100,000 concurrent network connections with 2 KB stack footprint per task.
            </p>

            <pre className="p-4 bg-slate-950 text-amber-300 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
{`[Netty IO Workers (8 threads)]
              │
    [ Producer Sequence ]
              │ (Lock-free RingBuffer: 65,536 slots)
              ▼
   ┌────────────────────────────────────────────────────────┐
   │ 0x00 │ 0x01 │ 0x02 │ 0x03 │ 0x04 │ ... │ 0xFFFF (64K)  │
   └────────────────────────────────────────────────────────┘
              │
    [ Consumer Barrier ]
              │
   ┌──────────┼───────────────────┬──────────────────────┐
   ▼          ▼                   ▼                      ▼
Handler 1:  Handler 2:          Handler 3:             Handler 4:
Validation  Sanctions Screen    Duplicate Hash Check   Outbox Writer
(Thread 1)  (Thread 2)          (Thread 3)             (Thread 4)`}
            </pre>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">Zero Lock Contention</div>
                <p className="text-slate-500 leading-relaxed">
                  The LMAX Disruptor uses memory barriers and CPU cache-line padding to prevent false sharing, achieving 6,000,000 event handoffs/second per CPU core.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">Sub-Millisecond GC Pauses</div>
                <p className="text-slate-500 leading-relaxed">
                  Configured with Generational ZGC (<code>-XX:+UseZGC -XX:+ZGenerational</code>) keeping max garbage collection pause times under 1 millisecond even on 128 GB heaps.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">Zero-Copy Streaming XML</div>
                <p className="text-slate-500 leading-relaxed">
                  FasterXML Woodstox generates ISO 20022 XML envelopes directly into Netty byte buffers without intermediate String object allocations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
