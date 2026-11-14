import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Activity, 
  ShieldCheck, 
  Server, 
  ArrowRight, 
  Layers, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Info,
  ChevronRight,
  RefreshCw,
  Cpu,
  Database,
  Share2
} from 'lucide-react';

export type FlowScenarioId = 'pacs008' | 'pacs009' | 'sanctions' | 'failover' | 'issac';

interface ScenarioConfig {
  id: FlowScenarioId;
  title: string;
  badge: string;
  description: string;
  source: string;
  amount: string;
  targetGateway: string;
  finalState: string;
  steps: {
    nodeId: string;
    label: string;
    detail: string;
    status: 'success' | 'warning' | 'error' | 'info';
  }[];
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'pacs008',
    title: 'Cross-Border Customer Credit (pacs.008)',
    badge: 'STANDARD STP',
    description: 'Straight-Through Processing: GCMS input → SSI Enrichment → Controls passed → pacs.008 XML → SWIFT BOX Gateway → Settled & Credit Confirmed.',
    source: 'GCMS (REST API)',
    amount: '$450,000.00 USD',
    targetGateway: 'SWIFT BOX (MQ)',
    finalState: 'CREDIT_CONFIRMED',
    steps: [
      { nodeId: 'src-gcms', label: '1. Ingestion', detail: 'Received via REST API with idempotency check and raw archive', status: 'success' },
      { nodeId: 'tier-val', label: '2. Validation', detail: 'Mandatory field check passed, ISO-4217 USD valid, IBAN syntax verified', status: 'success' },
      { nodeId: 'tier-cpm', label: '3. Normalization', detail: 'Normalized into Canonical Payment Model (CPM) with UETR assigned', status: 'success' },
      { nodeId: 'tier-ssi', label: '4. SSI Enrichment', detail: 'Account Management Core (AMC) retrieved Nostro/Vostro routing details', status: 'success' },
      { nodeId: 'tier-sanctions', label: '5. Sanctions & Controls', detail: 'OFAC/EU fuzzy screening passed (score 0%), duplicate window checked', status: 'success' },
      { nodeId: 'tier-trans', label: '6. Transformation', detail: 'Generated ISO 20022 pacs.008.001.10 XML with Business App Header', status: 'success' },
      { nodeId: 'tier-route', label: '7. Routing', detail: 'Dynamic clearing matrix selected SWIFT BOX (Queue Depth: 12, Health: ONLINE)', status: 'success' },
      { nodeId: 'gw-box', label: '8. Gateway Dispatch', detail: 'Dispatched to SWIFT network; received pacs.002 ACCP credit confirmation', status: 'success' },
      { nodeId: 'tier-outbox', label: '9. Downstream Events', detail: 'Transactional outbox dispatched Kafka events to GL, Recon & Audit', status: 'success' },
    ]
  },
  {
    id: 'pacs009',
    title: 'Treasury Interbank High-Value Sweep (pacs.009)',
    badge: 'DUAL-BLIND 4-EYES',
    description: 'High-Value Institutional sweep (€3.2M EUR): Exceeds $2M threshold → triggers Dual-Blind Checker governance → CitiSwitch → pacs.009.',
    source: 'Treasury Core (Kafka)',
    amount: '€3,200,000.00 EUR',
    targetGateway: 'CitiSwitch SWIFT (REST)',
    finalState: 'CREDIT_CONFIRMED',
    steps: [
      { nodeId: 'src-treasury', label: '1. Ingestion', detail: 'High-throughput Kafka stream consumer with zero packet loss', status: 'success' },
      { nodeId: 'tier-val', label: '2. Validation', detail: 'Institutional BIC checks passed; value date matches clearing cycle', status: 'success' },
      { nodeId: 'tier-cpm', label: '3. Normalization', detail: 'Populated CPM institutional header and interbank settlement priority', status: 'success' },
      { nodeId: 'tier-controls', label: '4. Large Payment Trigger', detail: 'Amount exceeds $2,000,000 USD equivalent threshold', status: 'warning' },
      { nodeId: 'tier-gov', label: '5. Dual-Blind Review', detail: 'Checker 1 (David Chen) & Checker 2 (Elena Rostova) approve independently', status: 'success' },
      { nodeId: 'tier-trans', label: '6. Transformation', detail: 'Generated pacs.009.001.10 Financial Institution Credit Transfer', status: 'success' },
      { nodeId: 'tier-route', label: '7. Routing', detail: 'Directed to CitiSwitch SWIFT REST gateway with mTLS authentication', status: 'success' },
      { nodeId: 'gw-citi', label: '8. Gateway Settlement', detail: 'Target clearing confirmation received via MT019 / pacs.002 ACCP', status: 'success' },
      { nodeId: 'tier-outbox', label: '9. Downstream Ledger', detail: 'Instant posting to Core GL & Intraday Liquidity Engine', status: 'success' },
    ]
  },
  {
    id: 'sanctions',
    title: 'OFAC Sanctions Hit & Compliance Hold',
    badge: 'RISK CONTROL STOP',
    description: 'Trade Finance transfer contains sanctioned entity name: Fuzzy Levenshtein matcher triggers 98% match → State immediately set to ON_HOLD.',
    source: 'Trade Processor (MQ)',
    amount: '$1,850,000.00 USD',
    targetGateway: 'BLOCKED (None)',
    finalState: 'ON_HOLD (SANCTIONS_HOLD)',
    steps: [
      { nodeId: 'src-trade', label: '1. Ingestion', detail: 'Inbound message received from Trade Finance processing queue', status: 'success' },
      { nodeId: 'tier-val', label: '2. Schema Valid', detail: 'Standard syntax and mandatory fields verified', status: 'success' },
      { nodeId: 'tier-cpm', label: '3. Normalization', detail: 'Created canonical model and extracted all counterparty names', status: 'success' },
      { nodeId: 'tier-sanctions', label: '4. OFAC Match Hit', detail: 'CRITICAL: Creditor matches OFAC SDN list with 98% fuzzy similarity', status: 'error' },
      { nodeId: 'tier-fsm', label: '5. Lifecycle Halt', detail: 'Transitioned to ON_HOLD; gateway dispatch strictly blocked', status: 'error' },
      { nodeId: 'tier-audit', label: '6. Compliance Audit', detail: 'Dispatched alert to Compliance Officer (Marcus Vance) workbench', status: 'warning' },
    ]
  },
  {
    id: 'failover',
    title: 'Gateway Circuit Breaker Automated Failover',
    badge: 'RESILIENCE FAILOVER',
    description: 'SWIFT BOX Gateway queue failure trips Circuit Breaker to OPEN → Router automatically fails over to secondary rail CitiSwitch with zero data loss.',
    source: 'GCMS (REST API)',
    amount: '$920,000.00 USD',
    targetGateway: 'CitiSwitch (Automated Failover)',
    finalState: 'SETTLED',
    steps: [
      { nodeId: 'src-gcms', label: '1. Ingestion', detail: 'Ingested and validated via standard corporate pipeline', status: 'success' },
      { nodeId: 'tier-val', label: '2. Validation & SSI', detail: 'AMC SSI resolved Nostro account without latency', status: 'success' },
      { nodeId: 'tier-sanctions', label: '3. Controls Passed', detail: 'Sanctions, credit line, and duplicate checks clean', status: 'success' },
      { nodeId: 'tier-trans', label: '4. Transformation', detail: 'Compiled pacs.008 XML message envelope', status: 'success' },
      { nodeId: 'gw-box', label: '5. Primary Route Failed', detail: 'SWIFT BOX Gateway circuit breaker OPEN (Consecutive timeouts > 3)', status: 'error' },
      { nodeId: 'tier-route', label: '6. Automated Failover', detail: 'Dynamic router rerouted to secondary gateway CitiSwitch within 120ms', status: 'warning' },
      { nodeId: 'gw-citi', label: '7. Secondary Dispatch', detail: 'CitiSwitch accepted payload and returned technical ACK', status: 'success' },
      { nodeId: 'tier-outbox', label: '8. Downstream Broadcast', detail: 'Dispatched failure telemetry and final settlement event to outbox', status: 'success' },
    ]
  },
  {
    id: 'issac',
    title: 'ISSAC Domestic Instant Clearing (Sub-Second)',
    badge: 'REAL-TIME RAILS',
    description: 'Corporate real-time retail transfer: Processed through 24/7 domestic clearing rail with instant JSON transform and sub-second ACK.',
    source: 'Corporate Pay API',
    amount: '$15,400.00 SGD',
    targetGateway: 'ISSAC Domestic Hub (REST)',
    finalState: 'CREDIT_CONFIRMED',
    steps: [
      { nodeId: 'src-corp', label: '1. Channel Intake', detail: 'REST endpoint with sub-10ms response guarantee', status: 'success' },
      { nodeId: 'tier-val', label: '2. Sort-Code Check', detail: 'Instant bank code and domestic clearing identifier lookup', status: 'success' },
      { nodeId: 'tier-sanctions', label: '3. Real-Time Controls', detail: 'In-memory sanctions and velocity checking in < 15ms', status: 'success' },
      { nodeId: 'tier-trans', label: '4. Domestic JSON', detail: 'Transformed CPM to ISSAC JSON V2.4 ISO-aligned schema', status: 'success' },
      { nodeId: 'gw-issac', label: '5. Instant Clearing', detail: 'Synchronous POST to National Instant Switch; ACK received in 42ms', status: 'success' },
      { nodeId: 'tier-outbox', label: '6. Instant Outbox', detail: 'Dispatched real-time push notification and balance update', status: 'success' },
    ]
  }
];

export const AnimatedArchitectureDiagram: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<FlowScenarioId>('pacs008');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [activeSpeed, setActiveSpeed] = useState<number>(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const scenario = SCENARIOS.find(s => s.id === selectedScenario)!;

  // Animation step progression
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(800 / activeSpeed, 500);
    const timer = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= scenario.steps.length - 1) {
          return 0; // Loop animation
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, activeSpeed, scenario]);

  const activeStep = scenario.steps[currentStepIndex];

  // Node details directory
  const nodeMetadata: Record<string, {
    title: string;
    tier: string;
    protocol: string;
    port?: number;
    latency: string;
    sla: string;
    responsibilities: string[];
  }> = {
    'src-gcms': {
      title: 'Global Cash Management Services (GCMS)',
      tier: 'Upstream Product Processor',
      protocol: 'REST / HTTPS (JSON/XML)',
      latency: '< 150ms',
      sla: '99.99% Availability',
      responsibilities: ['Initiates corporate cross-border payments', 'Carries customer business references', 'Supplies ordering customer accounts']
    },
    'src-treasury': {
      title: 'Treasury Core Engine',
      tier: 'Upstream Product Processor',
      protocol: 'Apache Kafka 3.4',
      latency: '< 20ms',
      sla: 'Zero Data Loss (acks=all)',
      responsibilities: ['Interbank liquidity sweeps', 'Cover payment instructions', 'Central bank reserves balancing']
    },
    'src-trade': {
      title: 'Trade Finance Processor',
      tier: 'Upstream Product Processor',
      protocol: 'IBM MQ v9.3',
      latency: '< 50ms',
      sla: 'Persistent Transactional Queuing',
      responsibilities: ['Letters of Credit disbursements', 'Commodity trade settlements', 'Vessel & cargo financing wires']
    },
    'src-corp': {
      title: 'Corporate Channels & Open Banking',
      tier: 'Upstream Product Processor',
      protocol: 'mTLS REST / ISO 20022 JSON',
      latency: '< 35ms',
      sla: 'Sub-second real-time API',
      responsibilities: ['Direct enterprise ERP integration', 'Payroll and vendor bulk batches', 'Instant retail payments']
    },
    'tier-val': {
      title: 'Payment Validation Service',
      tier: 'Ingestion & Schema Border',
      protocol: 'gRPC / Internal',
      port: 8085,
      latency: '< 8ms',
      sla: 'Strict Schema Compliance',
      responsibilities: ['Mandatory field checks (Debtor, Creditor, Amount)', 'ISO-4217 Currency table validation', 'IBAN and BIC format verification']
    },
    'tier-cpm': {
      title: 'Canonical Data Model Service (CPM)',
      tier: 'Core Orchestration Core',
      protocol: 'Internal Aggregate Root',
      port: 8084,
      latency: '< 5ms',
      sla: 'Exact Decimal Precision',
      responsibilities: ['Normalizes heterogeneous channel payloads', 'Assigns immutable SWIFT UETR (UUID v4)', 'Enforces canonical domain invariants']
    },
    'tier-ssi': {
      title: 'SSI Enrichment Service (AMC)',
      tier: 'Account & Reference Data',
      protocol: 'REST / SOAP Cache',
      port: 8090,
      latency: '< 15ms',
      sla: 'In-Memory SSI Resolution',
      responsibilities: ['Looks up debtor/creditor Nostro accounts', 'Resolves intermediary correspondent BICs', 'Applies currency clearing corridors']
    },
    'tier-sanctions': {
      title: 'Sanctions Screening Service',
      tier: 'Controls & Compliance',
      protocol: 'gRPC (High Performance)',
      port: 8087,
      latency: '< 25ms',
      sla: '100% Counterparty Audit',
      responsibilities: ['Levenshtein & Bigram fuzzy matching', 'Screens OFAC SDN, EU, UN, and HMT lists', 'Automated ON_HOLD halt for score ≥ 80%']
    },
    'tier-controls': {
      title: 'Large Payment & Risk Controls',
      tier: 'Controls & Governance',
      protocol: 'Rule Engine',
      port: 8086,
      latency: '< 10ms',
      sla: 'Deterministic Threshold Evaluation',
      responsibilities: ['Large payment thresholds (≥ $1M single, ≥ $2M dual-blind)', '60-minute duplicate payment hash detection', 'Intraday credit line limit validation']
    },
    'tier-gov': {
      title: 'Maker-Checker Workflow Service',
      tier: 'Governance & Operations',
      protocol: 'REST / WebSockets',
      port: 8101,
      latency: '< 40ms',
      sla: 'Strict Segregation of Duties',
      responsibilities: ['Enforces four-eyes approval rules', 'Prevents Maker from self-approving', 'Blind voting: Checkers cannot view peer decisions']
    },
    'tier-trans': {
      title: 'Payment Transformation Service',
      tier: 'Message Standards',
      protocol: 'gRPC / XML Engine',
      port: 8091,
      latency: '< 18ms',
      sla: 'ISO 20022 Syntactic Validity',
      responsibilities: ['Generates pacs.008 customer credit transfers', 'Generates pacs.009 institutional transfers', 'Encapsulates Business Application Header (head.001)']
    },
    'tier-route': {
      title: 'Dynamic Gateway Routing Service',
      tier: 'Gateway Infrastructure',
      protocol: 'gRPC Router',
      port: 8092,
      latency: '< 6ms',
      sla: 'Zero Downtime Routing',
      responsibilities: ['Clearing matrix evaluation by currency/cut-off', 'Monitors circuit breakers (CLOSED/OPEN/HALF-OPEN)', 'Automated failover from BOX to CitiSwitch']
    },
    'gw-box': {
      title: 'SWIFT BOX Gateway',
      tier: 'Clearing Gateway',
      protocol: 'IBM WebSphere MQ',
      port: 8093,
      latency: '< 90ms',
      sla: 'Primary SWIFT Rail',
      responsibilities: ['Direct SWIFT Alliance Gateway connection', 'High-volume batch and real-time MX messaging', 'Dispatches MT199/pacs.002 status reports']
    },
    'gw-citi': {
      title: 'CitiSwitch SWIFT Gateway',
      tier: 'Clearing Gateway',
      protocol: 'REST / HTTPS (JSON/MX)',
      port: 8094,
      latency: '< 110ms',
      sla: 'Secondary SWIFT / Clearing Switch',
      responsibilities: ['Failover target for SWIFT cross-border wires', 'Global correspondent clearing network', 'Direct real-time callback settlement hooks']
    },
    'gw-issac': {
      title: 'ISSAC Domestic Instant Clearing',
      tier: 'Clearing Gateway',
      protocol: 'REST / HTTPS JSON',
      port: 8093,
      latency: '< 45ms',
      sla: '24/7/365 Real-Time Rail',
      responsibilities: ['National instant retail and corporate settlement', 'Sub-second technical ACK and confirmation', 'Direct central bank clearing switch']
    },
    'tier-outbox': {
      title: 'Transactional Outbox & Event Publisher',
      tier: 'Downstream Event Streaming',
      protocol: 'PostgreSQL Outbox + Kafka',
      port: 8097,
      latency: '< 12ms',
      sla: 'Exactly-Once Delivery',
      responsibilities: ['Guarantees atomic DB state and Kafka event publication', 'Debezium CDC streaming to external consumers', 'Pushes updates to Core GL, Recon, and Audit']
    }
  };

  const activeNodeInfo = selectedNode ? nodeMetadata[selectedNode] : (activeStep ? nodeMetadata[activeStep.nodeId] : null);

  return (
    <div className="space-y-6">
      {/* Interactive Controls & Scenario Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Scenario Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Simulate Flow:
          </span>
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedScenario(s.id);
                setCurrentStepIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedScenario === s.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{s.title.split(' ')[0]}</span>
              <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                selectedScenario === s.id
                  ? 'bg-blue-800 text-blue-100'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {s.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Playback Controls & Speed Multipliers */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title={isPlaying ? 'Pause Animation' : 'Resume Animation'}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-amber-600" /> : <Play className="w-4 h-4 text-emerald-600" />}
            </button>
            <button
              onClick={() => setCurrentStepIndex(0)}
              className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Reset Flow to Step 1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Speed:</span>
            {[0.5, 1, 2].map(speed => (
              <button
                key={speed}
                onClick={() => setActiveSpeed(speed)}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  activeSpeed === speed
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry: 420 tx/s</span>
          </div>
        </div>
      </div>

      {/* Main Animated Diagram Canvas */}
      <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden relative">
        {/* Scenario Header Info Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-800/80 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-400 font-mono tracking-wider uppercase">
                {scenario.badge}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-medium">
                {scenario.description}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              {scenario.title}
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono shrink-0">
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-right">
              <div className="text-[10px] text-slate-500">PAYLOAD AMOUNT</div>
              <div className="font-bold text-emerald-400">{scenario.amount}</div>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-right">
              <div className="text-[10px] text-slate-500">FINAL LIFECYCLE STATE</div>
              <div className={`font-bold ${
                scenario.finalState.includes('HOLD') ? 'text-rose-400' : 'text-blue-400'
              }`}>
                {scenario.finalState}
              </div>
            </div>
          </div>
        </div>

        {/* 5-Tier Architecture Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative">
          {/* TIER 1: Upstream Product Processors */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-2 py-1 bg-slate-900/90 rounded border border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>1. Upstream Channels</span>
              <span className="text-[9px] px-1 bg-slate-800 text-sky-400 rounded font-mono">INGRESS</span>
            </div>

            {[
              { id: 'src-gcms', name: 'GCMS Corporate', sub: 'REST API / HTTPS', icon: Server },
              { id: 'src-treasury', name: 'Treasury Core', sub: 'Apache Kafka v3.4', icon: Activity },
              { id: 'src-trade', name: 'Trade Finance', sub: 'IBM MQ v9.3', icon: Layers },
              { id: 'src-corp', name: 'Corporate Channels', sub: 'Open Banking / mTLS', icon: Share2 },
            ].map(node => {
              const Icon = node.icon;
              const isCurrent = activeStep?.nodeId === node.id;
              const isSelected = selectedNode === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer relative ${
                    isCurrent
                      ? 'bg-blue-950/80 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500'
                      : isSelected
                      ? 'bg-slate-900 border-sky-400'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isCurrent ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-white">{node.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">{node.sub}</div>
                </div>
              );
            })}
          </div>

          {/* TIER 2: Ingestion & Normalization */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-2 py-1 bg-slate-900/90 rounded border border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>2. Ingestion &amp; CPM</span>
              <span className="text-[9px] px-1 bg-slate-800 text-sky-400 rounded font-mono">PORT 8081</span>
            </div>

            {[
              { id: 'tier-val', name: 'Payment Validation', sub: 'ISO 4217 & Schema Guard', icon: CheckCircle2 },
              { id: 'tier-cpm', name: 'Canonical Model (CPM)', sub: 'UETR & Decimal Arithmetic', icon: Database },
              { id: 'tier-ssi', name: 'SSI Enrichment (AMC)', sub: 'Nostro & Correspondent BIC', icon: Cpu },
            ].map(node => {
              const Icon = node.icon;
              const isCurrent = activeStep?.nodeId === node.id;
              const isSelected = selectedNode === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer relative ${
                    isCurrent
                      ? 'bg-blue-950/80 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500'
                      : isSelected
                      ? 'bg-slate-900 border-sky-400'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isCurrent ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-white">{node.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">{node.sub}</div>
                </div>
              );
            })}
          </div>

          {/* TIER 3: Controls, Sanctions & Governance */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-2 py-1 bg-slate-900/90 rounded border border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>3. Controls &amp; Risk</span>
              <span className="text-[9px] px-1 bg-slate-800 text-sky-400 rounded font-mono">4-EYES</span>
            </div>

            {[
              { id: 'tier-sanctions', name: 'Sanctions Screening', sub: 'OFAC/EU/UN Levenshtein', icon: ShieldCheck },
              { id: 'tier-controls', name: 'Large & Duplicate Guard', sub: '60-min window & Limits', icon: AlertTriangle },
              { id: 'tier-gov', name: 'Dual-Blind 4-Eyes', sub: 'Maker-Checker Segregation', icon: Lock },
              { id: 'tier-trans', name: 'Transformation Engine', sub: 'pacs.008 / pacs.009 XML', icon: Zap },
            ].map(node => {
              const Icon = node.icon;
              const isCurrent = activeStep?.nodeId === node.id;
              const isSelected = selectedNode === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer relative ${
                    isCurrent
                      ? (scenario.id === 'sanctions' && node.id === 'tier-sanctions')
                        ? 'bg-rose-950/80 border-rose-500 shadow-lg shadow-rose-500/30 ring-1 ring-rose-500'
                        : 'bg-blue-950/80 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500'
                      : isSelected
                      ? 'bg-slate-900 border-sky-400'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                        scenario.id === 'sanctions' ? 'bg-rose-400' : 'bg-blue-400'
                      } opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${
                        scenario.id === 'sanctions' ? 'bg-rose-500' : 'bg-blue-500'
                      }`}></span>
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${
                      isCurrent 
                        ? (scenario.id === 'sanctions' && node.id === 'tier-sanctions' ? 'text-rose-400' : 'text-blue-400')
                        : 'text-slate-400'
                    }`} />
                    <span className="text-xs font-bold text-white">{node.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">{node.sub}</div>
                </div>
              );
            })}
          </div>

          {/* TIER 4: Routing & Gateways */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-2 py-1 bg-slate-900/90 rounded border border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>4. Dynamic Gateways</span>
              <span className="text-[9px] px-1 bg-slate-800 text-sky-400 rounded font-mono">RAILS</span>
            </div>

            {[
              { id: 'tier-route', name: 'Routing & Circuit Breaker', sub: 'Automated Failover Engine', icon: RefreshCw },
              { id: 'gw-box', name: 'SWIFT BOX Gateway', sub: 'MQ / SAG Alliance (Primary)', icon: Server },
              { id: 'gw-citi', name: 'CitiSwitch Gateway', sub: 'REST / HTTPS (Secondary)', icon: Server },
              { id: 'gw-issac', name: 'ISSAC Instant Domestic', sub: 'REST JSON 24/7 Rail', icon: Zap },
            ].map(node => {
              const Icon = node.icon;
              const isCurrent = activeStep?.nodeId === node.id;
              const isSelected = selectedNode === node.id;
              const isFailedNode = scenario.id === 'failover' && node.id === 'gw-box';
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer relative ${
                    isFailedNode
                      ? 'bg-rose-950/40 border-rose-800/80 opacity-75'
                      : isCurrent
                      ? 'bg-blue-950/80 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500'
                      : isSelected
                      ? 'bg-slate-900 border-sky-400'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  )}
                  {isFailedNode && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold text-rose-400 bg-rose-950 px-1.5 py-0.2 rounded border border-rose-800 font-mono">
                      CB OPEN
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isFailedNode ? 'text-rose-400' : isCurrent ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className={`text-xs font-bold ${isFailedNode ? 'text-rose-300 line-through' : 'text-white'}`}>
                      {node.name}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">{node.sub}</div>
                </div>
              );
            })}
          </div>

          {/* TIER 5: Downstream Integration */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-2 py-1 bg-slate-900/90 rounded border border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>5. Downstream &amp; Outbox</span>
              <span className="text-[9px] px-1 bg-slate-800 text-sky-400 rounded font-mono">KAFKA CDC</span>
            </div>

            {[
              { id: 'tier-outbox', name: 'Transactional Outbox', sub: 'Guaranteed Atomic State', icon: Database },
              { id: 'sub-gl', name: 'Core General Ledger (GL)', sub: 'Synchronous Balance Post', icon: Activity },
              { id: 'sub-recon', name: 'Nostro/Vostro Recon', sub: 'camt.053 Statement Match', icon: CheckCircle2 },
              { id: 'tier-audit', name: 'Cryptographic Audit Log', sub: 'Append-Only Regulatory Log', icon: ShieldCheck },
            ].map(node => {
              const Icon = node.icon;
              const isCurrent = activeStep?.nodeId === node.id || (activeStep?.nodeId === 'tier-outbox' && node.id === 'tier-outbox');
              const isSelected = selectedNode === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer relative ${
                    isCurrent
                      ? 'bg-blue-950/80 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500'
                      : isSelected
                      ? 'bg-slate-900 border-sky-400'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isCurrent ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-white">{node.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">{node.sub}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Step Tracker Ribbon */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              {currentStepIndex + 1}/{scenario.steps.length}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{activeStep.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                  activeStep.status === 'success' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  activeStep.status === 'error' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                  'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {activeStep.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{activeStep.detail}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {scenario.steps.map((st, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-blue-500 shadow-sm shadow-blue-500/50'
                    : idx < currentStepIndex
                    ? 'w-2.5 bg-emerald-500'
                    : 'w-2.5 bg-slate-800 hover:bg-slate-700'
                }`}
                title={`Jump to ${st.label}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Node Metadata Inspector Drawer */}
      {activeNodeInfo && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider font-mono">
                {activeNodeInfo.tier}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeNodeInfo.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Protocol: {activeNodeInfo.protocol}
              </span>
              {activeNodeInfo.port && (
                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900">
                  Port: {activeNodeInfo.port}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 font-medium">Processing SLA &amp; Latency</div>
              <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">{activeNodeInfo.latency}</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">{activeNodeInfo.sla}</div>
            </div>

            <div className="md:col-span-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 font-medium mb-1">Domain Responsibilities &amp; Invariants</div>
              <ul className="space-y-1">
                {activeNodeInfo.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
