# Global Payment Hub (GPH) — Domain Design Document (DDD) & Architecture Specification

**Document Version:** 2.4.0  
**Target Architecture:** Enterprise Centralized Payment Orchestration Platform  
**Standards Compliance:** ISO 20022 (CBPR+ / HVPS+), SWIFT, SEPA, FEDWIRE, CHIPS, ISSAC, NACHA, CPMI, BCBS 239  
**Security Classification:** Highly Confidential — Tier-0 Mission-Critical Banking Infrastructure  

---

## 1. Executive Summary & Platform Mission

The **Global Payment Hub (GPH)** is an enterprise-grade, configuration-driven centralized payment orchestration engine designed for Tier-1 global corporate and investment banks. It decouples upstream product processing applications (Trade Finance, Global Cash Management Services [GCMS], Treasury Core, Liquidity Management, Corporate Banking Channels) from downstream clearing networks and payment market infrastructures (SWIFT, ISSAC, RTGS, Fedwire, CHIPS, NACHA ACH).

### 1.1 Core Objectives
1. **Centralized Payment Orchestration:** Act as the unified backbone for processing, validation, enrichment, compliance control, transformation, and gateway routing.
2. **Configuration-Driven Extensibility:** Completely eliminate hardcoded clearing rules, validation thresholds, gateway adapters, and message mappings. Changes are introduced via versioned configurations subject to Maker-Checker operational approval.
3. **Multi-Rail & Multi-Format Agility:** Native support for SWIFT ISO 20022 MX messages (`pacs.008`, `pacs.009`, `pacs.002`, `pacs.004`, `pacs.007`, `camt.053`, `camt.054`), domestic real-time clearing (ISSAC, IMPS, UPI), high-value RTGS, and batch ACH formats.
4. **Resilient Financial Integrity:** Sub-second processing latency, zero lost payment instructions, exact decimal precision, duplicate suppression within configurable windows, transactional outbox event publication, and strict distinction between technical gateway acknowledgements and beneficiary credit confirmations.

---

## 2. Ubiquitous Language & Core Terminology

| Term | Domain Definition |
| :--- | :--- |
| **Payment Instruction** | The original, immutable financial request received from an upstream Product Processor Application or manual operational maker. |
| **Canonical Payment Model (CPM)** | The standardized, normalized internal representation of a payment across all channels and formats within GPH. |
| **UETR** | Unique End-to-End Transaction Reference (RFC 4122 UUID v4) compliant with SWIFT CBPR+ standards, immutable throughout the payment lifecycle. |
| **End-to-End ID** | Business reference assigned by the initiating party, carried unchanged across all clearing legs. |
| **Standing Settlement Instruction (SSI)** | Authoritative settlement routing details (Nostro account, correspondent BIC, intermediary agent) retrieved dynamically from the Account Management System (AMC). |
| **Payment Control** | An independent, reusable pre-execution risk check (e.g. Sanctions screening, Large Payment check, Duplicate check, Credit limit validation). |
| **Dual-Blind Approval** | Four-eyes risk control where two designated checkers independently review and sign off on a payment without visibility into the other checker's decision until both submit. |
| **Technical Acknowledgement (ACK)** | Confirmation that a payment message was syntactically validated and accepted into a gateway or network queue. *Never represents settlement or beneficiary credit.* |
| **Settlement Confirmation** | Irrevocable debit/credit across Nostro/Vostro accounts or central bank clearing accounts. |
| **Credit Confirmation** | Explicit downstream confirmation (`pacs.002` ACCP or gateway callback) that funds have been credited to the ultimate beneficiary's account. |
| **Transactional Outbox** | An atomic database-backed event queue guaranteeing reliable, exactly-once downstream event delivery even during service crashes or network partitions. |
| **Payment Repair** | Controlled operational workbench permitting authorized modifications to defective fields of rejected or schema-invalid payments with mandatory audit tracking. |

---

## 3. Strategic Domain-Driven Design (DDD) & Bounded Contexts

GPH is architected using Domain-Driven Design (DDD) principles. The system is split into eight discrete Bounded Contexts, each with its own ubiquitous language, domain models, invariants, and repository boundaries.

```
+---------------------------------------------------------------------------------------------------+
|                                   GLOBAL PAYMENT HUB CONTEXT MAP                                  |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ Upstream Product Processors: GCMS, Trade, Treasury, Corporate Channels, Manual UI ]            |
|                                         |                                                         |
|                                         v (REST / Kafka / MQ / File)                              |
|  +-----------------------------+        |        +---------------------------------------------+  |
|  |   Ingestion Bounded Context |<-------+------->|   Payment Repair Bounded Context            |  |
|  |   - Inbound Schema Validator|                 |   - Exception Workbench                     |  |
|  |   - Idempotency & Hash Guard|                 |   - Field-Level Permitted Edit Engine       |  |
|  +--------------+--------------+                 +----------------------+----------------------+  |
|                 |                                                       ^                         |
|                 v                                                       |                         |
|  +--------------+-------------------------------------------------------+----------------------+  |
|  |                       Payment Processing Orchestration Bounded Context                      |  |
|  |   - 18-Step Finite State Machine (FSM)               - Distributed Saga Coordinator         |  |
|  |   - Canonical Data Model (CPM) Aggregates            - Immutable Audit Ledger               |  |
|  +-------+-----------------------------+-------------------------------+-----------------------+  |
|          |                             |                               |                          |
|          v                             v                               v                          |
|  +-------+--------------------+ +------+-----------------------+ +-----+-----------------------+  |
|  | Payment Controls Context   | | Transformation Context       | | Routing & Gateway Context   |  |
|  | - Sanctions Engine (OFAC)  | | - ISO 20022 Engine (MX)      | | - Dynamic Rail Selector     |  |
|  | - Duplicate Matcher        | | - ISSAC & Domestic Adapters  | | - Circuit Breaker & Failover|  |
|  | - Large Payment & Limits   | | - Canonical Field Mapper     | | - BOX & CitiSwitch Adapters |  |
|  | - Dual-Blind Approval Eng. | | - Syntax & Schema Validator  | | - Health Probers & Queues   |  |
|  +----------------------------+ +------------------------------+ +-------------+---------------+  |
|                                                                                |                  |
|                                                                                v                  |
|  +-----------------------------------------------------------------------------+---------------+  |
|  |                           Downstream Event Streaming Bounded Context                        |  |
|  |   - Transactional Outbox Pattern        - Guaranteed At-Least-Once / Exactly-Once Delivery  |  |
|  |   - Kafka Topic Publishers              - Dead-Letter Queue (DLQ) & Event Replay Engine     |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                         |                                                         |
|                                         v                                                         |
|  [ Downstream Consumers: Core GL, Reconciliation, Audit Ledger, Data Lake, Reg Reporting ]        |
+---------------------------------------------------------------------------------------------------+
```

---

## 3.1 High-Level Architecture Flow & Traversal Mechanics

The high-level architecture defines the end-to-end traversal lifecycle of a financial payment across five decoupled processing tiers:

1. **Tier 1: Upstream Ingress Channels**
   - Ingests payment orders from Product Processors (GCMS, Trade Finance, Treasury, Corporate Open Banking).
   - Establishes immutable request identity, cryptographic source signature validation, and raw payload storage.
2. **Tier 2: Ingestion, Validation & Normalization**
   - Enforces mandatory syntax, ISO 4217 currency checks, IBAN format verification, and assigns the SWIFT UETR (UUID v4).
   - Resolves Standing Settlement Instructions (SSI) via the Account Management Core (AMC).
3. **Tier 3: Pre-Execution Controls & Four-Eyes Governance**
   - Executes non-blocking pre-clearing controls: fuzzy Levenshtein sanctions screening (OFAC/EU/UN), 60-minute duplicate payment hash checks, and intraday credit line validation.
   - Dual-Blind 4-Eyes Governance: High-value transfers (≥ $2,000,000) mandate two independent checker signoffs where neither checker can observe the peer's review before quorum.
4. **Tier 4: Transformation, Dynamic Routing & Gateway Rails**
   - Transpiles the Canonical Payment Model into market-specific XML (`pacs.008`, `pacs.009`, `head.001`), ISSAC JSON, or ACH records.
   - Dynamic clearing matrix evaluates cut-off times and circuit breakers (`CLOSED`, `OPEN`, `HALF-OPEN`). If primary rail (SWIFT BOX) fails, automated failover routes to secondary rail (CitiSwitch) within 120ms without duplicate dispatch.
5. **Tier 5: Transactional Outbox & Downstream Event Distribution**
   - Atomically records state transitions and downstream events into the PostgreSQL Outbox table within a single ACID transaction.
   - Debezium CDC and Kafka publishers fan out normalized events to Core GL, Nostro/Vostro Recon, AML Data Lake, and Regulatory Reporting.

---

## 3.2 Complete System Level Architecture & Enterprise Infrastructure Topology

GPH is architected for Tier-0 mission-critical banking operations, guaranteeing **Zero Data Loss (RPO = 0)** and **Rapid Automated Failover (RTO < 30 seconds)**.

### 3.2.1 Eight Infrastructure & Functional Tiers

| Tier # | Tier Name | Tech Stack | Latency SLA | Key Domain Invariants |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | **Ingress & Ingestion Edge** | Envoy Proxy, Netty, Spring Cloud Gateway | < 15ms | TLS 1.3 mTLS termination, token-bucket rate limiting (5,000 req/s), WAF inspection, raw payload archival. |
| **Tier 2** | **Core Orchestration & Saga Engine** | Java 21 LTS Virtual Threads, gRPC, Saga FSM | < 30ms | Coordinates 18-step state machine, enforces state transition matrix, guarantees exact decimal precision. |
| **Tier 3** | **Pre-Execution Controls & Risk** | Redis Cluster 7.2, Lucene Token Matcher | < 45ms P99 | Fuzzy sanctions screening (OFAC/EU/UN), sliding 60-min duplicate hash prevention, dual-blind governance. |
| **Tier 4** | **SSI Enrichment & Reference Data** | Redis 7.2 Multi-AZ Replicas, Guava L1 Cache | < 15ms | Injects Nostro accounts, correspondent BICs, and currency clearing corridors; 24h fallback cache. |
| **Tier 5** | **Transformation & Market Standards** | FasterXML Woodstox Streaming XML, JAXB | < 20ms | Compiles ISO 20022 MX (`pacs.008`, `pacs.009`, `pacs.002`, `pacs.004`), ISSAC JSON v2.4, NACHA ACH. |
| **Tier 6** | **Gateway Routing & Connectivity** | Netty TCP, IBM MQ, REST HTTPS, Resilience4j | < 25ms | Multi-rail clearing switch, active-passive circuit breakers, automated failover between BOX and CitiSwitch. |
| **Tier 7** | **Persistence & Transactional Outbox** | PostgreSQL 16 Multi-AZ, Citus, Debezium CDC | RPO = 0 | Synchronously replicated ACID persistence, atomic outbox pattern, append-only cryptographic audit trail. |
| **Tier 8** | **Event Streaming & Observability** | Apache Kafka 3.6 (KRaft), OpenTelemetry | < 100ms E2E | Event streaming to Core GL, Recon, Data Lake; distributed trace span propagation and Prometheus metrics. |

### 3.2.2 Network Zones & Security Enclaves (Micro-Segmentation)

1. **External Ingress Zone (DMZ)**:
   - Houses edge load balancers, WAF, and API gateways.
   - Enforces mutual TLS 1.3 with client certificates signed by authorized banking CAs.
   - Zero direct route to Core Database or HSM tiers.
2. **Secure Core Processing Perimeter (Isolated Banking VPC)**:
   - Houses Orchestration FSM, CPM Normalizer, Sanctions Matcher, and Transformation Engine.
   - Operates in a private subnet with zero internet egress. Inter-service traffic runs on gRPC with SPIFFE/SPIRE cryptographic mutual identities.
3. **Enterprise Persistence & Vault Tier (Data Subnet)**:
   - Multi-AZ PostgreSQL primary and synchronous standby replica with automated Patroni failover.
   - All volumes encrypted at rest with Hardware Security Module (HSM) keys (AES-256).
   - Cryptographically sealed append-only audit ledger mirrored to WORM-compliant storage.
4. **Clearing Gateway DMZ**:
   - Houses SWIFT Alliance Gateway (SAG), dedicated leased-line connections, and Hardware Security Modules (HSM ME-500) for SWIFT PKI signing.
   - Dedicated circuit breakers per gateway isolating external network disruptions from internal core processing.

---

## 4. Microservices Architecture (28 Domain Services)

In alignment with Section 12.1 of the Master Development Prompt, GPH is decomposed into 28 microservices organized across domain boundaries:

```
+===================================================================================================+
|                                28 MICROSERVICES SPECIFICATION MATRIX                              |
+===================================================================================================+
| #  | Microservice Name               | Port | Primary Protocol | Bounded Context                  |
+----+---------------------------------+------+------------------+----------------------------------+
| 1  | Payment Instruction Service     | 8081 | REST / gRPC      | Ingestion & Intake               |
| 2  | Payment Ingestion Service       | 8082 | Kafka / MQ / REST| Ingestion & Intake               |
| 3  | Processing Orchestrator Service | 8083 | gRPC / Saga      | Orchestration Core               |
| 4  | Canonical Data Service          | 8084 | gRPC / Internal  | Core Payment Model               |
| 5  | Payment Validation Service      | 8085 | REST / gRPC      | Schema & Rules Validation        |
| 6  | Payment Controls Service        | 8086 | gRPC / REST      | Controls & Risk                  |
| 7  | Sanctions Screening Service     | 8087 | gRPC (High Perf) | Controls & Compliance            |
| 8  | Credit Check Service            | 8088 | REST / gRPC      | Controls & Liquidity             |
| 9  | Duplicate Detection Service     | 8089 | Redis / gRPC     | Controls & Risk                  |
| 10 | SSI Enrichment Service          | 8090 | REST / SOAP (AMC)| Account Management & SSI         |
| 11 | Payment Transformation Service  | 8091 | gRPC / High Thpt | Message Transformation           |
| 12 | Payment Routing Service         | 8092 | gRPC / Internal  | Gateway & Routing                |
| 13 | Gateway Connectivity Service    | 8093 | Netty / TCP / MQ | Gateway Infrastructure           |
| 14 | Gateway Adapter Service         | 8094 | Plug-in Adapters | Gateway Integrations             |
| 15 | Payment Status Service          | 8095 | REST / WebSocket | Lifecycle Management             |
| 16 | Credit Confirmation Service     | 8096 | MQ / Kafka / REST| Settlement & Confirmation        |
| 17 | Event Publishing Service        | 8097 | Kafka Outbox     | Downstream Event Streaming       |
| 18 | Downstream Integration Service  | 8098 | REST / Kafka     | External Egress Consumer         |
| 19 | Payment Operations Service      | 8099 | REST / JSON      | Operations Workbench             |
| 20 | Payment Repair Service          | 8100 | REST / JSON      | Exception Management             |
| 21 | Maker-Checker Workflow Service  | 8101 | REST / gRPC      | Governance & Approvals           |
| 22 | Pipeline Configuration Service  | 8102 | REST / JSON      | Configuration Engine             |
| 23 | Message Mapping Config Service  | 8103 | REST / JSON      | Configuration Engine             |
| 24 | Gateway Config Service          | 8104 | REST / JSON      | Configuration Engine             |
| 25 | Audit Service                   | 8105 | Append-Only Log  | Governance & Audit               |
| 26 | Reporting Service               | 8106 | REST / OLAP Sync | Analytics & BI                   |
| 27 | Notification Service            | 8107 | Webhook / SSE    | Communications                   |
| 28 | Identity & Access Mgmt Service  | 8108 | OAuth2 / OIDC    | Security & RBAC                  |
+===================================================================================================+
```

### 4.1 Detailed Service Responsibilities

#### 1. Payment Instruction Service
- **Responsibility:** Ingests external API payloads, assigns globally unique `Payment ID` (`GPH-YYYY-XXXXXX`), generates immutable `UETR` (UUID v4), preserves raw payload in immutable Object Storage.
- **Interfaces:** `POST /api/v1/instructions`, gRPC `SubmitInstruction()`.
- **Invariants:** Every payment must have non-null `Payment ID`, `UETR`, and raw cryptographic SHA-256 hash.

#### 2. Payment Ingestion Service
- **Responsibility:** Multi-protocol listener (Kafka consumers, IBM MQ queues, AS2, SFTP batch drops, REST webhooks). Enforces source authentication, mutual TLS (mTLS), and message rate-limiting.

#### 3. Payment Processing Orchestrator
- **Responsibility:** Master state coordinator. Implements the 18-step finite state machine (FSM). Coordinates distributed transactions using a non-blocking Saga choreography pattern. Enforces valid state transitions and rollback logic.

#### 4. Canonical Data Service
- **Responsibility:** Manages the Canonical Payment Model (CPM). Maps heterogeneous input formats into the internal domain representation and validates decimal precision and ISO standards.

#### 5. Payment Validation Service
- **Responsibility:** Validates mandatory schema rules, ISO 4217 currency validity, IBAN formatting, BIC character sets (SWIFT MT/MX compatible characters), positive decimal values, and value date validity.

#### 6. Payment Controls Service
- **Responsibility:** Coordinates pipeline control execution order. Evaluates rule thresholds, aggregates failure actions, and assigns appropriate lifecycle hold states (`ON_HOLD`, `REPAIR_REQUIRED`, `PENDING_APPROVAL`).

#### 7. Sanctions Screening Service
- **Responsibility:** Performs fuzzy screening of Debtor, Creditor, Debtor Agent, Creditor Agent, Intermediary Agents, and Remittance text against OFAC SDN, EU, UN Security Council, and UK HMT lists. Returns confidence scores and match classifications.

#### 8. Credit Check Service
- **Responsibility:** Integrates with Core Banking Credit Facility modules. Validates entity-level available limits, intraday limits, and currency-specific exposure before releasing payments.

#### 9. Duplicate Detection Service
- **Responsibility:** Uses Redis and PostgreSQL to detect duplicate payment instructions across sliding matching windows (e.g. 60 minutes) based on Debtor, Creditor, Amount, Currency, and Value Date hashes.

#### 10. Standing Settlement Instruction (SSI) Service
- **Responsibility:** Queries the Account Management System (AMC) to retrieve verified Nostro/Vostro accounts, correspondent BIC codes, and intermediary clearing paths. Validates effective date windows.

#### 11. Payment Transformation Service
- **Responsibility:** Converts Canonical Payment data into target financial message syntaxes: ISO 20022 XML (`pacs.008`, `pacs.009`, `pacs.002`, `pacs.004`), ISSAC domestic JSON, NACHA ACH fixed-width, and national RTGS formats. Validates XML against XSD schemas.

#### 12. Payment Routing Service
- **Responsibility:** Evaluates dynamic routing matrices considering currency, country, payment type, priority, clearing cut-off times, gateway health, and active circuit-breaker states. Implements automated failover.

#### 13. Gateway Connectivity Service
- **Responsibility:** Manages persistent network sessions to SWIFT Alliance Gateway (SAG), SWIFT BOX, CitiSwitch, ISSAC Hub, and domestic RTGS nodes. Manages queue depths, socket connections, and keep-alives.

#### 14. Gateway Adapter Service
- **Responsibility:** Provides pluggable protocol drivers (MQ, AS2, HTTPS/REST, SFTP, ISO 8583). Shields the core engine from gateway-specific transport idiosyncrasies.

#### 15. Payment Status Service
- **Responsibility:** Maintains the authoritative payment state history. Exposes WebSocket feeds and REST queries for real-time operations dashboards.

#### 16. Credit Confirmation Service
- **Responsibility:** Ingests inbound clearing messages (`pacs.002`, MT019/MT199, ISSAC ACK, return receipts). Formulates the distinct `CREDIT_CONFIRMED` event.

#### 17. Payment Event Publishing Service
- **Responsibility:** Implements the Transactional Outbox pattern. Guarantees that payment state transitions and downstream Kafka event emissions occur in a single atomic transaction.

#### 18. Downstream Integration Service
- **Responsibility:** Pushes enriched payment events to external consumers: General Ledger (GL), Intraday Nostro Reconciliation, Enterprise Data Lake, and Regulatory Reporting.

#### 19. Payment Operations Service
- **Responsibility:** Backend API powering the Operations UI: query filtering, multi-attribute indexing, aggregate metrics, queue volume calculations, and dashboard telemetry.

#### 20. Payment Repair Service
- **Responsibility:** Manages the repair lifecycle for defective payments. Enforces field-level edit permissions, validates edits, re-executes controls, and records immutable before/after audit diffs.

#### 21. Maker-Checker Workflow Service
- **Responsibility:** Orchestrates 4-eyes and dual-blind approvals. Validates user roles, approval limits, entity assignments, and enforces separation of duties (Makers cannot approve their own transactions).

#### 22. Pipeline Configuration Service
- **Responsibility:** Enables runtime management of payment pipelines, stage ordering, conditional branching, and versioning. Enforces Maker-Checker approval before pipeline activation.

#### 23. Message Mapping Configuration Service
- **Responsibility:** Manages source-to-canonical and canonical-to-target mapping templates, transformation expressions, character transliteration rules, and market practice presets.

#### 24. Gateway Configuration Service
- **Responsibility:** Manages gateway connectivity profiles, secure credentials references (Vault), operational schedules, cut-off times, timeouts, and circuit-breaker threshold parameters.

#### 25. Audit Service
- **Responsibility:** Writes append-only, tamper-evident audit records. Every human action, state transition, and outbound payload is cryptographically hashed and indexed by Trace ID.

#### 26. Reporting Service
- **Responsibility:** Computes analytics on multi-currency payment volumes, gateway latency distributions, control rejection rates, straight-through-processing (STP) ratios, and SLA compliance.

#### 27. Notification Service
- **Responsibility:** Dispatches operational alerts, email notifications, and webhook triggers for high-priority incidents, sanctions holds, circuit-breaker trips, and cut-off deadlines.

#### 28. Identity and Access Management (IAM) Service
- **Responsibility:** Enforces enterprise Role-Based Access Control (RBAC), OAuth2 / OpenID Connect tokens, session management, and fine-grained permission evaluation.

---

## 5. Canonical Payment Data Model (CPM)

The Canonical Payment Model is the internal standard representation used by all processing engines. It abstracts upstream channel protocols and downstream target clearing formats.

```
+---------------------------------------------------------------------------------------------------+
|                                  CANONICAL PAYMENT AGGREGATE ROOT                                 |
+---------------------------------------------------------------------------------------------------+
|  Identification & Tracking                                                                        |
|  - paymentId: String (PK, e.g., 'GPH-2026-000100')                                                |
|  - uetr: UUID (RFC 4122 v4)                                                                       |
|  - sourceTransactionId: String                                                                    |
|  - correlationId: String                                                                          |
|  - idempotencyKey: String                                                                         |
|                                                                                                   |
|  Intake Attributes                                                                                |
|  - sourceSystem: Enum ('GCMS', 'TRADE_PROCESSOR', 'TREASURY', 'LIQUIDITY_MGMT', 'CORP_PAY', ...)  |
|  - channel: Enum ('REST_API', 'KAFKA', 'MQ', 'FILE', 'EVENT', 'INTERNAL')                         |
|  - paymentType: Enum ('SWIFT_PACS_008', 'SWIFT_PACS_009', 'DOMESTIC_ISSAC', 'DOMESTIC_RTGS', ...) |
|  - paymentPriority: Enum ('NORMAL', 'HIGH', 'URGENT')                                             |
|                                                                                                   |
|  Financial Quantities & Dates                                                                     |
|  - currency: String (ISO 4217, 3-char)                                                            |
|  - amount: BigDecimal (Precision: 18, Scale: 4, Exact Arithmetic)                                 |
|  - valueDate: LocalDate                                                                           |
|  - bookingDate: LocalDate                                                                         |
|  - requestedExecutionDate: LocalDate                                                              |
|                                                                                                   |
|  Parties & Agents (ISO 20022 Structures)                                                          |
|  - debtor: Party (Entity Name, Account, Address, PostalCode, Country, TaxID/LEI)                  |
|  - debtorAgent: Agent (BICFI, ClearingRoutingNum, Name, Branch, Country)                          |
|  - creditor: Party (Entity Name, Account, Address, PostalCode, Country, TaxID/LEI)                |
|  - creditorAgent: Agent (BICFI, ClearingRoutingNum, Name, Branch, Country)                        |
|  - intermediaryAgent: Agent (Optional BICFI, Name, Country)                                       |
|                                                                                                   |
|  Settlement & Regulatory Details                                                                  |
|  - charges: Enum ('SHA', 'OUR', 'BEN')                                                            |
|  - paymentPurpose: String (ISO Purpose Code / Unstructured)                                       |
|  - remittanceInformation: String (Unstructured / Structured ISO 20022)                            |
|  - regulatoryReporting: String (Optional Central Bank Reporting Codes)                            |
|  - fxDetails: FXContract (SourceCcy, TargetCcy, ExchangeRate, ContractRef)                        |
|                                                                                                   |
|  Enrichment & State Invariants                                                                    |
|  - ssiReference: SSIRef (NostroAccount, CorrespondentBIC, IntermediaryBIC, Status, ExpiryDate)    |
|  - status: Enum ('RECEIVED', 'VALIDATED', 'ENRICHED', 'CONTROLS_PASSED', 'ON_HOLD',               |
|                  'REPAIR_REQUIRED', 'PENDING_APPROVAL', 'APPROVED', 'TRANSFORMED', 'ROUTED',      |
|                  'SUBMITTED', 'ACKNOWLEDGED', 'SETTLED', 'CREDIT_CONFIRMED', 'RETURNED', ...)     |
|  - controlResults: List<ControlResult>                                                            |
|  - holds: List<PaymentHold>                                                                       |
|  - approvalWorkflow: ApprovalState (Maker, Checker1, Checker2, DualBlindFlag)                     |
|  - transformedMessage: TransformedPayload (Format, Hash, RawXML/JSON, Timestamp)                  |
|  - gatewayRecord: GatewaySubmission (GatewayId, Reference, SubmissionTime, ACKTime, ConfTime)    |
|  - auditTrail: List<AuditRecordId>                                                                |
+---------------------------------------------------------------------------------------------------+
```

---

## 6. Complete Database Design & Normalized Relational Schemas

GPH enforces strict relational normalization, foreign key integrity, optimistic locking, and append-only audit structures. Below is the production DDL specification for the core PostgreSQL relational engine:

```sql
-- 1. Main Payment Instructions Table
CREATE TABLE gph_payment_instruction (
    payment_id VARCHAR(32) PRIMARY KEY,
    uetr UUID NOT NULL UNIQUE,
    source_transaction_id VARCHAR(64) NOT NULL,
    correlation_id VARCHAR(64) NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    source_system VARCHAR(32) NOT NULL,
    source_application VARCHAR(64) NOT NULL,
    channel VARCHAR(32) NOT NULL,
    payment_type VARCHAR(32) NOT NULL,
    payment_priority VARCHAR(16) NOT NULL DEFAULT 'NORMAL',
    
    currency CHAR(3) NOT NULL,
    amount NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
    value_date DATE NOT NULL,
    booking_date DATE NOT NULL,
    requested_execution_date DATE NOT NULL,
    
    debtor_entity_name VARCHAR(255) NOT NULL,
    debtor_account VARCHAR(64) NOT NULL,
    debtor_country CHAR(2) NOT NULL,
    debtor_address TEXT,
    debtor_agent_bic VARCHAR(11),
    debtor_agent_routing VARCHAR(32),
    debtor_agent_name VARCHAR(255),
    
    creditor_entity_name VARCHAR(255) NOT NULL,
    creditor_account VARCHAR(64) NOT NULL,
    creditor_country CHAR(2) NOT NULL,
    creditor_address TEXT,
    creditor_agent_bic VARCHAR(11),
    creditor_agent_routing VARCHAR(32),
    creditor_agent_name VARCHAR(255),
    
    charges VARCHAR(8) NOT NULL DEFAULT 'SHA',
    payment_purpose VARCHAR(255),
    remittance_information TEXT,
    regulatory_reporting VARCHAR(255),
    
    status VARCHAR(32) NOT NULL,
    pipeline_id VARCHAR(64),
    received_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INT NOT NULL DEFAULT 1
);

CREATE INDEX idx_gph_payment_uetr ON gph_payment_instruction(uetr);
CREATE INDEX idx_gph_payment_status ON gph_payment_instruction(status);
CREATE INDEX idx_gph_payment_received ON gph_payment_instruction(received_timestamp);
CREATE INDEX idx_gph_payment_source_tx ON gph_payment_instruction(source_transaction_id);
CREATE INDEX idx_gph_payment_debtor_acc ON gph_payment_instruction(debtor_account);
CREATE INDEX idx_gph_payment_creditor_acc ON gph_payment_instruction(creditor_account);

-- 2. Raw Inbound Message Payload Archive (Immutable)
CREATE TABLE gph_payment_raw_payload (
    payment_id VARCHAR(32) PRIMARY KEY REFERENCES gph_payment_instruction(payment_id),
    payload_format VARCHAR(32) NOT NULL,
    payload_content TEXT NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Standing Settlement Instructions (SSI) Reference Table
CREATE TABLE gph_ssi_reference (
    ssi_id VARCHAR(32) PRIMARY KEY,
    entity_id VARCHAR(128) NOT NULL,
    currency CHAR(3) NOT NULL,
    debtor_account VARCHAR(64) NOT NULL,
    creditor_account VARCHAR(64) NOT NULL,
    nostro_account VARCHAR(64) NOT NULL,
    correspondent_bic VARCHAR(11) NOT NULL,
    intermediary_bic VARCHAR(11),
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    effective_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    verified_by VARCHAR(64) NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Payment Controls Configuration Table
CREATE TABLE gph_control_config (
    control_id VARCHAR(32) PRIMARY KEY,
    control_name VARCHAR(128) NOT NULL,
    description TEXT,
    control_type VARCHAR(32) NOT NULL,
    execution_order INT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    failure_action VARCHAR(32) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    approval_required BOOLEAN NOT NULL DEFAULT TRUE,
    rule_definition JSONB NOT NULL,
    version INT NOT NULL DEFAULT 1,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Payment Control Executions Log Table
CREATE TABLE gph_control_execution (
    execution_id BIGSERIAL PRIMARY KEY,
    payment_id VARCHAR(32) NOT NULL REFERENCES gph_payment_instruction(payment_id),
    control_id VARCHAR(32) NOT NULL REFERENCES gph_control_config(control_id),
    passed BOOLEAN NOT NULL,
    severity VARCHAR(16) NOT NULL,
    failure_action VARCHAR(32) NOT NULL,
    result_message TEXT NOT NULL,
    details JSONB,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gph_ctrl_exec_pid ON gph_control_execution(payment_id);

-- 6. Payment Holds Management Table
CREATE TABLE gph_payment_hold (
    hold_id BIGSERIAL PRIMARY KEY,
    payment_id VARCHAR(32) NOT NULL REFERENCES gph_payment_instruction(payment_id),
    hold_reason VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    placed_by VARCHAR(64) NOT NULL,
    released_at TIMESTAMPTZ,
    released_by VARCHAR(64),
    release_notes TEXT
);

CREATE INDEX idx_gph_holds_pid_active ON gph_payment_hold(payment_id, is_active);

-- 7. Maker-Checker Approval Workflows Table
CREATE TABLE gph_payment_approval (
    approval_id BIGSERIAL PRIMARY KEY,
    payment_id VARCHAR(32) NOT NULL REFERENCES gph_payment_instruction(payment_id),
    required_level INT NOT NULL DEFAULT 1,
    is_dual_blind BOOLEAN NOT NULL DEFAULT FALSE,
    maker_user_id VARCHAR(64) NOT NULL,
    maker_user_name VARCHAR(128) NOT NULL,
    maker_submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    maker_comment TEXT,
    checker1_user_id VARCHAR(64),
    checker1_user_name VARCHAR(128),
    checker1_status VARCHAR(16) DEFAULT 'PENDING',
    checker1_action_at TIMESTAMPTZ,
    checker1_comment TEXT,
    checker2_user_id VARCHAR(64),
    checker2_user_name VARCHAR(128),
    checker2_status VARCHAR(16) DEFAULT 'PENDING',
    checker2_action_at TIMESTAMPTZ,
    checker2_comment TEXT
);

-- 8. Transformed Message Payload Archive Table
CREATE TABLE gph_transformed_message (
    message_id BIGSERIAL PRIMARY KEY,
    payment_id VARCHAR(32) NOT NULL REFERENCES gph_payment_instruction(payment_id),
    format VARCHAR(32) NOT NULL,
    schema_version VARCHAR(32) NOT NULL,
    raw_payload TEXT NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    validation_status VARCHAR(16) NOT NULL DEFAULT 'VALID',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Gateway Submission & Connectivity Table
CREATE TABLE gph_gateway_submission (
    submission_id BIGSERIAL PRIMARY KEY,
    payment_id VARCHAR(32) NOT NULL REFERENCES gph_payment_instruction(payment_id),
    gateway_id VARCHAR(32) NOT NULL,
    gateway_name VARCHAR(128) NOT NULL,
    gateway_reference VARCHAR(64) NOT NULL UNIQUE,
    submission_status VARCHAR(32) NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ack_received_at TIMESTAMPTZ,
    settlement_at TIMESTAMPTZ,
    credit_confirmed_at TIMESTAMPTZ,
    retry_count INT NOT NULL DEFAULT 0,
    error_code VARCHAR(32),
    error_message TEXT
);

-- 10. Transactional Outbox Downstream Events Table
CREATE TABLE gph_outbox_event (
    event_id VARCHAR(64) PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    payment_id VARCHAR(32) NOT NULL REFERENCES gph_payment_instruction(payment_id),
    correlation_id VARCHAR(64) NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_status VARCHAR(32) NOT NULL,
    payload JSONB NOT NULL,
    audit_trace_id VARCHAR(64) NOT NULL,
    delivery_status JSONB NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    retry_count INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_gph_outbox_pending ON gph_outbox_event(is_published) WHERE is_published = FALSE;

-- 11. Payment Repair History Table
CREATE TABLE gph_repair_audit (
    repair_id BIGSERIAL PRIMARY KEY,
    payment_id VARCHAR(32) NOT NULL REFERENCES gph_payment_instruction(payment_id),
    repaired_by VARCHAR(64) NOT NULL,
    repaired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fields_modified JSONB NOT NULL,
    repair_reason TEXT NOT NULL
);

-- 12. Immutable Ledger Audit Log Table
CREATE TABLE gph_audit_ledger (
    audit_id BIGSERIAL PRIMARY KEY,
    payment_id VARCHAR(32) NOT NULL,
    event_name VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(64) NOT NULL,
    service_name VARCHAR(64) NOT NULL,
    trace_id VARCHAR(64) NOT NULL,
    state_before VARCHAR(32),
    state_after VARCHAR(32),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 7. End-to-End 18-Step Processing Flow & Lifecycle State Machine

The GPH orchestrator executes payments through an authoritative, deterministic 18-step sequence. Invalid state jumps are strictly blocked by state machine invariants.

```
 [1. Ingest Instruction] 
           │
           ▼
 [2. Validate Source] ──(Fail)──► [REJECTED]
           │
           ▼
 [3. Validate Schema] ──(Fail)──► [REPAIR_REQUIRED] ◄──┐
           │                                          │ (Operations Repair)
           ▼                                          │
 [4. Normalize CPM]                                   │
           │                                          │
           ▼                                          │
 [5. Enrich Payment]                                  │
           │                                          │
           ▼                                          │
 [6. Retrieve AMC SSI]                                │
           │                                          │
           ▼                                          │
 [7. Apply Controls]  ──(Defect)──────────────────────┘
           │
           ├──(Sanctions / Duplicate Match)──► [ON_HOLD]
           │                                       │ (Compliance Release)
           ▼                                       ▼
 [8. Risk Assessment]                        [APPROVED]
           │                                       │
           ├──(High Value > Threshold)──► [PENDING_APPROVAL]
           │                                  │ (Dual-Blind Signoff)
           ▼                                  ▼
 [9. Determine Route] ────────────────► [TRANSFORMED]
           │
           ▼
 [10. Determine Format]
           │
           ▼
 [11. Transform Message (ISO MX / Domestic)]
           │
           ▼
 [12. Apply Maker-Checker (If pending)]
           │
           ▼
 [13. Submit to Gateway (BOX, CitiSwitch, ISSAC)] ──► [SUBMITTED]
           │
           ▼
 [14. Receive Gateway Technical ACK] ───────────────► [ACKNOWLEDGED]
           │
           ▼
 [15. Settle & Receive Credit Confirmation] ────────► [SETTLED] ──► [CREDIT_CONFIRMED]
           │
           ▼
 [16. Update Payment Lifecycle Status]
           │
           ▼
 [17. Publish Outbox Events to Downstream]
           │
           ▼
 [18. Generate Cryptographic Audit Records]
```

### 7.1 Detailed Step-by-Step Specification

| Step | Operation Name | Processing Logic | Exit State | Failure Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Receive Payment Instruction** | Ingest payload from REST API, Kafka, or MQ; generate `Payment ID` (`GPH-YYYY-XXXX`) and immutable `UETR`; archive raw payload into storage; check idempotency hash. | `RECEIVED` | If duplicate message key received with identical hash, return existing payment record without re-execution. |
| **2** | **Validate Source System** | Authenticate source application credentials, verify mutual TLS certificate, check API tenant authorization against allowed channels. | `RECEIVED` | Reject with HTTP 401/403; emit security telemetry alert. |
| **3** | **Validate Payment Schema** | Validate presence of mandatory fields (Debtor, Creditor, Amount > 0, Currency ISO 4217, Value Date); check account formatting and character constraints. | `VALIDATED` | Transition to `REPAIR_REQUIRED`; record field-level validation errors; notify Operations Repair Workbench. |
| **4** | **Normalize Payment Data** | Map heterogeneous source format into Canonical Payment Model (CPM); normalize dates to UTC ISO 8601; enforce exact decimal representation. | `VALIDATED` | Transition to `REPAIR_REQUIRED` if conversion fails. |
| **5** | **Enrich Payment Data** | Apply internal entity hierarchy, business unit codes, booking ledger entities, and tax/LEI identification. | `ENRICHED` | Continue with standard defaults if secondary metadata is absent. |
| **6** | **Retrieve SSI Information** | Call Account Management System (AMC) to retrieve Standing Settlement Instructions (Nostro accounts, correspondent bank BICs, intermediary routing). | `ENRICHED` | If mandatory SSI is missing or expired, mark `REPAIR_REQUIRED` for operational assignment. |
| **7** | **Apply Payment Controls** | Execute configured pre-execution controls in sequence: Mandatory Validation, Large Payment Check, Sanctions Screening, Duplicate Detection, Credit Limit check. | `CONTROLS_PASSED` / `ON_HOLD` / `REPAIR_REQUIRED` | If Sanctions match detected, immediately place on `ON_HOLD (SANCTIONS)`. If Duplicate detected, place on `ON_HOLD (DUPLICATE)`. |
| **8** | **Perform Risk Assessment** | Evaluate aggregated transaction risk, check velocity rules, assess high-risk beneficiary jurisdictions, verify holiday calendar and clearing cut-off times. | `CONTROLS_PASSED` | If cut-off exceeded, queue for next clearing value date or trigger operational alert. |
| **9** | **Determine Payment Route** | Dynamic routing engine selects primary clearing gateway based on currency, amount, payment type, country, cut-off time, and gateway availability. | `ROUTED` | If primary gateway is OFFLINE or circuit breaker is OPEN, auto-failover to configured secondary gateway. |
| **10** | **Determine Message Format** | Match target clearing rail to required financial syntax (e.g. SWIFT customer credit $\rightarrow$ `pacs.008.001.10`, FI treasury $\rightarrow$ `pacs.009.001.10`, ISSAC $\rightarrow$ ISSAC JSON, domestic US $\rightarrow$ ACH). | `ROUTED` | Fallback to standard pacs.008 if undefined. |
| **11** | **Transform Payment Message** | Generate financial message payload (XML / JSON / Fixed-width); apply XML character escaping; compute SHA-256 hash; validate against official ISO XSD schema. | `TRANSFORMED` | Transition to `REPAIR_REQUIRED` if schema validation fails. |
| **12** | **Apply Maker-Checker Approval** | If payment amount exceeds threshold ($1M+) or manual/repair action was executed, route to Maker-Checker Workbench. If exceeding $2M+, mandate Dual-Blind approval. | `PENDING_APPROVAL` $\rightarrow$ `APPROVED` | Maker cannot approve. Payment remains blocked until required Checker(s) sign off. |
| **13** | **Submit Payment to Gateway** | Deliver transformed message to selected gateway queue (SWIFT BOX, CitiSwitch, ISSAC, RTGS); assign unique `Gateway Reference`; start ACK timeout timer. | `SUBMITTED` | Retry up to configured limits. If retry fails, trigger failover routing or place in Gateway Error queue. |
| **14** | **Receive Gateway ACK** | Process technical acknowledgement from clearing gateway. Record ACK timestamp and network transmission confirmation. | `ACKNOWLEDGED` | If technical NACK received, transition to `REJECTED` or queue for operational investigation. |
| **15** | **Receive Credit Confirmation** | Ingest clearing status reports (`pacs.002`, MT019, ISSAC settlement callback). Differentiate between clearing settlement and final beneficiary credit. | `SETTLED` $\rightarrow$ `CREDIT_CONFIRMED` | If payment return (`pacs.004`) received, transition to `RETURNED`. |
| **16** | **Update Payment Lifecycle** | Update authoritative database record, update Redis caching layer, refresh operational dashboard views via WebSockets. | `CREDIT_CONFIRMED` | Optimistic locking prevents race conditions. |
| **17** | **Publish Payment Events** | Write lifecycle event record to Transactional Outbox table; outbox relay publishes to Kafka topics for General Ledger, Reconciliation, Audit, and Data Lake. | `CREDIT_CONFIRMED` | Outbox guarantees at-least-once delivery; consumers implement idempotency keys. |
| **18** | **Generate Audit Records** | Append tamper-evident audit record with actor, timestamp, trace ID, before/after states, and cryptographic signature to immutable ledger. | `CREDIT_CONFIRMED` | Append-only store prevents modification or deletion. |

---

## 8. Payment Controls Framework & Risk Rules

Every payment control in GPH is an independent, versioned, configurable rule executed by the Controls Service. Control modifications require Maker-Checker signoff before activation.

### 8.1 Control Rule Matrix

```
+===================================================================================================+
|                                    PAYMENT CONTROLS SPECIFICATION                                 |
+===================================================================================================+
| Control ID | Control Name              | Trigger Condition           | Failure Action | Severity  |
+------------+---------------------------+-----------------------------+----------------+-----------+
| CTRL-001   | Mandatory Field Validation| Missing account/ccy/amount  | SEND_TO_REPAIR | CRITICAL  |
| CTRL-002   | Large Payment Threshold   | Amount >= USD 1,000,000     | REQUIRE_APPR   | HIGH      |
| CTRL-003   | Global Sanctions (OFAC)   | Fuzzy match >= 80% on list  | HOLD           | CRITICAL  |
| CTRL-004   | Duplicate Detection       | Identical Tx within 60 min  | HOLD           | HIGH      |
| CTRL-005   | Credit Limit Check        | Amount > Available Facility | REQUIRE_APPR   | HIGH      |
| CTRL-006   | Dual-Blind Risk Control   | Amount >= USD 2,000,000     | REQUIRE_APPR   | HIGH      |
| CTRL-007   | Cut-off Time Check        | Timestamp > Gateway Cut-off | QUEUE_NEXT_DAY | WARNING   |
+===================================================================================================+
```

### 8.2 Sanctions Screening Architecture
- **Lists Screened:** OFAC Specially Designated Nationals (SDN), EU Consolidated Sanctions, UN Security Council Sanctions List, UK HM Treasury (HMT).
- **Target Attributes:** Debtor Name, Debtor Address, Creditor Name, Creditor Address, Debtor Agent BIC/Name, Creditor Agent BIC/Name, Intermediary BIC, Remittance Information.
- **Scoring Algorithm:** Normalized Levenshtein distance combined with bigram token overlap.
  - Score $\ge 95\%$: Confirmed Match $\rightarrow$ Automatic Hold.
  - $80\% \le \text{Score} < 95\%$: Potential Match $\rightarrow$ Escalated to Compliance Workbench.
  - Score $< 80\%$: Cleared $\rightarrow$ Execution continues.
- **Compliance Hold Release Invariant:** A sanctions hold can **only** be released by an authenticated user with `COMPLIANCE_OFFICER` role, accompanied by mandatory rationale notes and recorded in the immutable audit ledger.

### 8.3 Duplicate Payment Prevention Engine
- **Matching Window:** Configurable per pipeline (default: 60 minutes).
- **Matching Hash Key:**
  $$\text{Hash} = \text{SHA256}(\text{DebtorAccount} \parallel \text{CreditorAccount} \parallel \text{Currency} \parallel \text{Amount} \parallel \text{ValueDate})$$
- If an incoming payment generates a duplicate hash matching an active payment in the sliding window, or matches the upstream `Source Transaction ID`, it is immediately halted on `DUPLICATE_SUSPECT` hold to protect against double-debiting.

### 8.4 Dual-Blind Approval Mechanics
- **First Checker:** Reviews payment details without seeing any recommendation, vote, or notes from other checkers. Submits `APPROVE` or `REJECT`.
- **Second Checker:** Independently reviews the transaction in a sanitized workbench. Cannot see First Checker's identity or decision until their own vote is submitted.
- **Release Condition:** Both Checkers must record independent `APPROVE` votes. The original Maker is strictly prohibited from participating in either checker role.

---

## 9. ISO 20022 & Domestic Message Transformation Framework

GPH supports transformation from the Canonical Payment Model into international and domestic messaging standards:

### 9.1 Supported ISO 20022 Messages
1. **`pacs.008.001.10`:** Financial Institution to Financial Institution Customer Credit Transfer. Fully compliant with SWIFT CBPR+ guidelines, including Business Application Header (`head.001.001.03`), Group Header (`GrpHdr`), Credit Transfer Transaction Information (`CdtTrfTxInf`), and Settlement Information (`SttlmInf`).
2. **`pacs.009.001.10`:** Financial Institution Credit Transfer. Used for interbank treasury liquidity transfers and cover payments (`pacs.009 COV`).
3. **`pacs.002.001.12`:** Payment Status Report. Used for processing inbound gateway ACK/NACK and credit confirmations (`ACCP`, `RJCT`, `PDNG`).
4. **`pacs.004.001.11`:** Payment Return. Formulates automated return of unapplied or recalled customer funds.
5. **`camt.053.001.10`:** Bank-to-Customer Statement. End-of-day account balance and transaction posting statements.
6. **`camt.054.001.10`:** Bank-to-Customer Debit/Credit Notification. Real-time posting advisories for corporate treasury accounts.

### 9.2 Domestic Clearing Formats
- **ISSAC:** JSON-based real-time domestic clearing format for immediate settlement networks.
- **RTGS:** XML/MQ payload formatted for high-value national central bank gross settlement systems.
- **NACHA ACH:** Fixed-width 94-character record format (File Header 1, Batch Header 5, Entry Detail 6 [CCD/PPD], Batch Control 8, File Control 9).

---

## 10. Gateway Integration Framework & Resilience Patterns

The Gateway Integration Framework communicates with clearing rails via pluggable adapters:

```
+---------------------------------------------------------------------------------------------------+
|                                GATEWAY ADAPTER ROUTING ARCHITECTURE                               |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|                               +-------------------------------+                                   |
|                               |     Dynamic Routing Engine    |                                   |
|                               +---------------+---------------+                                   |
|                                               |                                                   |
|                +------------------------------+------------------------------+                    |
|                |                              |                              |                    |
|                v                              v                              v                    |
|  +---------------------------+  +---------------------------+  +---------------------------+      |
|  |     SWIFT BOX Gateway     |  |   CitiSwitch SWIFT Rail   |  |   ISSAC Domestic Clearing |      |
|  | - Protocol: IBM MQ        |  | - Protocol: REST / HTTPS  |  | - Protocol: REST / JSON   |      |
|  | - Cut-off: 21:00 UTC      |  | - Cut-off: 22:30 UTC      |  | - 24/7/365 Real-Time      |      |
|  | - Circuit Breaker: CLOSED |  | - Circuit Breaker: CLOSED |  | - Circuit Breaker: CLOSED |      |
|  +-------------+-------------+  +-------------+-------------+  +-------------+-------------+      |
|                |                              ^                              |                    |
|                | (Trip: CB OPEN)              |                              |                    |
|                +====== Automated Failover ====+                              |                    |
|                                                                              v                    |
|                                                                 +---------------------------+     |
|                                                                 | National RTGS / ACH Rails |     |
|                                                                 | - Cut-off: 18:00 UTC      |     |
|                                                                 +---------------------------+     |
+---------------------------------------------------------------------------------------------------+
```

### 10.1 Circuit Breaker Implementation
- **Closed State:** Normal traffic routed to primary gateway.
- **Open State:** If gateway returns 3 consecutive connection timeouts or 503 errors within 30 seconds, circuit breaker trips to `OPEN`.
- **Failover Action:** Payments automatically bypass primary gateway and route to configured secondary gateway (e.g. SWIFT BOX $\rightarrow$ CitiSwitch) without manual intervention or duplicate risk.
- **Half-Open Probe:** After 60 seconds in `OPEN` state, a canary health probe is dispatched. If successful, state resets to `CLOSED`.

### 10.2 Strict Distinction of Lifecycle Milestones
- **`SUBMITTED`:** Message delivered to gateway transport buffer.
- **`ACKNOWLEDGED`:** Gateway technical validation passed. Funds are **not** yet settled or credited.
- **`SETTLED`:** Interbank Nostro/Clearing account debited/credited.
- **`CREDIT_CONFIRMED`:** Beneficiary account credited. Irrevocable completion.

---

## 11. Transactional Outbox Pattern & Downstream Event Publication

GPH employs the **Transactional Outbox Pattern** to prevent dual-write vulnerabilities between the relational database and the distributed event stream:

```
[Payment Processing Transaction]
   │
   ├── 1. Write Payment State Update (e.g., status = 'CREDIT_CONFIRMED')
   ├── 2. Insert Outbox Event Record into 'gph_outbox_event' Table
   │
   ▼ (Single Atomic Database Commit)
[PostgreSQL Database Engine]
   │
   ▼ (CDC / Transactional Poller)
[Outbox Relay Service]
   │
   ├── Publish Event with Partition Key = 'paymentId'
   │
   ▼
[Apache Kafka Cluster]
   ├── Topic: payment.events.v1
   ├── Topic: accounting.gl.postings.v1
   ├── Topic: nostro.reconciliation.v1
   └── Topic: regulatory.audit.v1
```

### 11.1 Guaranteed Delivery Guarantees
- **At-Least-Once Delivery:** Events are preserved in the outbox until an explicit Kafka ACK is received.
- **Idempotent Consumers:** All downstream event payloads include `eventId`, `paymentId`, and `eventTimestamp` so consumers suppress duplicate processing.
- **Dead-Letter Queue (DLQ):** Unparseable or failing downstream messages are isolated in a DLQ topic with automated retry alerts and manual replay capabilities.

---

## 12. Non-Functional Architecture & Financial Governance

### 12.1 Exact Decimal Precision
- **Strict Invariant:** All currency arithmetic is performed using high-precision decimal representation (`BigDecimal`, Precision 18, Scale 4). Floating-point primitive types (`float`, `double`) are strictly prohibited in financial calculation paths to eliminate rounding errors.

### 12.2 Immutable Audit Ledger
- **No Physical Deletions:** In accordance with Section 13 of the Master Prompt, financial payment records, instructions, control execution logs, and audit entries are **never physically deleted** through operational workflows.
- Every state change records `Actor`, `Role`, `Timestamp`, `TraceId`, `StateBefore`, and `StateAfter`.

### 12.3 High Throughput & Scalability
- **Horizontal Scaling:** Stateless microservices deployed on Kubernetes pods with autoscaling based on queue depth and CPU utilization.
- **Distributed Caching:** Redis Cluster stores deduplication hashes, active session tokens, and gateway connectivity states with sub-millisecond retrieval.
- **Database Partitioning:** Monthly table partitioning on `gph_payment_instruction` by `received_timestamp` ensures query performance remains constant even with hundreds of millions of historical payment records.

---

*End of Domain Design Document — Approved for Global Banking Implementation.*
