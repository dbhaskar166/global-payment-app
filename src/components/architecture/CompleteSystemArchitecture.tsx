import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Server, 
  Layers, 
  Database, 
  Lock, 
  Network, 
  Zap, 
  Activity, 
  CheckCircle2, 
  FileText, 
  Share2, 
  Terminal, 
  Globe, 
  Cpu, 
  AlertOctagon, 
  Copy, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const CompleteSystemArchitecture: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<number>(1);
  const [activeZone, setActiveZone] = useState<'dmz' | 'core' | 'db' | 'clearing'>('core');

  const systemLayers = [
    {
      id: 1,
      name: 'Channel Ingress & Ingestion Tier',
      tag: 'EDGE GATEWAY',
      sla: '< 15ms Latency',
      services: ['Payment Instruction Service (8081)', 'Payment Ingestion Service (8082)', 'API Ingress Gateway', 'IBM MQ Channel Listeners'],
      techStack: 'Envoy Proxy, Spring Cloud Gateway, Netty, IBM MQ v9.3, Kafka Consumer Group',
      security: 'TLS 1.3 Termination, Client Certificate Authentication (mTLS), Token Bucket Rate Limiting, WAF inspection',
      resilience: 'Active-Active multi-region ingress, DNS Anycast, Stateless Pod Autoscaling (HPA 3 to 20 replicas)',
      desc: 'Handles external API requests and event streams from upstream Product Processors (GCMS, Trade Finance, Treasury, Corporate Open Banking). Ingests raw payload, assigns RFC 4122 UUID v4 UETR, and immutably archives initial message body.'
    },
    {
      id: 2,
      name: 'Core Orchestration & Saga Engine',
      tag: 'FSM SAGA COORDINATOR',
      sla: '< 30ms Execution',
      services: ['Processing Orchestrator Service (8083)', 'Canonical Data Service (8084)', 'Payment Status Service (8095)'],
      techStack: 'gRPC, Temporal/Saga State Machine, Java 21 LTS / Virtual Threads, Disruptor RingBuffer',
      security: 'Private VPC Core Zone, Zero Public Egress, gRPC SPIFFE/SPIRE mutual authentication',
      resilience: 'Optimistic concurrency control with version column, automated compensating Saga transactions on hard abort',
      desc: 'The brain of the platform. Executes the deterministic 18-step payment processing lifecycle. Implements non-blocking distributed Sagas ensuring exact decimal precision and transactional atomicity.'
    },
    {
      id: 3,
      name: 'Pre-Execution Risk Controls & Compliance',
      tag: 'FOUR-EYES & SANCTIONS',
      sla: '< 45ms P99 Match',
      services: ['Sanctions Screening Service (8087)', 'Credit Check Service (8088)', 'Duplicate Detection Service (8089)', 'Maker-Checker Service (8101)'],
      techStack: 'Redis Cluster 7.2 (Sliding Window Hashes), Apache Lucene / Levenshtein Token Matcher, gRPC',
      security: 'Compliance Officer RBAC, Dual-Blind state hiding (Checker 1 cannot view Checker 2 votes until quorum reached)',
      resilience: 'In-memory sanctions list caching with hot-reloading without service restart; sub-millisecond duplicate suppression',
      desc: 'Enforces bank regulatory compliance and risk parameters. Screens counterparty names against OFAC SDN, EU, UN, and HMT watchlists, validates intraday debtor credit limits, suppresses duplicates within 60 minutes, and routes high-value wires to Maker-Checker approval.'
    },
    {
      id: 4,
      name: 'Reference Data & SSI Enrichment Tier',
      tag: 'ACCOUNT MANAGEMENT CORE',
      sla: '< 15ms Cache Read',
      services: ['SSI Enrichment Service (8090)', 'Account Management Cache (AMC)', 'Market Holiday Calendar Service'],
      techStack: 'Redis 7.2 Multi-AZ Read Replicas, Spring Data Redis, SOAP/REST AMC Connectors',
      security: 'Encrypted cached Nostro/Vostro account numbers (AES-256 GCM), internal mTLS',
      resilience: 'Local L1 Guava cache + L2 Redis cluster with 24-hour fallback if upstream AMC core is unreachable',
      desc: 'Retrieves authoritative Standing Settlement Instructions (SSI) based on counterparty entity, currency clearing corridor, and transfer type. Injects Nostro accounts, correspondent BICs, and intermediary routing legs.'
    },
    {
      id: 5,
      name: 'Transformation & Market Standards Engine',
      tag: 'ISO 20022 MX COMPILER',
      sla: '< 20ms High-Throughput',
      services: ['Payment Transformation Service (8091)', 'Message Mapping Service (8103)', 'XML/JSON Schema Validator'],
      techStack: 'JAXB / FasterXML Woodstox High-Speed Streaming XML, JSON Schema Validator v7, ISO 20022 Schemas (2024 Release)',
      security: 'Strict XSD/Xerces validation preventing XML External Entity (XXE) and billion laughs injection attacks',
      resilience: 'Pre-compiled XSLT/Java templates in memory; zero heap allocation per message payload',
      desc: 'Compiles the Canonical Payment Model into market-compliant transport formats: ISO 20022 MX (pacs.008, pacs.009, pacs.002, pacs.004, camt.053/054) with Business Application Header (head.001), ISSAC Domestic Instant JSON, and NACHA ACH fixed-width.'
    },
    {
      id: 6,
      name: 'Dynamic Gateway Routing & Pluggable Connectivity',
      tag: 'MULTI-RAIL SWITCH',
      sla: '< 25ms Router Decision',
      services: ['Payment Routing Service (8092)', 'Gateway Connectivity Service (8093)', 'Pluggable Gateway Adapters (8094)'],
      techStack: 'Resilience4j Circuit Breaker (CLOSED/OPEN/HALF-OPEN), Netty TCP, IBM WebSphere MQ, REST HTTPS mTLS',
      security: 'Dedicated Hardware Security Module (HSM) / SWIFT ME-500 session keys, TLS 1.3 dedicated leased lines',
      resilience: 'Automated 120ms failover from SWIFT BOX to CitiSwitch upon consecutive timeouts without creating duplicate transactions',
      desc: 'Selects the optimal clearing gateway based on currency, destination country, cut-off schedules, and real-time connectivity health. Isolates core business logic from clearing transport mechanics.'
    },
    {
      id: 7,
      name: 'Persistence, Transactional Outbox & Audit',
      tag: 'MISSION-CRITICAL STORE',
      sla: 'Zero Data Loss (RPO=0)',
      services: ['PostgreSQL 16 Clustered DB', 'Transactional Outbox Worker (8097)', 'Cryptographic Audit Ledger (8105)'],
      techStack: 'PostgreSQL 16 Multi-AZ, Citus Partitioning, Debezium CDC, Kafka Connect, SHA-256 Append-Only Merkle Chain',
      security: 'TDE Storage Encryption, Row-Level Security (RLS), Field-level AES-256 for PII, WORM-compliant tamper-proof audit',
      resilience: 'Synchronous replication to Secondary AZ; automatic 15-second Patroni failover; RPO=0, RTO < 30 seconds',
      desc: 'Underpins financial durability. Atomically writes the payment state transition and the corresponding downstream event into the database in a single ACID transaction, preventing duplicate or ghost events.'
    },
    {
      id: 8,
      name: 'Downstream Event Streaming & Observability',
      tag: 'EVENT STREAMING & EGRESS',
      sla: '< 100ms End-to-End',
      services: ['Downstream Integration Service (8098)', 'Apache Kafka Cluster', 'OpenTelemetry Tracing', 'Prometheus & Grafana'],
      techStack: 'Apache Kafka 3.6 (KRaft mode, RF=3, min.insync.replicas=2), OpenTelemetry SDK, Prometheus, Grafana',
      security: 'Kafka SASL/SCRAM authentication, fine-grained ACLs per consumer group, TLS in-transit encryption',
      resilience: 'Dead Letter Queues (DLQ) with exponential backoff retry; automated replaying from event monitoring desk',
      desc: 'Fans out normalized lifecycle events to downstream subscribers: Core General Ledger, Nostro/Vostro Recon, Compliance Data Lake, and Regulatory Reporting. Emits distributed trace spans for end-to-end telemetry.'
    }
  ];

  const securityZones = {
    dmz: {
      name: 'External Ingress Zone (DMZ)',
      color: 'sky',
      isolation: 'Public / Extranet facing',
      components: ['F5 BIG-IP Load Balancers', 'WAF (ModSecurity)', 'Envoy Ingress Gateway', 'mTLS TLS 1.3 Terminator', 'OAuth2 OIDC Token Validator'],
      rules: ['Ingress permitted only from whitelisted CIDR blocks', 'mTLS mandatory with banking CA certificates', 'Strict rate-limiting: 5,000 req/sec per channel', 'Zero direct access to Database or HSM tiers']
    },
    core: {
      name: 'Secure Core Processing Perimeter',
      color: 'blue',
      isolation: 'Private Isolated Banking VPC',
      components: ['Processing Orchestrator FSM', 'Canonical Payment Engine', 'Sanctions Screening (OFAC/EU)', 'Maker-Checker Approval Engine', 'Payment Transformation Service'],
      rules: ['Strict internal gRPC with SPIFFE mutual identity tokens', 'Zero internet egress allowed', 'Access controlled by Network Security Groups (NSGs)', 'All inter-service calls logged with distributed trace context']
    },
    db: {
      name: 'Enterprise Persistence & Vault Tier',
      color: 'amber',
      isolation: 'Multi-AZ Private Data Subnet',
      components: ['PostgreSQL 16 Primary (AZ-1)', 'PostgreSQL 16 Sync Replica (AZ-2)', 'Redis 7.2 In-Memory Cluster', 'HashiCorp Vault Key Management (HSM)'],
      rules: ['Accessible ONLY from Core Processing Pods', 'Database connections pooled via PgBouncer', 'Encrypted at rest with AWS KMS / Hardware HSM keys', 'Immutable audit logs mirrored to write-once WORM storage']
    },
    clearing: {
      name: 'Clearing Gateway DMZ',
      color: 'emerald',
      isolation: 'Isolated Clearing DMZ',
      components: ['SWIFT Alliance Gateway (SAG)', 'SWIFT BOX MQ Gateway', 'CitiSwitch Secure REST Proxy', 'ISSAC National Clearing Switch', 'Hardware Security Module (HSM ME-500)'],
      rules: ['Direct dedicated leased lines / VPN to SWIFT and Central Bank', 'SWIFT PKI signature validation', 'Circuit breaker isolated per rail', 'All outbound messages recorded before physical dispatch']
    }
  };

  const activeZoneData = securityZones[activeZone];

  return (
    <div className="space-y-6">
      {/* Top System Summary Strip */}
      <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-mono">
                ENTERPRISE TOPOLOGY
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                TIER-0 MISSION CRITICAL
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Complete System Level Architecture &amp; Enterprise Blueprint
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              GPH is structured across 8 decoupled infrastructure tiers and 4 segregated security perimeters, delivering sub-second payment settlement, zero data loss, and active-active multi-rail failover.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3 py-2 bg-slate-950 rounded border border-slate-800 text-right">
              <div className="text-[10px] text-slate-500 font-mono">RPO (DATA LOSS)</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">RPO = 0</div>
            </div>
            <div className="px-3 py-2 bg-slate-950 rounded border border-slate-800 text-right">
              <div className="text-[10px] text-slate-500 font-mono">RTO (FAILOVER)</div>
              <div className="text-sm font-bold text-sky-400 font-mono">&lt; 30 SECONDS</div>
            </div>
            <div className="px-3 py-2 bg-slate-950 rounded border border-slate-800 text-right">
              <div className="text-[10px] text-slate-500 font-mono">THROUGHPUT SLA</div>
              <div className="text-sm font-bold text-amber-400 font-mono">2,500 TX/SEC</div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Security Perimeters Tab Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-blue-600" />
              <span>Network Zones &amp; Security Perimeters</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict network micro-segmentation isolating external ingestion channels from core banking records and clearing lines.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {(['dmz', 'core', 'db', 'clearing'] as const).map(zKey => {
              const z = securityZones[zKey];
              const isSelected = activeZone === zKey;
              return (
                <button
                  key={zKey}
                  onClick={() => setActiveZone(zKey)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {z.name.split(' (')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Zone Specs */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider font-mono">
                {activeZoneData.isolation}
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {activeZoneData.name}
              </div>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              Zero-Trust Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Perimeter Infrastructure Components</div>
              <ul className="space-y-1.5">
                {activeZoneData.components.map((comp, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="font-mono">{comp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Security &amp; Ingress Rules</div>
              <ul className="space-y-1.5">
                {activeZoneData.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 8-Tier System Architecture Interactive Explorer */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>The 8 Decoupled System Layers</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any architectural tier to inspect its microservices, protocols, SLAs, resilience mechanisms, and security policies.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Displaying Layer {activeLayer} of 8
          </span>
        </div>

        {/* Layer Selection Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {systemLayers.map(layer => {
            const isSelected = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className={`text-[10px] font-mono font-bold uppercase ${
                  isSelected ? 'text-blue-100' : 'text-slate-400'
                }`}>
                  Tier {layer.id}
                </div>
                <div className="text-xs font-bold truncate mt-1">
                  {layer.name.split(' ')[0]} {layer.name.split(' ')[1]}
                </div>
                <div className={`text-[9px] font-mono mt-1 ${
                  isSelected ? 'text-blue-200' : 'text-slate-500'
                }`}>
                  {layer.tag}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Layer Card */}
        {(() => {
          const layer = systemLayers.find(l => l.id === activeLayer)!;
          return (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      TIER {layer.id}: {layer.tag}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      SLA: {layer.sla}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {layer.name}
                  </h3>
                </div>

                <div className="text-xs font-mono text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                  Tech Stack: {layer.techStack.split(',')[0]}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {layer.desc}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-blue-600" />
                    <span>Deployed Microservices</span>
                  </div>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    {layer.services.map((svc, i) => (
                      <li key={i} className="flex items-center gap-1.5 font-mono text-[11px]">
                        <ChevronRight className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>{svc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-sky-600" />
                    <span>Technology Stack</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px] leading-relaxed">
                    {layer.techStack}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>Security &amp; Encryption</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                    {layer.security}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>Resilience &amp; Failover</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                    {layer.resilience}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Enterprise Reliability & Durability Matrix */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>High-Availability, Disaster Recovery &amp; Financial Integrity Guarantees</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise architectural invariants mandated by Basel Committee on Banking Supervision (BCBS 239) and CPMI standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              Zero Data Loss (RPO = 0)
            </div>
            <p className="text-slate-500 leading-relaxed">
              Every payment state transition and outgoing event is written synchronously across PostgreSQL multi-AZ synchronously-replicated nodes using the Transactional Outbox pattern before acknowledging upstream callers.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              Rapid Multi-AZ Failover (RTO &lt; 30s)
            </div>
            <p className="text-slate-500 leading-relaxed">
              Automated Patroni / Raft leader election promotes the synchronous standby replica within 15 seconds. Stateless Kubernetes pods automatically reconnect via connection poolers with zero dropped transactions.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              Active-Passive Circuit Breakers
            </div>
            <p className="text-slate-500 leading-relaxed">
              When a clearing gateway (such as SWIFT BOX) breaches error rate or latency thresholds, its circuit breaker immediately trips to OPEN, instantly and safely failing over to CitiSwitch without duplicating wires.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
