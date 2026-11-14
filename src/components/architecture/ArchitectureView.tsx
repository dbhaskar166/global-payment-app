import React, { useState } from 'react';
import { 
  Layers, 
  Server, 
  GitBranch, 
  Database, 
  ShieldAlert, 
  FileCode2, 
  Share2, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  Search,
  BookOpen,
  ArrowRight,
  Code,
  Zap,
  Activity,
  Network,
  Calculator
} from 'lucide-react';
import { AnimatedArchitectureDiagram } from './AnimatedArchitectureDiagram';
import { CompleteSystemArchitecture } from './CompleteSystemArchitecture';
import { HldLldDesignView } from './HldLldDesignView';
import { KafkaArchitectureView } from './KafkaArchitectureView';

export const ArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kafka-eda' | 'hld-lld' | 'animated-diagram' | 'system-architecture' | 'overview' | 'services' | 'flow' | 'canonical' | 'database' | 'controls' | 'iso20022'>('kafka-eda');
  const [searchFilter, setSearchFilter] = useState('');
  const [copied, setCopied] = useState(false);

  const microservices = [
    { id: 1, name: 'Payment Instruction Service', port: 8081, protocol: 'REST / gRPC', context: 'Ingestion & Intake', desc: 'Ingests external API payloads, generates UETR (UUID v4) and Payment ID, archives raw payload into immutable store.' },
    { id: 2, name: 'Payment Ingestion Service', port: 8082, protocol: 'Kafka / MQ / REST', context: 'Ingestion & Intake', desc: 'Multi-protocol ingestion broker (Kafka, IBM MQ, SFTP batch) with mTLS authentication and rate-limiting.' },
    { id: 3, name: 'Processing Orchestrator Service', port: 8083, protocol: 'gRPC / Saga FSM', context: 'Orchestration Core', desc: 'Master 18-step finite state machine (FSM) coordinator. Coordinates distributed non-blocking Sagas.' },
    { id: 4, name: 'Canonical Data Service', port: 8084, protocol: 'gRPC / Internal', context: 'Core Payment Model', desc: 'Manages the Canonical Payment Model (CPM) aggregate root; guarantees exact decimal arithmetic.' },
    { id: 5, name: 'Payment Validation Service', port: 8085, protocol: 'REST / gRPC', context: 'Schema Validation', desc: 'Performs mandatory field checks, ISO-4217 currency checks, IBAN syntax, and BIC format checks.' },
    { id: 6, name: 'Payment Controls Service', port: 8086, protocol: 'gRPC / REST', context: 'Controls & Risk', desc: 'Orchestrates the pre-execution risk control pipeline and assigns lifecycle hold actions.' },
    { id: 7, name: 'Sanctions Screening Service', port: 8087, protocol: 'gRPC (High Perf)', context: 'Controls & Compliance', desc: 'Fuzzy match engine screening Debtor, Creditor, and Agents against OFAC SDN, EU, UN, and HMT sanction lists.' },
    { id: 8, name: 'Credit Check Service', port: 8088, protocol: 'REST / gRPC', context: 'Controls & Liquidity', desc: 'Validates debtor entity credit lines, intraday liquidity thresholds, and available limits.' },
    { id: 9, name: 'Duplicate Detection Service', port: 8089, protocol: 'Redis / gRPC', context: 'Controls & Risk', desc: 'Evaluates sliding 60-minute duplicate matching window by debtor, creditor, amount, currency, and value date.' },
    { id: 10, name: 'SSI Enrichment Service', port: 8090, protocol: 'REST / SOAP (AMC)', context: 'Account Management', desc: 'Retrieves Standing Settlement Instructions (Nostro accounts, correspondent BICs) from AMC.' },
    { id: 11, name: 'Payment Transformation Service', port: 8091, protocol: 'gRPC / High Thpt', context: 'Transformation', desc: 'Transforms Canonical Payment Model into ISO 20022 MX XML (pacs.008/009), ISSAC JSON, and ACH.' },
    { id: 12, name: 'Payment Routing Service', port: 8092, protocol: 'gRPC / Internal', context: 'Gateway & Routing', desc: 'Evaluates dynamic clearing matrices, cut-off schedules, gateway availability, and failover.' },
    { id: 13, name: 'Gateway Connectivity Service', port: 8093, protocol: 'Netty / TCP / MQ', context: 'Gateway Infrastructure', desc: 'Manages persistent sessions to SWIFT SAG, BOX, CitiSwitch, and ISSAC domestic clearing hub.' },
    { id: 14, name: 'Gateway Adapter Service', port: 8094, protocol: 'Plug-in Drivers', context: 'Gateway Integrations', desc: 'Pluggable transport adapters isolating core orchestration from gateway-specific network protocols.' },
    { id: 15, name: 'Payment Status Service', port: 8095, protocol: 'REST / WebSocket', context: 'Lifecycle Management', desc: 'Authoritative state timeline and real-time WebSocket push updates for operations dashboards.' },
    { id: 16, name: 'Credit Confirmation Service', port: 8096, protocol: 'MQ / Kafka / REST', context: 'Settlement & Confirm', desc: 'Ingests clearing status reports (pacs.002, MT019) and verifies distinct beneficiary credit confirmations.' },
    { id: 17, name: 'Event Publishing Service', port: 8097, protocol: 'Kafka Outbox', context: 'Event Streaming', desc: 'Implements Transactional Outbox pattern guaranteeing atomic state update and Kafka event dispatch.' },
    { id: 18, name: 'Downstream Integration Service', port: 8098, protocol: 'REST / Kafka', context: 'Downstream Egress', desc: 'Pushes enriched lifecycle events to Core GL, Reconciliation, Data Lake, and Regulatory Reporting.' },
    { id: 19, name: 'Payment Operations Service', port: 8099, protocol: 'REST / JSON', context: 'Operations Workbench', desc: 'Backend query engine supporting multi-attribute filtering, search, and dashboard aggregation.' },
    { id: 20, name: 'Payment Repair Service', port: 8100, protocol: 'REST / JSON', context: 'Exception Management', desc: 'Permitted field editing for defective payments, automated re-validation, and audit diff tracking.' },
    { id: 21, name: 'Maker-Checker Workflow Service', port: 8101, protocol: 'REST / gRPC', context: 'Governance & Approvals', desc: 'Enforces four-eyes principles, segregation of duties, and dual-blind independent checks.' },
    { id: 22, name: 'Pipeline Configuration Service', port: 8102, protocol: 'REST / JSON', context: 'Configuration Engine', desc: 'Runtime management of 14-stage payment pipelines, versioning, and checker activation workflows.' },
    { id: 23, name: 'Message Mapping Config Service', port: 8103, protocol: 'REST / JSON', context: 'Configuration Engine', desc: 'Configures source-to-canonical and canonical-to-target field mapping rules and market presets.' },
    { id: 24, name: 'Gateway Config Service', port: 8104, protocol: 'REST / JSON', context: 'Configuration Engine', desc: 'Manages gateway endpoints, Vault secrets references, operational schedules, and circuit breakers.' },
    { id: 25, name: 'Audit Service', port: 8105, protocol: 'Append-Only Log', context: 'Governance & Audit', desc: 'Cryptographically sealed, append-only immutable audit trail indexed by UETR and Trace ID.' },
    { id: 26, name: 'Reporting Service', port: 8106, protocol: 'REST / OLAP Sync', context: 'Analytics & BI', desc: 'Computes multi-currency volume analytics, gateway turnaround latencies, and SLA metrics.' },
    { id: 27, name: 'Notification Service', port: 8107, protocol: 'Webhook / SSE', context: 'Communications', desc: 'Dispatches operational alerts for sanctions matches, circuit breaker trips, and cut-off deadlines.' },
    { id: 28, name: 'Identity & Access Mgmt Service', port: 8108, protocol: 'OAuth2 / OIDC', context: 'Security & RBAC', desc: 'Enforces enterprise RBAC permissions, token validation, and operational segregation of duties.' },
  ];

  const filteredServices = microservices.filter(s => 
    !searchFilter || 
    s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.context.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.desc.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono">
              ARCHITECTURE SPEC v2.4.0
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono">
              ISO 20022 CBPR+
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Global Payment Hub — Domain Design Document (DDD)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Authoritative enterprise specification covering strategic bounded contexts, 28 microservices, 18-step processing lifecycle, and relational database schemas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Document: /docs/DOMAIN_DESIGN_DOCUMENT.md</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-medium overflow-x-auto pb-1">
        {[
          { id: 'kafka-eda', label: '⚡ Kafka EDA Architecture (Mandate)' },
          { id: 'hld-lld', label: '📐 HLD & LLD (10M Users)' },
          { id: 'animated-diagram', label: '⚡ Animated Architecture Diagram' },
          { id: 'system-architecture', label: '🏛️ Complete System Architecture' },
          { id: 'overview', label: '4. Strategic Context Map' },
          { id: 'services', label: '5. 28 Microservices Matrix' },
          { id: 'flow', label: '6. 18-Step Processing Flow' },
          { id: 'canonical', label: '7. Canonical Data Model' },
          { id: 'database', label: '8. Relational Schemas (DDL)' },
          { id: 'controls', label: '9. Controls & Sanctions' },
          { id: 'iso20022', label: '10. ISO 20022 & Standards' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2.5 px-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Kafka-Based Event-Driven Architecture */}
      {activeTab === 'kafka-eda' && (
        <KafkaArchitectureView />
      )}

      {/* TAB: High & Low Level Design for 10M DAU */}
      {activeTab === 'hld-lld' && (
        <HldLldDesignView />
      )}

      {/* TAB: High Level Animated Flow Diagram */}
      {activeTab === 'animated-diagram' && (
        <AnimatedArchitectureDiagram />
      )}

      {/* TAB: Complete System Level Architecture */}
      {activeTab === 'system-architecture' && (
        <CompleteSystemArchitecture />
      )}

      {/* TAB 3: Overview & Context Map */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Strategic Bounded Contexts & Architecture Blueprint
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              The Global Payment Hub (GPH) is structured into eight strategic Bounded Contexts. Upstream Product Processors (GCMS, Trade Finance, Treasury Core, Corporate Channels) communicate with GPH over asynchronous messaging (Kafka, IBM MQ) and synchronous REST endpoints. GPH decouples internal banking systems from external payment clearing networks.
            </p>

            {/* Architecture ASCII Diagram Card */}
            <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
{`+---------------------------------------------------------------------------------------------------+
|  UPSTREAM PRODUCT PROCESSORS (GCMS, Trade Finance, Treasury Core, Corporate Channels, Manual UI)  |
+-------------------------------------------------+-------------------------------------------------+
                                                  | REST / Kafka / MQ
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                  GLOBAL PAYMENT HUB ORCHESTRATION                                 |
+-------------------------------------------------+-------------------------------------------------+
|  [Ingestion & Schema Validation]  ====>  [Canonical Data Normalization]  ====>  [AMC SSI Enrichment]
|                                                                                       |
|  [Message Transformation Engine]  <====  [Maker-Checker Approval]  <====  [Payment Controls Engine]
|  (ISO 20022 pacs.008/009 / ISSAC)        (Single / Dual-Blind 4-Eyes)     (Sanctions / Duplicates)
|          |
|          v
|  [Dynamic Gateway Routing]        ====>  [SWIFT BOX / CitiSwitch / ISSAC / RTGS / ACH Gateways]
|                                                       |
|                                                       v
|  [Transactional Outbox Pattern]   ====>  [Downstream: Core GL, Recon, Audit Ledger, Data Lake]
+---------------------------------------------------------------------------------------------------+`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Core Standard</div>
              <div className="text-base font-bold text-slate-900 dark:text-white">ISO 20022 CBPR+</div>
              <p className="text-[11px] text-slate-500">Native pacs.008, pacs.009, pacs.002, pacs.004, camt.053/054 XML support</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Resilience</div>
              <div className="text-base font-bold text-slate-900 dark:text-white">Circuit Breaker & Failover</div>
              <p className="text-[11px] text-slate-500">Automatic routing failover between BOX and CitiSwitch without duplicate execution</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Governance</div>
              <div className="text-base font-bold text-slate-900 dark:text-white">Dual-Blind 4-Eyes</div>
              <p className="text-[11px] text-slate-500">Enforced separation of duties; independent checker signoffs for high-value payments</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Financial Integrity</div>
              <div className="text-base font-bold text-slate-900 dark:text-white">Transactional Outbox</div>
              <p className="text-[11px] text-slate-500">Atomic database-backed events guarantee exactly-once delivery to GL and Recon</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 28 Microservices Matrix */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search microservices by name, context, or protocol..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
              />
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Displaying {filteredServices.length} of 28 microservices
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Microservice Name</th>
                    <th className="py-2.5 px-4 font-mono">Port</th>
                    <th className="py-2.5 px-4">Protocol</th>
                    <th className="py-2.5 px-4">Bounded Context</th>
                    <th className="py-2.5 px-4">Key Domain Responsibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredServices.map(svc => (
                    <tr key={svc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-slate-400">{svc.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{svc.name}</td>
                      <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400">{svc.port}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">{svc.protocol}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {svc.context}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed max-w-md">
                        {svc.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 18-Step Processing Flow */}
      {activeTab === 'flow' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Deterministic 18-Step Payment Processing Lifecycle
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Every instruction progresses through these exact stages. State invariants strictly prohibit invalid jumps (e.g. Cannot transition from RECEIVED directly to CREDIT_CONFIRMED).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {[
              { step: 1, name: 'Receive Payment Instruction', state: 'RECEIVED', desc: 'Assigns unique Payment ID & UETR, checks idempotency key, stores raw payload.' },
              { step: 2, name: 'Validate Source System', state: 'RECEIVED', desc: 'Validates mTLS client certificates, channel permissions, and tenant security.' },
              { step: 3, name: 'Validate Payment Schema', state: 'VALIDATED', desc: 'Validates mandatory accounts, ISO 4217 currency, positive amount, value date.' },
              { step: 4, name: 'Normalize Payment Data', state: 'VALIDATED', desc: 'Converts upstream proprietary format into Canonical Payment Model (CPM).' },
              { step: 5, name: 'Enrich Payment Data', state: 'ENRICHED', desc: 'Appends booking entities, LEI codes, and internal regulatory metadata.' },
              { step: 6, name: 'Retrieve SSI from AMC', state: 'ENRICHED', desc: 'Queries Account Management System for Nostro account and correspondent BIC.' },
              { step: 7, name: 'Apply Payment Controls', state: 'CONTROLS_PASSED', desc: 'Executes Sanctions, Large Payment, Duplicate, and Credit Limit checks in sequence.' },
              { step: 8, name: 'Perform Risk Assessment', state: 'CONTROLS_PASSED', desc: 'Evaluates cutoff times, high-risk destination jurisdictions, and velocity rules.' },
              { step: 9, name: 'Determine Payment Route', state: 'ROUTED', desc: 'Dynamic selection of primary gateway with automated circuit breaker failover.' },
              { step: 10, name: 'Determine Message Format', state: 'ROUTED', desc: 'Maps clearing rail to target syntax (pacs.008, pacs.009, ISSAC JSON, ACH).' },
              { step: 11, name: 'Transform Payment Message', state: 'TRANSFORMED', desc: 'Generates financial message payload and validates XML against schema XSD.' },
              { step: 12, name: 'Maker-Checker Approval', state: 'APPROVED', desc: 'Four-eyes signoff or dual-blind approval required for high-value payments.' },
              { step: 13, name: 'Submit to Gateway', state: 'SUBMITTED', desc: 'Delivers payload to SWIFT BOX, CitiSwitch, or ISSAC transport queue.' },
              { step: 14, name: 'Receive Gateway ACK', state: 'ACKNOWLEDGED', desc: 'Captures gateway technical validation acknowledgement (distinct from credit).' },
              { step: 15, name: 'Receive Credit Confirmation', state: 'CREDIT_CONFIRMED', desc: 'Ingests pacs.002 ACCP or ISSAC confirmation that beneficiary was credited.' },
              { step: 16, name: 'Update Payment Lifecycle', state: 'CREDIT_CONFIRMED', desc: 'Commits state change to PostgreSQL and updates live operations feeds.' },
              { step: 17, name: 'Publish Payment Events', state: 'CREDIT_CONFIRMED', desc: 'Transactional outbox dispatches Kafka events to GL, Recon, and Audit.' },
              { step: 18, name: 'Generate Audit Records', state: 'CREDIT_CONFIRMED', desc: 'Appends cryptographically signed audit ledger record for regulatory recordkeeping.' },
            ].map(item => (
              <div key={item.step} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-blue-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                  {item.step}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{item.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {item.state}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Canonical Data Model */}
      {activeTab === 'canonical' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Canonical Payment Model (CPM) Schema Structure
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Internal domain model normalizing cross-border SWIFT and domestic transactions.
            </p>
          </div>

          <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
{`interface CanonicalPaymentModel {
  // Identification
  paymentId: string;                // e.g. 'GPH-2026-000100'
  uetr: string;                     // RFC 4122 UUID v4 (SWIFT standard)
  sourceTransactionId: string;      // Upstream reference
  correlationId: string;            // Distributed trace correlation
  idempotencyKey: string;           // Suppresses duplicate ingestion

  // Financial Values
  currency: string;                 // ISO 4217 (USD, EUR, GBP, JPY, ...)
  amount: number;                   // Exact decimal representation
  valueDate: string;                // ISO 8601 (YYYY-MM-DD)
  bookingDate: string;              // Internal accounting date
  requestedExecutionDate: string;   // Requested execution date

  // Parties & Agents
  debtor: {
    entityName: string;
    accountNumber: string;
    country: string;                // ISO 3166-1 alpha-2
    address?: string;
  };
  creditor: {
    entityName: string;
    accountNumber: string;
    country: string;
    address?: string;
  };
  debtorAgent: {
    bic: string;                    // ISO 9362 BIC
    name: string;
    country: string;
  };
  creditorAgent: {
    bic: string;
    name: string;
    country: string;
  };

  // Settlement & Remittance
  charges: 'OUR' | 'SHA' | 'BEN';
  paymentPurpose: string;
  remittanceInformation: string;
  ssiReference?: StandingSettlementInstruction;

  // Lifecycle & State
  status: PaymentStatus;
  controlResults: ControlExecutionResult[];
  holds: PaymentHold[];
  approvalWorkflow?: MakerCheckerApproval;
  transformedMessage?: TransformedMessage;
  gatewayRecord?: GatewaySubmissionRecord;
}`}
          </pre>
        </div>
      )}

      {/* TAB 5: Relational Schemas (DDL) */}
      {activeTab === 'database' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              PostgreSQL Production Relational DDL (Selected Core Tables)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Normalized tables supporting optimistic locking, append-only audit histories, and outbox event streaming.
            </p>
          </div>

          <pre className="p-4 bg-slate-950 text-sky-300 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto leading-relaxed max-h-[500px]">
{`-- Core Payment Instruction Table
CREATE TABLE gph_payment_instruction (
    payment_id VARCHAR(32) PRIMARY KEY,
    uetr UUID NOT NULL UNIQUE,
    source_transaction_id VARCHAR(64) NOT NULL,
    correlation_id VARCHAR(64) NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    source_system VARCHAR(32) NOT NULL,
    payment_type VARCHAR(32) NOT NULL,
    currency CHAR(3) NOT NULL,
    amount NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
    value_date DATE NOT NULL,
    debtor_account VARCHAR(64) NOT NULL,
    creditor_account VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    received_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactional Outbox Downstream Events Table
CREATE TABLE gph_outbox_event (
    event_id VARCHAR(64) PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    payment_id VARCHAR(32) NOT NULL REFERENCES gph_payment_instruction(payment_id),
    correlation_id VARCHAR(64) NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_status VARCHAR(32) NOT NULL,
    payload JSONB NOT NULL,
    delivery_status JSONB NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE
);

-- Maker-Checker Approvals Table
CREATE TABLE gph_payment_approval (
    approval_id BIGSERIAL PRIMARY KEY,
    payment_id VARCHAR(32) NOT NULL REFERENCES gph_payment_instruction(payment_id),
    required_level INT NOT NULL DEFAULT 1,
    is_dual_blind BOOLEAN NOT NULL DEFAULT FALSE,
    maker_user_id VARCHAR(64) NOT NULL,
    checker1_user_id VARCHAR(64),
    checker1_status VARCHAR(16) DEFAULT 'PENDING',
    checker2_user_id VARCHAR(64),
    checker2_status VARCHAR(16) DEFAULT 'PENDING'
);`}
          </pre>
        </div>
      )}

      {/* TAB 6: Controls & Sanctions */}
      {activeTab === 'controls' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Payment Controls & Sanctions Screening Engine
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configurable pre-execution risk checks executed before payment message transformation and gateway dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-slate-900 dark:text-white text-sm">Sanctions Screening (OFAC/EU/UN)</div>
              <p className="text-slate-500 leading-relaxed">
                Screens Debtor, Creditor, Debtor Agent, Creditor Agent, and Remittance text. Uses Levenshtein and bigram token similarity. Match score ≥ 95% generates Confirmed Match; 80% ≤ Score &lt; 95% generates Potential Match. Sanctions holds can only be released by authorized Compliance Officers.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-slate-900 dark:text-white text-sm">Duplicate Payment Suppression</div>
              <p className="text-slate-500 leading-relaxed">
                Computes composite SHA-256 hash of Debtor Account, Creditor Account, Currency, Amount, and Value Date within a 60-minute sliding window. Prevents duplicate payments resulting from network retries or operator error.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-slate-900 dark:text-white text-sm">Large Payment Control &amp; Dual-Blind</div>
              <p className="text-slate-500 leading-relaxed">
                Threshold-based routing: Payments ≥ $1,000,000 mandate single Checker approval. Payments ≥ $2,000,000 trigger Dual-Blind risk control where two independent checkers must review and vote without viewing each other's decisions.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-slate-900 dark:text-white text-sm">Credit Line & Intraday Facility</div>
              <p className="text-slate-500 leading-relaxed">
                Validates debtor entity limits against real-time credit utilization before funds commitment. Exceeded limits place payment on `CREDIT_LIMIT_EXCEEDED` hold pending credit risk signoff.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: ISO 20022 Standards */}
      {activeTab === 'iso20022' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              SWIFT ISO 20022 & Domestic Message Formatting Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Standard CBPR+ and market practice implementations supported by GPH.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white font-mono">pacs.008.001.10 — FI-to-FI Customer Credit Transfer</div>
              <p className="text-slate-500">Cross-border and domestic high-value customer transfers. Encapsulated in Business Application Header (AppHdr head.001.001.03) with UETR and clearing system identification.</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white font-mono">pacs.009.001.10 — Financial Institution Credit Transfer</div>
              <p className="text-slate-500">Used for institutional liquidity sweeps, interbank treasury transfers, and cover payments (pacs.009 COV).</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white font-mono">pacs.002.001.12 — Payment Status Report</div>
              <p className="text-slate-500">Inbound clearing status report delivering gateway technical ACK/NACK or beneficiary credit confirmations (ACCP).</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white font-mono">ISSAC Domestic Instant Clearing — JSON V2.4</div>
              <p className="text-slate-500">24/7 domestic real-time settlement payload format supporting sort-code clearing and instant confirmation hooks.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
