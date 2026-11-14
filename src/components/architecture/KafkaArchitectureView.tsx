import React, { useState } from 'react';
import { 
  Zap, 
  Layers, 
  GitBranch, 
  Database, 
  ShieldAlert, 
  ArrowRight, 
  Copy, 
  CheckCircle2, 
  Search, 
  Filter, 
  Cpu, 
  RefreshCw, 
  Server, 
  Radio, 
  AlertTriangle, 
  Lock, 
  FileCode, 
  Check, 
  Activity, 
  Workflow, 
  Terminal, 
  ShieldCheck,
  ChevronRight,
  Clock,
  Sparkles,
  BarChart3,
  Sliders,
  Send,
  Boxes
} from 'lucide-react';

interface TopicItem {
  name: string;
  category: 'Instruction' | 'Processing' | 'Controls' | 'Transformation' | 'Gateway' | 'Lifecycle' | 'Audit & Downstream' | 'Configuration' | 'DLQ';
  partitions: number;
  retention: string;
  cleanup: 'delete' | 'compact';
  keyStrategy: string;
  producer: string;
  consumers: string[];
  dlqTopic?: string;
  description: string;
}

const TOPICS_DATA: TopicItem[] = [
  // 1. Ingestion & Instruction
  {
    name: 'gph.payment.instruction.raw.v1',
    category: 'Instruction',
    partitions: 64,
    retention: '30 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Payment Ingestion Service',
    consumers: ['Canonical Mapping Service', 'Raw Payload Archiver'],
    dlqTopic: 'gph.payment.instruction.raw.dlq',
    description: 'Ingests raw multi-format payment instructions (JSON, ISO 20022 XML, MT103, CSV) from upstream channels.'
  },
  {
    name: 'gph.payment.instruction.received.v1',
    category: 'Instruction',
    partitions: 64,
    retention: '30 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Canonical Mapping Service',
    consumers: ['Payment Orchestrator Service', 'Payment Status Service'],
    dlqTopic: 'gph.payment.instruction.received.dlq',
    description: 'Emits normalized Canonical Payment Model (CPM) with assigned UETR and Payment ID.'
  },

  // 2. Core Processing & Validation
  {
    name: 'gph.payment.validation.requested.v1',
    category: 'Processing',
    partitions: 64,
    retention: '7 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Payment Orchestrator Service',
    consumers: ['Payment Validation Service'],
    dlqTopic: 'gph.payment.validation.requested.dlq',
    description: 'Command event dispatched to initiate IBAN syntax, BIC check, currency, and mandatory field validation.'
  },
  {
    name: 'gph.payment.validation.completed.v1',
    category: 'Processing',
    partitions: 64,
    retention: '7 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Payment Validation Service',
    consumers: ['Payment Orchestrator Service'],
    dlqTopic: 'gph.payment.validation.completed.dlq',
    description: 'Result event publishing validation status (VALIDATED or REJECTED_VALIDATION_FAILED).'
  },
  {
    name: 'gph.payment.enrichment.requested.v1',
    category: 'Processing',
    partitions: 64,
    retention: '7 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Payment Orchestrator Service',
    consumers: ['SSI Enrichment Service'],
    dlqTopic: 'gph.payment.enrichment.requested.dlq',
    description: 'Command to resolve Standing Settlement Instructions (Nostro accounts, correspondent BICs).'
  },
  {
    name: 'gph.payment.enrichment.completed.v1',
    category: 'Processing',
    partitions: 64,
    retention: '7 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'SSI Enrichment Service',
    consumers: ['Payment Orchestrator Service'],
    dlqTopic: 'gph.payment.enrichment.completed.dlq',
    description: 'Result event containing enriched routing paths and intermediary accounts from AMC.'
  },

  // 3. Payment Controls (Parallel Fanout)
  {
    name: 'gph.payment.controls.requested.v1',
    category: 'Controls',
    partitions: 64,
    retention: '7 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Payment Orchestrator Service',
    consumers: ['Sanctions Engine', 'Credit Check Service', 'Duplicate Detection Service', 'Country Restriction Service'],
    dlqTopic: 'gph.payment.controls.requested.dlq',
    description: 'Parallel fan-out broadcast event to all independent control services simultaneously.'
  },
  {
    name: 'gph.payment.control.sanctions.evaluated.v1',
    category: 'Controls',
    partitions: 64,
    retention: '7 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Sanctions Screening Service',
    consumers: ['Payment Controls Engine'],
    dlqTopic: 'gph.payment.control.sanctions.dlq',
    description: 'OFAC/UN/EU fuzzy screening result with match score, sanction list ID, and hit details.'
  },
  {
    name: 'gph.payment.control.credit.evaluated.v1',
    category: 'Controls',
    partitions: 64,
    retention: '7 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Credit Check Service',
    consumers: ['Payment Controls Engine'],
    dlqTopic: 'gph.payment.control.credit.dlq',
    description: 'Intraday credit line evaluation result with reserved balance and limit check status.'
  },
  {
    name: 'gph.payment.control.duplicate.evaluated.v1',
    category: 'Controls',
    partitions: 64,
    retention: '7 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Duplicate Detection Service',
    consumers: ['Payment Controls Engine'],
    dlqTopic: 'gph.payment.control.duplicate.dlq',
    description: 'Sliding 60-minute window duplicate match result with hash collision details.'
  },
  {
    name: 'gph.payment.controls.completed.v1',
    category: 'Controls',
    partitions: 64,
    retention: '7 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Payment Controls Engine',
    consumers: ['Payment Orchestrator Service', 'Payment Status Service'],
    dlqTopic: 'gph.payment.controls.completed.dlq',
    description: 'Aggregated quorum evaluation outcome: ALL_PASSED, HOLD_SANCTIONS, HOLD_CREDIT, or REJECTED.'
  },

  // 4. Transformation & Routing
  {
    name: 'gph.payment.transformation.requested.v1',
    category: 'Transformation',
    partitions: 64,
    retention: '7 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Payment Orchestrator Service',
    consumers: ['Payment Transformation Service'],
    dlqTopic: 'gph.payment.transformation.requested.dlq',
    description: 'Command to transform Canonical Payment Model to target format (ISO 20022 XML, JSON, FEDWIRE).'
  },
  {
    name: 'gph.payment.transformation.completed.v1',
    category: 'Transformation',
    partitions: 64,
    retention: '7 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Payment Transformation Service',
    consumers: ['Payment Orchestrator Service'],
    dlqTopic: 'gph.payment.transformation.completed.dlq',
    description: 'Result event with serialized target payload and schema compliance validation stamp.'
  },
  {
    name: 'gph.payment.routing.requested.v1',
    category: 'Transformation',
    partitions: 64,
    retention: '7 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Payment Orchestrator Service',
    consumers: ['Payment Routing Service'],
    dlqTopic: 'gph.payment.routing.requested.dlq',
    description: 'Command to evaluate clearing matrices, cut-off schedules, gateway health, and rail fees.'
  },
  {
    name: 'gph.payment.routing.completed.v1',
    category: 'Transformation',
    partitions: 64,
    retention: '7 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Payment Routing Service',
    consumers: ['Payment Orchestrator Service'],
    dlqTopic: 'gph.payment.routing.completed.dlq',
    description: 'Result event containing selected primary gateway and fallback secondary route.'
  },

  // 5. Gateways
  {
    name: 'gph.gateway.submission.requested.v1',
    category: 'Gateway',
    partitions: 64,
    retention: '14 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(gateway_id + ":" + uetr)',
    producer: 'Payment Orchestrator Service',
    consumers: ['BOX Gateway Adapter', 'CitiSwitch Gateway Adapter', 'ISSAC Gateway Adapter'],
    dlqTopic: 'gph.gateway.submission.requested.dlq',
    description: 'Direct command event targeted to designated gateway adapter via gateway_id filter.'
  },
  {
    name: 'gph.gateway.response.received.v1',
    category: 'Gateway',
    partitions: 64,
    retention: '14 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(gateway_id + ":" + uetr)',
    producer: 'Gateway Adapters (BOX / CitiSwitch / ISSAC)',
    consumers: ['Payment Lifecycle Service', 'Payment Orchestrator Service'],
    dlqTopic: 'gph.gateway.response.received.dlq',
    description: 'Technical gateway ACK/NACK or network receipt acknowledgment with external message ID.'
  },
  {
    name: 'gph.gateway.credit.confirmed.v1',
    category: 'Gateway',
    partitions: 64,
    retention: '30 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Gateway Inbound Listeners',
    consumers: ['Payment Lifecycle Service', 'General Ledger Consumer', 'Reconciliation Consumer'],
    dlqTopic: 'gph.gateway.credit.confirmed.dlq',
    description: 'Final clearing settlement and beneficiary credit confirmation (pacs.002 ACCP or MT019).'
  },

  // 6. Lifecycle & Downstream
  {
    name: 'gph.payment.lifecycle.state.changed.v1',
    category: 'Lifecycle',
    partitions: 64,
    retention: '90 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Payment Lifecycle Service',
    consumers: ['Downstream Audit', 'Reconciliation Service', 'Data Lake Sink', 'WebSocket Gateway'],
    dlqTopic: 'gph.payment.lifecycle.dlq',
    description: 'Authoritative state transition notification (e.g. INGESTED -> VALIDATED -> SETTLED).'
  },
  {
    name: 'gph.audit.events.v1',
    category: 'Audit & Downstream',
    partitions: 64,
    retention: '2555 days (7 yrs)',
    cleanup: 'compact',
    keyStrategy: 'MurmurHash3(payment_id)',
    producer: 'All Microservices (Transactional Outbox)',
    consumers: ['Audit Compliance Application', 'Regulatory Data Lake'],
    dlqTopic: 'gph.audit.events.dlq',
    description: 'Cryptographically sealed audit trail recording actor, action, timestamp, and signature.'
  },
  {
    name: 'gph.downstream.gl.postings.v1',
    category: 'Audit & Downstream',
    partitions: 64,
    retention: '90 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(tenant_id + ":" + debtor_account)',
    producer: 'Payment Lifecycle Service',
    consumers: ['SAP ERP General Ledger', 'Core Banking Sub-ledger'],
    dlqTopic: 'gph.downstream.gl.dlq',
    description: 'Double-entry accounting debit/credit postings dispatched to general ledger.'
  },

  // 7. Configuration & Maker-Checker
  {
    name: 'gph.config.pipeline.changed.v1',
    category: 'Configuration',
    partitions: 8,
    retention: 'forever',
    cleanup: 'compact',
    keyStrategy: 'pipeline_id',
    producer: 'Pipeline Configuration Service',
    consumers: ['Payment Orchestrator Service (Hot Reload Cache)'],
    description: 'Compacted topic tracking active pipeline definitions, stage order, and routing policies.'
  },
  {
    name: 'gph.config.controls.rules.changed.v1',
    category: 'Configuration',
    partitions: 8,
    retention: 'forever',
    cleanup: 'compact',
    keyStrategy: 'rule_id',
    producer: 'Controls Configuration Service',
    consumers: ['Sanctions Engine', 'Credit Check Service', 'Duplicate Detection Service'],
    description: 'Compacted topic broadcasting runtime threshold and sanction list version updates.'
  },
  {
    name: 'gph.workflow.maker_checker.event.v1',
    category: 'Configuration',
    partitions: 16,
    retention: '180 days',
    cleanup: 'delete',
    keyStrategy: 'entity_id',
    producer: 'Maker-Checker Workflow Service',
    consumers: ['Notification Service', 'Audit Service', 'Payment Orchestrator Service'],
    description: 'Dual-blind maker submission, checker review, and dual-authorization unlock events.'
  },

  // 8. Dead Letter Queues
  {
    name: 'gph.payment.dlq.v1',
    category: 'DLQ',
    partitions: 32,
    retention: '30 days',
    cleanup: 'delete',
    keyStrategy: 'MurmurHash3(payment_id)',
    producer: 'Dead Letter Handler',
    consumers: ['Payment Repair Service', 'Operations Alerting Engine'],
    description: 'Central dead letter topic for unrecoverable technical serialization or infrastructure failures.'
  }
];

export const KafkaArchitectureView: React.FC = () => {
  const [subTab, setSubTab] = useState<'topology' | 'sequence' | 'topics' | 'cloudevents' | 'outbox' | 'retry-dlq' | 'gateways' | 'sizing'>('topology');
  const [topicSearch, setTopicSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedGateway, setSelectedGateway] = useState<'BOX' | 'CitiSwitch' | 'ISSAC' | 'FAILOVER'>('BOX');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredTopics = TOPICS_DATA.filter(t => {
    const matchesSearch = !topicSearch || 
      t.name.toLowerCase().includes(topicSearch.toLowerCase()) ||
      t.producer.toLowerCase().includes(topicSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(topicSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sequenceSteps = [
    {
      step: 1,
      name: 'Submit Payment Instruction',
      from: 'Upstream (GCMS / Trade)',
      to: 'Payment Ingestion Service',
      protocol: 'REST / Kafka Ingress',
      topic: 'gph.payment.instruction.raw.v1',
      desc: 'External upstream product processor submits payment. Ingestion assigns UETR (UUID v4) and raw payload hash.',
      payloadSample: `{
  "specversion": "1.0",
  "id": "evt_7f8a1c90",
  "source": "urn:gph:service:ingestion",
  "type": "com.gph.payment.instruction.raw.v1",
  "datacontenttype": "application/json",
  "time": "2026-11-06T13:45:00.120Z",
  "data": {
    "uetr": "eb607141-863a-4934-8c01-70bf764f691b",
    "sourceChannel": "GCMS",
    "rawPayloadBase64": "PHBhY3MuMDA4LjAwMS4wOD4..."
  }
}`
    },
    {
      step: 2,
      name: 'Canonical Mapping & Normalization',
      from: 'Payment Ingestion Service',
      to: 'Kafka Payment Instruction Topic',
      protocol: 'Kafka Event Dispatch',
      topic: 'gph.payment.instruction.received.v1',
      desc: 'Canonical Data Service transforms raw instruction into exact Canonical Payment Model (CPM) with decimal strings.',
      payloadSample: `{
  "specversion": "1.0",
  "id": "evt_8a9b2c01",
  "source": "urn:gph:service:canonical-mapping",
  "type": "com.gph.payment.instruction.received.v1",
  "data": {
    "paymentId": "PAY-2026-11-06-881920",
    "uetr": "eb607141-863a-4934-8c01-70bf764f691b",
    "instructedAmount": "14500000.50",
    "instructedCurrency": "USD",
    "debtorIban": "US89CITI00012345678901",
    "creditorIban": "GB29BARC20000012345678"
  }
}`
    },
    {
      step: 3,
      name: 'Orchestrator Saga Activation',
      from: 'Kafka Instruction Topic',
      to: 'Payment Orchestrator Service',
      protocol: 'Kafka Consumer (Group: orc-runners)',
      topic: 'gph.payment.instruction.received.v1',
      desc: 'Payment Orchestrator consumes instruction, creates Saga state record in PostgreSQL, and schedules Step 1 (Validation).',
      payloadSample: `{
  "sagaId": "saga_881920_v1",
  "currentStage": "VALIDATION_PENDING",
  "retryCount": 0,
  "startedAt": "2026-11-06T13:45:00.145Z"
}`
    },
    {
      step: 4,
      name: 'Validation Request & Verification',
      from: 'Payment Orchestrator',
      to: 'Validation Service',
      protocol: 'Kafka Command / Event',
      topic: 'gph.payment.validation.requested.v1',
      desc: 'Validates IBAN syntax, BIC existence in SWIFT BIC Directory, ISO-4217 currency decimals, and mandatory XML elements.',
      payloadSample: `{
  "paymentId": "PAY-2026-11-06-881920",
  "status": "VALIDATION_PASSED",
  "validationDurationMs": 4.2,
  "checkedRules": ["IBAN_MOD97", "BIC_ACTIVE", "CURRENCY_USD", "VALUE_DATE_VALID"]
}`
    },
    {
      step: 5,
      name: 'AMC SSI Enrichment',
      from: 'Payment Orchestrator',
      to: 'SSI Enrichment Service',
      protocol: 'Kafka Request / Reply',
      topic: 'gph.payment.enrichment.requested.v1',
      desc: 'Retrieves Standing Settlement Instructions (Intermediary Agent BIC, Nostro account, settlement currency) from AMC.',
      payloadSample: `{
  "paymentId": "PAY-2026-11-06-881920",
  "settlementRail": "SWIFT_CBPR_PLUS",
  "intermediaryBic": "CHASUS33XXX",
  "nostroAccount": "001-987654-USD-NOSTRO"
}`
    },
    {
      step: 6,
      name: 'Parallel Risk Controls Fanout',
      from: 'Payment Orchestrator',
      to: 'Sanctions / Credit / Duplicate / Country',
      protocol: 'Kafka Parallel Fanout Broadcast',
      topic: 'gph.payment.controls.requested.v1',
      desc: 'Concurrently broadcasts command to 4 independent control microservices. Evaluated simultaneously across parallel nodes.',
      payloadSample: `{
  "broadcastEventId": "ctrl_fanout_9918",
  "requiredQuorum": ["SANCTIONS", "CREDIT", "DUPLICATE", "COUNTRY_RESTRICTION"],
  "timeoutMs": 1500
}`
    },
    {
      step: 7,
      name: 'Quorum Barrier Aggregation',
      from: 'Individual Control Services',
      to: 'Payment Controls Engine',
      protocol: 'Kafka Stream Joining',
      topic: 'gph.payment.controls.completed.v1',
      desc: 'Controls Engine aggregates 4 responses. If sanctions hit score is 80-94%, state transitions to ON_HOLD (Compliance Review).',
      payloadSample: `{
  "quorumStatus": "ALL_PASSED",
  "sanctionsScore": 12.4,
  "creditReserved": true,
  "duplicateDetected": false,
  "countryPermitted": true
}`
    },
    {
      step: 8,
      name: 'Format Transformation',
      from: 'Payment Orchestrator',
      to: 'Transformation Service',
      protocol: 'Kafka Command / Event',
      topic: 'gph.payment.transformation.requested.v1',
      desc: 'Transforms CPM into ISO 20022 pacs.008.001.08 XML with exact schema validation and namespace binding.',
      payloadSample: `{
  "targetFormat": "ISO20022_PACS_008_001_08",
  "xmlLengthBytes": 4210,
  "validationAgainstXsd": true
}`
    },
    {
      step: 9,
      name: 'Dynamic Routing & Gateway Selection',
      from: 'Payment Orchestrator',
      to: 'Payment Routing Service',
      protocol: 'Kafka Command / Event',
      topic: 'gph.payment.routing.requested.v1',
      desc: 'Determines optimal gateway based on currency, value date, live gateway availability, and cut-off schedule (BOX Gateway selected).',
      payloadSample: `{
  "primaryGateway": "BOX_GATEWAY",
  "fallbackGateway": "CITISWITCH",
  "cutOffTimestamp": "2026-11-06T17:00:00Z",
  "estimatedFeeUsd": "0.15"
}`
    },
    {
      step: 10,
      name: 'Gateway Submission & Transport Adapter',
      from: 'Payment Orchestrator',
      to: 'BOX Gateway Adapter',
      protocol: 'Kafka Gateway Submission Topic',
      topic: 'gph.gateway.submission.requested.v1',
      desc: 'BOX Adapter reads command, formats SWIFT SAG MQ message, and transmits to SWIFT Alliance Gateway over encrypted session.',
      payloadSample: `{
  "gatewayId": "BOX_GATEWAY",
  "submissionId": "SUB-BOX-991201",
  "protocol": "IBM_MQ_MTLS",
  "transmissionStatus": "DISPATCHED"
}`
    },
    {
      step: 11,
      name: 'Gateway Technical ACK / NACK',
      from: 'BOX Gateway',
      to: 'Payment Lifecycle Service',
      protocol: 'Kafka Response Topic',
      topic: 'gph.gateway.response.received.v1',
      desc: 'SWIFT returns technical transmission acknowledgment (ACK/NACK). Confirms network ingestion, NOT final credit settlement.',
      payloadSample: `{
  "gatewayId": "BOX_GATEWAY",
  "ackStatus": "ACK_RECEIVED",
  "networkRef": "SWIFT-20261106-99219481",
  "roundtripLatencyMs": 142
}`
    },
    {
      step: 12,
      name: 'Clearing Settlement & Beneficiary Credit Confirmation',
      from: 'Clearing House / Inbound Listener',
      to: 'Credit Confirmation Service',
      protocol: 'Kafka Inbound Settlement',
      topic: 'gph.gateway.credit.confirmed.v1',
      desc: 'Inbound pacs.002.001.10 (ACCP) received. Verifies settlement at central bank and final beneficiary credit.',
      payloadSample: `{
  "uetr": "eb607141-863a-4934-8c01-70bf764f691b",
  "clearingStatus": "ACCP",
  "settlementTime": "2026-11-06T13:45:02.810Z",
  "bookingStatus": "SETTLED_FINAL"
}`
    },
    {
      step: 13,
      name: 'Downstream Decoupled Egress',
      from: 'Payment Lifecycle Service',
      to: 'General Ledger, Recon, Audit, Data Lake',
      protocol: 'Kafka Broadcast Topics',
      topic: 'gph.downstream.gl.postings.v1',
      desc: 'Transactional Outbox emits settlement events. General Ledger posts double-entry books; Recon reconciles Nostro accounts.',
      payloadSample: `{
  "accountingPostingId": "GL-2026-88192",
  "debitAccount": "1001-USD-OPERATIONAL",
  "creditAccount": "9920-USD-CLEARING",
  "settledAmount": "14500000.50",
  "timestamp": "2026-11-06T13:45:02.890Z"
}`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-mono">
                APACHE KAFKA EDA MANDATE
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                ZERO REST CHAINING
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono">
                10M DAU / 12,000 TPS PEAK
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono">
                CLOUDEVENTS 1.0 JSON
              </span>
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-indigo-400" />
              Event-Driven Payment Processor Architecture
            </h2>
            <p className="text-xs text-indigo-200/80 leading-relaxed">
              Complete decoupling of inter-service communication over Apache Kafka. Features Transactional Outbox, 
              parallel control fanout, non-blocking DLQ retry topologies, pluggable gateway adapters (BOX, CitiSwitch, ISSAC), 
              and strict 64-partition causal ordering per customer account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <div className="p-3 bg-indigo-900/40 rounded-lg border border-indigo-700/50 text-center min-w-[130px]">
              <div className="text-[10px] uppercase font-semibold text-indigo-300">Total Topics</div>
              <div className="text-xl font-bold font-mono text-white">40 Topics</div>
              <div className="text-[9px] text-indigo-300/70">31 Core + 9 Config</div>
            </div>
            <div className="p-3 bg-indigo-900/40 rounded-lg border border-indigo-700/50 text-center min-w-[130px]">
              <div className="text-[10px] uppercase font-semibold text-indigo-300">Partition Topology</div>
              <div className="text-xl font-bold font-mono text-emerald-400">64 Partitions</div>
              <div className="text-[9px] text-indigo-300/70">MurmurHash3 Invariant</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'topology', label: '1. Architecture & Flowchart', icon: Layers },
          { id: 'sequence', label: '2. 18-Step Event Flow', icon: GitBranch },
          { id: 'topics', label: '3. Topic Catalog (40)', icon: Database },
          { id: 'cloudevents', label: '4. CloudEvents Contract', icon: FileCode },
          { id: 'outbox', label: '5. Outbox & Inbox CDC', icon: Workflow },
          { id: 'retry-dlq', label: '6. Retry & DLQ Taxonomy', icon: AlertTriangle },
          { id: 'gateways', label: '7. Multi-Rail Adapters', icon: Server },
          { id: 'sizing', label: '8. Sizing & Cluster ACLs', icon: ShieldCheck },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: Topology & Mermaid Diagram */}
      {subTab === 'topology' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Mandated High-Level Kafka Event Streaming Architecture
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Decoupled microservice domains communicating strictly via persistent, partitioned Apache Kafka topics.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(`flowchart TB
    subgraph UPSTREAM["Upstream Product Processor Applications"]
        GCMS["GCMS"]
        TP["Trade Processor"]
        TRE["Treasury Processor"]
        MAN["Manual Payment UI"]
    end
    subgraph INGESTION["Payment Ingestion Layer"]
        API["API Gateway"]
        ING["Payment Ingestion Service"]
        CAN["Canonical Payment Mapping"]
    end
    subgraph KAFKA["Apache Kafka Event Streaming Platform"]
        K1["Payment Instruction Topics"]
        K2["Payment Processing Topics"]
        K3["Payment Control Topics"]
        K4["Payment Gateway Topics"]
        K5["Payment Lifecycle Topics"]
        K6["Payment Audit Topics"]
        K7["Payment DLQ Topics"]
    end
    subgraph CORE["Payment Processing Domain"]
        ORC["Payment Orchestrator"]
        VAL["Validation Service"]
        SSI["SSI Enrichment Service"]
        CTRL["Payment Controls Engine"]
        SAN["Sanctions Screening"]
        CRD["Credit Check"]
        DUP["Duplicate Detection"]
        TRF["Message Transformation"]
        RTE["Payment Routing"]
        LCM["Payment Lifecycle Service"]
    end
    subgraph GATEWAYS["Gateway Connectivity"]
        BOX["BOX Adapter"]
        CS["CitiSwitch Adapter"]
        ISS["ISSAC Adapter"]
    end
    subgraph EXTERNAL["External Systems"]
        AMC["AMC Account Management"]
        BOXEXT["BOX Gateway"]
        CSEXT["CitiSwitch"]
        ISSEXT["ISSAC"]
    end
    subgraph DOWNSTREAM["Downstream Applications"]
        AUD["Audit Application"]
        REC["Reconciliation"]
        ACC["Accounting"]
        DL["Data Lake"]
        REG["Regulatory Reporting"]
    end
    GCMS --> API
    TP --> API
    TRE --> API
    MAN --> API
    API --> ING
    ING --> CAN
    CAN --> K1
    K1 --> ORC
    ORC --> K2
    K2 --> VAL
    K2 --> SSI
    K2 --> CTRL
    SSI --> AMC
    CTRL --> SAN
    CTRL --> CRD
    CTRL --> DUP
    CTRL --> K3
    K3 --> TRF
    TRF --> RTE
    RTE --> K4
    K4 --> BOX
    K4 --> CS
    K4 --> ISS
    BOX --> BOXEXT
    CS --> CSEXT
    ISS --> ISSEXT
    BOXEXT --> K5
    CSEXT --> K5
    ISSEXT --> K5
    K5 --> LCM
    LCM --> K6
    K6 --> AUD
    K6 --> REC
    K6 --> ACC
    K6 --> DL
    K6 --> REG
    K2 --> K7
    K3 --> K7
    K4 --> K7
    K5 --> K7`, 'mermaid-topology')}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === 'mermaid-topology' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'mermaid-topology' ? 'Mermaid Copied' : 'Copy Mermaid'}
                </button>
              </div>
            </div>

            {/* Interactive Visual Architecture Map */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
              {/* Layer 1: Upstream */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">1. Upstream Channels</div>
                <div className="space-y-1.5">
                  {['GCMS Cash Mgmt', 'Trade Processor', 'Treasury Core', 'Manual Payment UI'].map((node, i) => (
                    <div key={i} className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>{node}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">REST</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 2: Ingestion */}
              <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">2. Ingestion & Mapping</div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <div>API Gateway</div>
                    <div className="text-[10px] font-normal text-slate-500">Rate limit & Auth</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <div>Payment Ingestion</div>
                    <div className="text-[10px] font-normal text-slate-500">UETR & Raw Archive</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <div>Canonical Mapping</div>
                    <div className="text-[10px] font-normal text-slate-500">CPM Normalization</div>
                  </div>
                </div>
              </div>

              {/* Layer 3: Kafka Nervous System */}
              <div className="lg:col-span-2 p-3.5 rounded-lg border border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-indigo-600" />
                    3. Apache Kafka Event Spine
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">64 Partitions</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { topic: 'K1: Instruction Topics', desc: 'Raw & Received CPM' },
                    { topic: 'K2: Processing Topics', desc: 'Validation & SSI Request' },
                    { topic: 'K3: Control Topics', desc: 'Sanctions / Credit Fanout' },
                    { topic: 'K4: Gateway Topics', desc: 'BOX / CS / ISSAC Submissions' },
                    { topic: 'K5: Lifecycle Topics', desc: 'State Transitions & ACCP' },
                    { topic: 'K6: Audit Topics', desc: 'Append-Only Ledger (7 yr)' },
                    { topic: 'K7: Non-Blocking DLQs', desc: 'Retry-1/2/3 & Dead Letter' },
                    { topic: 'K8: Config Topics', desc: 'Compacted Pipeline State' },
                  ].map((k, i) => (
                    <div key={i} className="p-1.5 rounded bg-white dark:bg-slate-800/90 border border-indigo-200 dark:border-indigo-900/60 font-mono text-[11px]">
                      <div className="font-bold text-indigo-900 dark:text-indigo-200">{k.topic}</div>
                      <div className="text-[9px] text-slate-500 truncate">{k.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 4: Core Domain & Gateways */}
              <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">4. Gateway Adapters</div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center justify-between">
                      <span>BOX Adapter</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-700">SWIFT MQ</span>
                    </div>
                    <div className="text-[10px] font-normal text-slate-500">ISO 20022 CBPR+ pacs.008</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center justify-between">
                      <span>CitiSwitch Adapter</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-700">REST mTLS</span>
                    </div>
                    <div className="text-[10px] font-normal text-slate-500">Internal Real-Time Clearing</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center justify-between">
                      <span>ISSAC Adapter</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-700">JSON API</span>
                    </div>
                    <div className="text-[10px] font-normal text-slate-500">Domestic Clearing Network</div>
                  </div>
                </div>
              </div>

              {/* Layer 5: Downstream */}
              <div className="p-3.5 rounded-lg border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">5. Downstream Egress</div>
                <div className="space-y-1.5">
                  {['General Ledger (GL)', 'Reconciliation', 'Audit Application', 'Data Lake / Snowflake', 'Regulatory (MAS/FED)'].map((app, i) => (
                    <div key={i} className="p-1.5 rounded bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-xs font-medium text-slate-800 dark:text-slate-200">
                      {app}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Architectural Principles Matrix */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Mandated Communication Principles & Pattern Allocations
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500">
                      <th className="py-2 px-3">Interaction Boundary</th>
                      <th className="py-2 px-3">Permitted Protocol</th>
                      <th className="py-2 px-3">Pattern Guarantee</th>
                      <th className="py-2 px-3">Why Synchronous REST is Prohibited</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Product Processor → Payment Processor</td>
                      <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400">REST / Kafka Ingress</td>
                      <td className="py-2.5 px-3">At-Least-Once + Idempotent Key</td>
                      <td className="py-2.5 px-3 text-slate-500">Ingestion validates signature & returns 202 Accepted + UETR immediately.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Payment Microservice → Microservice</td>
                      <td className="py-2.5 px-3 font-mono text-indigo-600 dark:text-indigo-400">Kafka Events Only</td>
                      <td className="py-2.5 px-3">Strict Causal Order per Account</td>
                      <td className="py-2.5 px-3 text-slate-500">Eliminates cascading latency, thread pool exhaustion, and distributed locks.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Payment Orchestrator → Processing Core</td>
                      <td className="py-2.5 px-3 font-mono text-indigo-600 dark:text-indigo-400">Kafka Commands / Events</td>
                      <td className="py-2.5 px-3">Saga Orchestration over Outbox</td>
                      <td className="py-2.5 px-3 text-slate-500">Allows asynchronous scale out, replayability, and state rollback on failure.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Payment Controls (Sanctions/Credit)</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400">Parallel Kafka Fanout</td>
                      <td className="py-2.5 px-3">Quorum Aggregation Barrier</td>
                      <td className="py-2.5 px-3 text-slate-500">Evaluates 4 independent controls concurrently in &lt;15ms rather than 60ms serialized.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">AMC SSI Integration</td>
                      <td className="py-2.5 px-3 font-mono text-amber-600 dark:text-amber-400">Kafka Request/Reply</td>
                      <td className="py-2.5 px-3">Correlated Correlation ID</td>
                      <td className="py-2.5 px-3 text-slate-500">Asynchronous request-reply prevents blocking payment threads during legacy AMC latency.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Downstream (GL, Recon, Audit)</td>
                      <td className="py-2.5 px-3 font-mono text-purple-600 dark:text-purple-400">Kafka Broadcast Topics</td>
                      <td className="py-2.5 px-3">Independent Consumer Groups</td>
                      <td className="py-2.5 px-3 text-slate-500">Slow reporting or batch GL ingestion never impacts real-time payment throughput.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: 18-Step Sequence Explorer */}
      {subTab === 'sequence' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Interactive 18-Step Kafka Event Processing Sequence
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click any step to inspect the exact Kafka event payload, topic name, producer, and consumer group.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveStep(prev => (prev > 1 ? prev - 1 : sequenceSteps.length))}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Previous
                </button>
                <span className="text-xs font-mono font-bold px-2 text-indigo-600 dark:text-indigo-400">
                  Step {activeStep} of {sequenceSteps.length}
                </span>
                <button
                  onClick={() => setActiveStep(prev => (prev < sequenceSteps.length ? prev + 1 : 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Sequence Horizontal Stepper */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
              {sequenceSteps.map(s => {
                const isSelected = activeStep === s.step;
                return (
                  <button
                    key={s.step}
                    onClick={() => setActiveStep(s.step)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-mono font-bold text-[10px] w-4 h-4 rounded-full bg-black/20 flex items-center justify-center">
                      {s.step}
                    </span>
                    <span className="truncate max-w-[120px]">{s.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Detailed Selected Step Card */}
            {(() => {
              const current = sequenceSteps.find(s => s.step === activeStep)!;
              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 rounded-lg border border-indigo-100 dark:border-indigo-950 bg-slate-50/60 dark:bg-slate-900/50">
                  <div className="lg:col-span-5 space-y-4">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Step {current.step} — {current.protocol}
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                        {current.name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                        {current.desc}
                      </p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Published To Topic</div>
                        <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 break-all">
                          {current.topic}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">Source / Producer</div>
                          <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                            {current.from}
                          </div>
                        </div>
                        <div className="p-2.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">Target / Consumer</div>
                          <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                            {current.to}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                        CloudEvents 1.0 Sample Wire Payload
                      </span>
                      <button
                        onClick={() => copyToClipboard(current.payloadSample, `step-payload-${current.step}`)}
                        className="px-2 py-1 rounded text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 text-slate-600 dark:text-slate-300"
                      >
                        {copiedKey === `step-payload-${current.step}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copiedKey === `step-payload-${current.step}` ? 'Copied' : 'Copy JSON'}
                      </button>
                    </div>

                    <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed max-h-[340px]">
                      {current.payloadSample}
                    </pre>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Topic Catalog */}
      {subTab === 'topics' && (
        <div className="space-y-4">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Master Kafka Topic Catalog & Partition Topology
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete catalog of 31 processing topics + 9 configuration topics. All topics strictly enforced with min.insync.replicas=2.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[240px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search topics, producers, keys..."
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  <option value="All">All Categories</option>
                  <option value="Instruction">Instruction</option>
                  <option value="Processing">Processing</option>
                  <option value="Controls">Controls</option>
                  <option value="Transformation">Transformation</option>
                  <option value="Gateway">Gateway</option>
                  <option value="Lifecycle">Lifecycle</option>
                  <option value="Audit & Downstream">Audit & Downstream</option>
                  <option value="Configuration">Configuration</option>
                  <option value="DLQ">DLQ</option>
                </select>
              </div>
            </div>

            {/* Topics Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-500">
                    <th className="py-2.5 px-3">Topic Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Partitions</th>
                    <th className="py-2.5 px-3">Retention</th>
                    <th className="py-2.5 px-3">Partition Key Invariant</th>
                    <th className="py-2.5 px-3">Primary Producer</th>
                    <th className="py-2.5 px-3">DLQ Destination</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {filteredTopics.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {t.name}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          t.category === 'Controls' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' :
                          t.category === 'Gateway' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' :
                          t.category === 'Configuration' ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300' :
                          t.category === 'DLQ' ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {t.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {t.partitions}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {t.retention}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={t.keyStrategy}>
                        {t.keyStrategy}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-800 dark:text-slate-200">
                        {t.producer}
                      </td>
                      <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400">
                        {t.dlqTopic || 'N/A (Compacted)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 font-mono">
              <span>Showing {filteredTopics.length} of {TOPICS_DATA.length} topics</span>
              <span>Replication Factor = 3 | acks=all | compression=zstd</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CloudEvents Contract */}
      {subTab === 'cloudevents' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  CloudEvents 1.0 Master Wire Specification (JSON & Avro)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Standardized financial event envelope. Decimal currency amounts are strictly encoded as string literals to prevent floating-point drift.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  IEEE-754 SAFE
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold">
                  W3C TRACEPARENT
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CloudEvents Standard Header Schema */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Mandatory CloudEvents 1.0 Envelope Attributes
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { attr: 'specversion', type: 'string', desc: 'Must be "1.0" for all emitted domain events.' },
                    { attr: 'id', type: 'string (UUID v4)', desc: 'Unique event ID for consumer deduplication and inbox verification.' },
                    { attr: 'source', type: 'URI reference', desc: 'Uniform Resource Name of emitting microservice (e.g. urn:gph:service:validation).' },
                    { attr: 'type', type: 'reverse-DNS', desc: 'FQDN event type string (e.g. com.gph.payment.validation.completed.v1).' },
                    { attr: 'datacontenttype', type: 'MIME string', desc: 'application/json or application/avro for high-throughput topics.' },
                    { attr: 'dataschema', type: 'Schema URI', desc: 'Confluent / Apicurio Schema Registry URI and schema version ID.' },
                    { attr: 'subject', type: 'string (UETR)', desc: 'Unique End-to-End Transaction Reference (UETR) enabling topic indexing.' },
                    { attr: 'time', type: 'RFC 3339 UTC', desc: 'Microsecond precision event generation timestamp.' },
                    { attr: 'traceparent', type: 'W3C String', desc: 'Distributed trace context propagated across all Kafka headers.' },
                  ].map((h, i) => (
                    <div key={i} className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{h.attr}</span>
                        <span className="ml-2 font-mono text-[10px] text-slate-400">({h.type})</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{h.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live JSON Envelope Sample */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Authoritative CloudEvents 1.0 JSON Instance
                  </div>
                  <button
                    onClick={() => copyToClipboard(`{
  "specversion": "1.0",
  "id": "c7a8109d-1142-4f3e-9081-304b509ef812",
  "source": "urn:gph:service:payment-orchestrator",
  "type": "com.gph.payment.controls.completed.v1",
  "datacontenttype": "application/json",
  "dataschema": "http://schema-registry:8081/schemas/ids/1402",
  "subject": "eb607141-863a-4934-8c01-70bf764f691b",
  "time": "2026-11-06T13:45:00.198210Z",
  "traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  "data": {
    "paymentId": "PAY-2026-11-06-881920",
    "uetr": "eb607141-863a-4934-8c01-70bf764f691b",
    "instructedAmount": "14500000.50",
    "instructedCurrency": "USD",
    "debtorAccountNumber": "US89CITI00012345678901",
    "creditorAccountNumber": "GB29BARC20000012345678",
    "quorumDecision": "ALL_PASSED",
    "controls": [
      { "controlType": "SANCTIONS_SCREENING", "status": "PASSED", "score": 12.4, "checkedLists": ["OFAC_SDN", "EU_CONSOL", "UN_SANCT"] },
      { "controlType": "CREDIT_CHECK", "status": "PASSED", "reservedLimit": "14500000.50", "currency": "USD" },
      { "controlType": "DUPLICATE_DETECTION", "status": "PASSED", "hashCollision": false },
      { "controlType": "COUNTRY_RESTRICTION", "status": "PASSED", "countryPair": "US-GB" }
    ],
    "pipelineId": "PL_HIGH_VALUE_FED_SWIFT_V2",
    "nextStage": "TRANSFORMATION_REQUESTED"
  }
}`, 'cloudevents-json')}
                    className="px-2 py-1 rounded text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 text-slate-700 dark:text-slate-300"
                  >
                    {copiedKey === 'cloudevents-json' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === 'cloudevents-json' ? 'Copied' : 'Copy Payload'}
                  </button>
                </div>

                <pre className="p-4 rounded-lg bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed max-h-[480px]">
{`{
  "specversion": "1.0",
  "id": "c7a8109d-1142-4f3e-9081-304b509ef812",
  "source": "urn:gph:service:payment-orchestrator",
  "type": "com.gph.payment.controls.completed.v1",
  "datacontenttype": "application/json",
  "dataschema": "http://schema-registry:8081/schemas/ids/1402",
  "subject": "eb607141-863a-4934-8c01-70bf764f691b",
  "time": "2026-11-06T13:45:00.198210Z",
  "traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  "data": {
    "paymentId": "PAY-2026-11-06-881920",
    "uetr": "eb607141-863a-4934-8c01-70bf764f691b",
    "instructedAmount": "14500000.50",
    "instructedCurrency": "USD",
    "debtorAccountNumber": "US89CITI00012345678901",
    "creditorAccountNumber": "GB29BARC20000012345678",
    "quorumDecision": "ALL_PASSED",
    "controls": [
      { 
        "controlType": "SANCTIONS_SCREENING", 
        "status": "PASSED", 
        "score": 12.4, 
        "checkedLists": ["OFAC_SDN", "EU_CONSOL", "UN_SANCT"] 
      },
      { 
        "controlType": "CREDIT_CHECK", 
        "status": "PASSED", 
        "reservedLimit": "14500000.50", 
        "currency": "USD" 
      },
      { 
        "controlType": "DUPLICATE_DETECTION", 
        "status": "PASSED", 
        "hashCollision": false 
      },
      { 
        "controlType": "COUNTRY_RESTRICTION", 
        "status": "PASSED", 
        "countryPair": "US-GB" 
      }
    ],
    "pipelineId": "PL_HIGH_VALUE_FED_SWIFT_V2",
    "nextStage": "TRANSFORMATION_REQUESTED"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: Transactional Outbox & Inbox */}
      {subTab === 'outbox' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Transactional Outbox & Inbox Patterns (Debezium CDC)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Guarantees 100% atomic dual-write consistency between PostgreSQL state mutation and Apache Kafka event publishing without 2PC distributed transactions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">
                  ZERO DUAL-WRITE DRIFT
                </span>
              </div>
            </div>

            {/* Outbox Mechanism Flowchart */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-blue-600 uppercase">1. Local DB Tx</div>
                  <div className="font-bold text-slate-900 dark:text-white">State + Outbox Table</div>
                  <p className="text-[11px] text-slate-500">Business entity update and event row are written inside single BEGIN...COMMIT transaction.</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase">2. Log Decoder</div>
                  <div className="font-bold text-slate-900 dark:text-white">Debezium CDC Engine</div>
                  <p className="text-[11px] text-slate-500">Debezium tails PostgreSQL Write-Ahead Log (WAL) at sub-millisecond latency.</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">3. Stream Publish</div>
                  <div className="font-bold text-slate-900 dark:text-white">Kafka Partitioned Topic</div>
                  <p className="text-[11px] text-slate-500">Event is published with key MurmurHash3(debtor_account) and acks=all.</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-purple-600 uppercase">4. Consumer Inbox</div>
                  <div className="font-bold text-slate-900 dark:text-white">Idempotency Guard</div>
                  <p className="text-[11px] text-slate-500">Consumer writes event ID to inbox table. Duplicate IDs throw unique violation and are safely skipped.</p>
                </div>
              </div>
            </div>

            {/* SQL DDL Definition for Outbox & Inbox */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                  <span>Transactional Outbox Schema (PostgreSQL)</span>
                  <button
                    onClick={() => copyToClipboard(`CREATE TABLE payment_outbox (
    outbox_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type      VARCHAR(64) NOT NULL,
    aggregate_id        VARCHAR(128) NOT NULL,
    event_type          VARCHAR(128) NOT NULL,
    payload             JSONB NOT NULL,
    partition_key       VARCHAR(128) NOT NULL,
    kafka_topic         VARCHAR(128) NOT NULL,
    headers             JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    processed_at        TIMESTAMPTZ NULL,
    dispatched_status   VARCHAR(20) NOT NULL DEFAULT 'PENDING'
);

CREATE INDEX idx_outbox_pending ON payment_outbox (created_at ASC) 
WHERE dispatched_status = 'PENDING';`, 'outbox-sql')}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <pre className="p-3.5 rounded-lg bg-slate-950 text-indigo-300 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
{`CREATE TABLE payment_outbox (
    outbox_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type      VARCHAR(64) NOT NULL,
    aggregate_id        VARCHAR(128) NOT NULL,
    event_type          VARCHAR(128) NOT NULL,
    payload             JSONB NOT NULL,
    partition_key       VARCHAR(128) NOT NULL,
    kafka_topic         VARCHAR(128) NOT NULL,
    headers             JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    processed_at        TIMESTAMPTZ NULL,
    dispatched_status   VARCHAR(20) NOT NULL DEFAULT 'PENDING'
);

CREATE INDEX idx_outbox_pending ON payment_outbox (created_at ASC) 
WHERE dispatched_status = 'PENDING';`}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                  <span>Transactional Inbox Schema (PostgreSQL)</span>
                  <button
                    onClick={() => copyToClipboard(`CREATE TABLE payment_inbox (
    event_id            UUID PRIMARY KEY,
    event_type          VARCHAR(128) NOT NULL,
    source_service      VARCHAR(64) NOT NULL,
    received_at         TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    processed_at        TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    execution_result    VARCHAR(32) NOT NULL,
    error_message       TEXT NULL
);

-- Idempotency check:
-- INSERT INTO payment_inbox (event_id, event_type, source_service, execution_result)
-- VALUES ($1, $2, $3, 'PROCESSED')
-- ON CONFLICT (event_id) DO NOTHING;`, 'inbox-sql')}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <pre className="p-3.5 rounded-lg bg-slate-950 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
{`CREATE TABLE payment_inbox (
    event_id            UUID PRIMARY KEY,
    event_type          VARCHAR(128) NOT NULL,
    source_service      VARCHAR(64) NOT NULL,
    received_at         TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    processed_at        TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    execution_result    VARCHAR(32) NOT NULL,
    error_message       TEXT NULL
);

-- Idempotent Consumer Atomic Guard:
-- INSERT INTO payment_inbox (event_id, event_type, source_service, execution_result)
-- VALUES ($1, $2, $3, 'PROCESSED')
-- ON CONFLICT (event_id) DO NOTHING;`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: Retry & DLQ Taxonomy */}
      {subTab === 'retry-dlq' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Non-Blocking Retry & Dead Letter Queue (DLQ) Architecture
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Critical distinction between Technical Errors (transient network failures) and Business States (compliance hold or credit breach).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold">
                  HOLDS NEVER ROUTE TO DLQ
                </span>
              </div>
            </div>

            {/* Error Taxonomy Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Business State Decisions (NOT DLQ)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    Expected Domain Flow
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Business rule evaluations are legitimate payment lifecycle outcomes. They are committed to the primary database and emitted as lifecycle events.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700">
                    <div className="font-bold text-slate-900 dark:text-white">Sanctions Potential Match (Score 80–94%)</div>
                    <div className="text-slate-500 text-[11px]">Action: State $\rightarrow$ <code>ON_HOLD_SANCTIONS</code>. Maker-Checker compliance queue notification.</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700">
                    <div className="font-bold text-slate-900 dark:text-white">Insufficient Credit / Limit Exceeded</div>
                    <div className="text-slate-500 text-[11px]">Action: State $\rightarrow$ <code>ON_HOLD_CREDIT</code>. Intraday liquidity manager alert.</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700">
                    <div className="font-bold text-slate-900 dark:text-white">Duplicate Instruction Detected (Window: 60m)</div>
                    <div className="text-slate-500 text-[11px]">Action: State $\rightarrow$ <code>REJECTED_DUPLICATE</code>. Emits pacs.002 RJCT to upstream channel.</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Technical Failures (Retry & DLQ Tiers)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                    Non-Blocking Backoff
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Transient infrastructure or connectivity glitches enter dedicated delay queues, keeping main payment partitions unblocked.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-700">
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>Retry Tier 1 (Immediate)</span>
                      <span className="font-mono text-blue-600 text-[11px]">Delay: 5 seconds</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">Published to <code>gph.*.retry.5s</code> topic. Consumer polls after delay window.</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-700">
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>Retry Tier 2 (Intermediate)</span>
                      <span className="font-mono text-amber-600 text-[11px]">Delay: 30 seconds</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">Published to <code>gph.*.retry.30s</code> topic for database lock contention.</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-700">
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>Retry Tier 3 (Exhaustion DLQ)</span>
                      <span className="font-mono text-rose-600 text-[11px]">After 3 Failures</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">Diverts to <code>gph.payment.dlq.v1</code>. Escalates to Payment Repair Workbench.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: Multi-Rail Gateways */}
      {subTab === 'gateways' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Multi-Rail Gateway Connectivity & Failover Sequences
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pluggable transport adapters separating technical transport acknowledgment from final settlement credit confirmation.
                </p>
              </div>

              {/* Gateway Rail Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {[
                  { id: 'BOX', label: 'BOX Gateway (SWIFT)' },
                  { id: 'CitiSwitch', label: 'CitiSwitch (mTLS)' },
                  { id: 'ISSAC', label: 'ISSAC (Domestic)' },
                  { id: 'FAILOVER', label: 'Timeout Failover' },
                ].map(gw => (
                  <button
                    key={gw.id}
                    onClick={() => setSelectedGateway(gw.id as any)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      selectedGateway === gw.id
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {gw.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Gateway Detail Panel */}
            {selectedGateway === 'BOX' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs">
                  <div>
                    <div className="font-bold text-blue-900 dark:text-blue-300">BOX Adapter: SWIFT Alliance Gateway (SAG) Protocol</div>
                    <div className="text-slate-500 mt-0.5">Asynchronous IBM MQ Netty connector formatting ISO 20022 pacs.008 CBPR+ over SWIFT FINplus.</div>
                  </div>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200">
                    SLA: 250ms ACK
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-500">Phase 1: Ingestion</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Kafka Submission Topic</div>
                    <p className="text-[11px] text-slate-500">Consumes from <code>gph.gateway.submission.requested.v1</code> filtered by <code>gateway_id = 'BOX'</code>.</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-500">Phase 2: Technical ACK</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Transmission Receipt</div>
                    <p className="text-[11px] text-slate-500">SWIFT returns ACK. Published to <code>gph.gateway.response.received.v1</code> (State $\rightarrow$ <code>SUBMITTED</code>).</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-500">Phase 3: Final ACCP</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Credit Confirmation</div>
                    <p className="text-[11px] text-slate-500">Inbound pacs.002 ACCP received. Emitted to <code>gph.gateway.credit.confirmed.v1</code> (State $\rightarrow$ <code>SETTLED</code>).</p>
                  </div>
                </div>
              </div>
            )}

            {selectedGateway === 'CitiSwitch' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs">
                  <div>
                    <div className="font-bold text-emerald-900 dark:text-emerald-300">CitiSwitch Adapter: Real-Time Internal Clearing Switch</div>
                    <div className="text-slate-500 mt-0.5">High-performance synchronous HTTP/2 REST transport with dual-sided mTLS and token rotation.</div>
                  </div>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                    SLA: 45ms Roundtrip
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-500">Dispatch</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">mTLS POST /payments/v2</div>
                    <p className="text-[11px] text-slate-500">Translates CPM into CitiSwitch canonical wire format with mutual certificate authentication.</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-500">HTTP Response</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Synchronous 200 OK</div>
                    <p className="text-[11px] text-slate-500">Adapter wraps HTTP 200 into CloudEvents ACK and pushes to <code>gph.gateway.response.received.v1</code>.</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-500">Direct Settlement</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Instant Clearing Callback</div>
                    <p className="text-[11px] text-slate-500">CitiSwitch posts final clearing notification to Kafka settlement topic in &lt;100ms.</p>
                  </div>
                </div>
              </div>
            )}

            {selectedGateway === 'ISSAC' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs">
                  <div>
                    <div className="font-bold text-purple-900 dark:text-purple-300">ISSAC Adapter: National Domestic ACH & RTGS Gateway</div>
                    <div className="text-slate-500 mt-0.5">Domestic clearing adapter supporting high-volume batch and real-time instant payment APIs.</div>
                  </div>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                    SLA: 120ms ACK
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold text-purple-500">Format Transformation</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Domestic JSON Format</div>
                    <p className="text-[11px] text-slate-500">Adapts ISO standard data into localized central bank Clearing House Interface schemas.</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold text-purple-500">National Switch ACK</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Clearing Acknowledgment</div>
                    <p className="text-[11px] text-slate-500">Emits standardized CloudEvents ACK to Kafka for real-time operations dashboard visibility.</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold text-purple-500">Batch Settlement</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Central Bank Settlement</div>
                    <p className="text-[11px] text-slate-500">Reconciliation batch files digested and correlated to original payment records by UETR.</p>
                  </div>
                </div>
              </div>
            )}

            {selectedGateway === 'FAILOVER' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs">
                  <div>
                    <div className="font-bold text-amber-900 dark:text-amber-300">Automated Timeout Failover & Rail Switching</div>
                    <div className="text-slate-500 mt-0.5">Saga orchestrator dynamically routes to secondary rail if primary gateway timer expires without ACK.</div>
                  </div>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    Timeout: 5000ms
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-slate-950 text-amber-400 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
{`1. Orchestrator dispatches submission to BOX Gateway (Primary Rail)
2. Starts distributed timeout timer (5000ms) keyed by UETR
3. [TIMEOUT FIRES]: No technical ACK received within SLA threshold
4. Orchestrator queries Gateway Adapter circuit-breaker status: BOX_TRIPPED
5. Saga emits: gph.gateway.submission.requested.v1 (gateway_id = 'CITISWITCH', is_fallback = true)
6. CitiSwitch processes instruction & returns ACK in 45ms
7. Lifecycle transitions: STATE = ROUTED_TO_FALLBACK -> SUBMITTED_SECONDARY
8. Operations alert triggered with zero payment loss or message duplication`}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 8: Cluster Sizing & Topic ACLs */}
      {subTab === 'sizing' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Cluster Capacity Sizing (10M DAU) & Topic ACL Matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Mathematical hardware specifications for 12,000 TPS peak and least-privilege SASL/SCRAM security policies.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">
                  6-NODE KRAFT CLUSTER
                </span>
              </div>
            </div>

            {/* Sizing Calculations */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-500">Peak Ingress Rate</div>
                <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">12,000 TPS</div>
                <div className="text-[10px] text-slate-500 mt-0.5">60 MB/sec Network Egress</div>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-500">Daily Data Volume</div>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">250 GB / Day</div>
                <div className="text-[10px] text-slate-500 mt-0.5">With zstd 3.2x Compression</div>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-500">Broker Specifications</div>
                <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">6x m6i.4xlarge</div>
                <div className="text-[10px] text-slate-500 mt-0.5">16 vCPU, 64 GB RAM, NVMe</div>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-500">End-to-End Latency</div>
                <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5">p99 &lt; 42ms</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Including Outbox CDC</div>
              </div>
            </div>

            {/* Topic Security ACL Matrix */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Production Principle-of-Least-Privilege Topic ACL Matrix
              </div>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-500">
                      <th className="py-2.5 px-3">Service Principal (SASL/SCRAM)</th>
                      <th className="py-2.5 px-3">Write (Producer) Permissions</th>
                      <th className="py-2.5 px-3">Read (Consumer Group) Permissions</th>
                      <th className="py-2.5 px-3">Host Whitelist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">svc-ingestion</td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">gph.payment.instruction.raw.v1</td>
                      <td className="py-2.5 px-3 text-slate-400">DENY (No Read Access)</td>
                      <td className="py-2.5 px-3 text-slate-500">k8s-ingestion-tier</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">svc-orchestrator</td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">gph.payment.*.requested.v1</td>
                      <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400">gph.payment.*.completed.v1, gph.gateway.*</td>
                      <td className="py-2.5 px-3 text-slate-500">k8s-core-tier</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">svc-sanctions</td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">gph.payment.control.sanctions.*</td>
                      <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400">gph.payment.controls.requested.v1</td>
                      <td className="py-2.5 px-3 text-slate-500">k8s-controls-tier</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">svc-box-adapter</td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">gph.gateway.response.received.v1</td>
                      <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400">gph.gateway.submission.requested.v1</td>
                      <td className="py-2.5 px-3 text-slate-500">k8s-gateway-tier</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">svc-downstream-gl</td>
                      <td className="py-2.5 px-3 text-slate-400">DENY (Read-Only Subscriber)</td>
                      <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400">gph.downstream.gl.postings.v1</td>
                      <td className="py-2.5 px-3 text-slate-500">k8s-downstream-tier</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
