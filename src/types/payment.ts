// Global Payment Hub - Domain Model & Type Definitions

export type SourceSystemId = 
  | 'GCMS' 
  | 'TRADE_PROCESSOR' 
  | 'TREASURY' 
  | 'LIQUIDITY_MGMT' 
  | 'CORP_PAY' 
  | 'MANUAL_UI' 
  | 'EXT_BANKING';

export type IngestionChannel = 'REST_API' | 'KAFKA' | 'MQ' | 'FILE' | 'EVENT' | 'INTERNAL';

export type PaymentType = 
  | 'SWIFT_PACS_008' // FI-to-FI Customer Credit Transfer
  | 'SWIFT_PACS_009' // FI-to-FI Financial Institution Credit Transfer
  | 'DOMESTIC_ISSAC' // ISSAC Domestic Clearing
  | 'DOMESTIC_RTGS'  // Real-Time Gross Settlement
  | 'DOMESTIC_NEFT'  // National Electronic Funds Transfer
  | 'DOMESTIC_IMPS'  // Immediate Payment Service
  | 'DOMESTIC_UPI'   // Unified Payments Interface
  | 'DOMESTIC_ACH';  // Automated Clearing House

export type PaymentPriority = 'HIGH' | 'NORMAL' | 'URGENT';

export type PaymentStatus = 
  | 'RECEIVED'
  | 'VALIDATED'
  | 'ENRICHED'
  | 'CONTROLS_PASSED'
  | 'ON_HOLD'
  | 'REPAIR_REQUIRED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'TRANSFORMED'
  | 'ROUTED'
  | 'SUBMITTED'
  | 'ACKNOWLEDGED'
  | 'SETTLED'
  | 'CREDIT_CONFIRMED'
  | 'RETURNED'
  | 'CANCELLED';

export type HoldReason = 
  | 'SANCTIONS_POTENTIAL_MATCH'
  | 'SANCTIONS_CONFIRMED_MATCH'
  | 'LARGE_PAYMENT_THRESHOLD'
  | 'DUPLICATE_SUSPECT'
  | 'CREDIT_LIMIT_EXCEEDED'
  | 'CUT_OFF_EXCEEDED'
  | 'DUAL_BLIND_PENDING';

export interface CurrencyAmount {
  currency: string;
  amount: number;
}

export interface AgentParty {
  bic?: string;
  routingNumber?: string;
  name: string;
  country: string;
  account?: string;
  address?: string;
}

export interface PaymentParty {
  entityName: string;
  accountNumber: string;
  address?: string;
  country: string;
  identificationId?: string; // Tax ID / LEI
}

export interface FXInformation {
  required: boolean;
  sourceCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  contractReference?: string;
}

export interface StandingSettlementInstruction {
  id: string;
  entityId: string;
  currency: string;
  debtorAccount: string;
  creditorAccount: string;
  nostroAccount: string;
  correspondentBic: string;
  intermediaryBic?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING_UPDATE';
  effectiveDate: string;
  expiryDate: string;
  verifiedBy: string;
}

export interface ControlExecutionResult {
  controlId: string;
  controlName: string;
  passed: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING';
  failureAction: 'REJECT' | 'HOLD' | 'SEND_TO_REPAIR' | 'REQUIRE_APPROVAL' | 'RETRY' | 'WARNING';
  message: string;
  executedAt: string;
  details?: Record<string, any>;
}

export interface SanctionsMatch {
  matchedEntity: string;
  listName: 'OFAC_SDN' | 'EU_SANCTIONS' | 'UN_SECURITY_COUNCIL' | 'UK_HMT';
  matchedField: 'creditor' | 'debtor' | 'creditorAgent' | 'intermediary';
  matchScore: number; // 0 to 100
  status: 'POTENTIAL_MATCH' | 'CONFIRMED_MATCH' | 'FALSE_POSITIVE' | 'RELEASED';
  complianceNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface MakerCheckerApproval {
  requiredLevel: 1 | 2; // 1 = Single checker, 2 = Dual-blind
  dualBlind: boolean;
  maker: {
    userId: string;
    userName: string;
    timestamp: string;
    comment?: string;
  };
  checker1?: {
    userId: string;
    userName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    timestamp?: string;
    comment?: string;
  };
  checker2?: {
    userId: string;
    userName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    timestamp?: string;
    comment?: string;
  };
}

export interface TransformedMessage {
  format: 'ISO20022_PACS_008' | 'ISO20022_PACS_009' | 'ISSAC_DOMESTIC' | 'ACH_FIXED_WIDTH' | 'RTGS_PAYLOAD';
  schemaVersion: string;
  rawPayload: string;
  generatedTimestamp: string;
  hash: string;
  validationStatus: 'VALID' | 'SCHEMA_ERROR';
}

export interface GatewaySubmissionRecord {
  gatewayId: string;
  gatewayName: string;
  submissionTimestamp: string;
  gatewayReference: string;
  responseStatus: 'ACK' | 'NACK' | 'PENDING' | 'TIMEOUT' | 'CREDIT_CONFIRMED';
  ackTimestamp?: string;
  settlementTimestamp?: string;
  creditConfirmationTimestamp?: string;
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
}

export interface PaymentInstruction {
  paymentId: string; // e.g. GPH-2026-0001
  uetr: string; // UUID v4 format
  sourceTransactionId: string;
  correlationId: string;
  idempotencyKey: string;
  sourceSystem: SourceSystemId;
  sourceApplication: string;
  channel: IngestionChannel;
  paymentType: PaymentType;
  paymentPriority: PaymentPriority;
  
  // Amounts & Dates
  currency: string;
  amount: number;
  valueDate: string;
  bookingDate: string;
  requestedExecutionDate: string;

  // Parties
  debtor: PaymentParty;
  creditor: PaymentParty;
  debtorAgent: AgentParty;
  creditorAgent: AgentParty;
  intermediaryAgent?: AgentParty;

  // Settlement & Remittance
  paymentPurpose: string;
  remittanceInformation: string;
  charges: 'OUR' | 'SHA' | 'BEN';
  regulatoryReporting?: string;
  fxInfo?: FXInformation;

  // Lifecycle & Metadata
  status: PaymentStatus;
  receivedTimestamp: string;
  lastUpdatedTimestamp: string;
  originalPayloadJson: string;

  // Enrichment & Control outcomes
  ssiReference?: StandingSettlementInstruction;
  controlResults: ControlExecutionResult[];
  sanctionsResult?: SanctionsMatch;
  holds: {
    reason: HoldReason;
    active: boolean;
    placedAt: string;
    releasedAt?: string;
    releasedBy?: string;
    notes?: string;
  }[];

  // Approvals
  approvalWorkflow?: MakerCheckerApproval;

  // Transformation & Routing
  assignedPipelineId?: string;
  transformedMessage?: TransformedMessage;
  gatewayRecord?: GatewaySubmissionRecord;

  // Repair history
  repairHistory?: {
    repairedBy: string;
    repairedAt: string;
    fieldsChanged: Record<string, { before: any; after: any }>;
    reason: string;
  }[];

  // Audit event log ids
  publishedEventIds: string[];
}

export interface PaymentEvent {
  eventId: string;
  eventType: 
    | 'PaymentInstructionReceived'
    | 'PaymentValidated'
    | 'PaymentEnriched'
    | 'PaymentControlPassed'
    | 'PaymentControlFailed'
    | 'PaymentHeld'
    | 'PaymentApproved'
    | 'PaymentRejected'
    | 'PaymentTransformed'
    | 'PaymentRouted'
    | 'PaymentSubmitted'
    | 'PaymentAcknowledged'
    | 'PaymentSettled'
    | 'PaymentCreditConfirmed'
    | 'PaymentReturned'
    | 'PaymentCancelled'
    | 'PaymentRepaired';
  paymentId: string;
  uetr: string;
  sourceSystem: SourceSystemId;
  correlationId: string;
  eventTimestamp: string;
  paymentStatus: PaymentStatus;
  paymentAmount: number;
  currency: string;
  debtorEntity: string;
  creditorEntity: string;
  gateway?: string;
  gatewayReference?: string;
  eventVersion: string;
  payload: Record<string, any>;
  auditMetadata: {
    nodeId: string;
    serviceName: string;
    actor: string;
    traceId: string;
  };
  deliveryStatus: {
    target: 'AUDIT_APP' | 'ACCOUNTING_GL' | 'RECONCILIATION' | 'DATA_LAKE' | 'REGULATORY_REPORTING';
    status: 'DELIVERED' | 'QUEUED' | 'RETRY' | 'FAILED';
    timestamp?: string;
  }[];
}

export interface PipelineStageConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  order: number;
  config: Record<string, any>;
}

export interface PaymentPipeline {
  id: string;
  name: string;
  description: string;
  version: number;
  status: 'ACTIVE' | 'DRAFT' | 'PENDING_APPROVAL' | 'RETIRED';
  sourceSystem: SourceSystemId;
  channel: IngestionChannel;
  supportedPaymentTypes: PaymentType[];
  applicableEntities: string[];
  stages: PipelineStageConfig[];
  effectiveDate: string;
  expiryDate?: string;
  lastUpdatedBy: string;
  approvedBy?: string;
}

export interface PaymentControlConfig {
  id: string;
  name: string;
  description: string;
  type: 'MANDATORY_VALIDATION' | 'LARGE_PAYMENT' | 'SANCTIONS' | 'CREDIT_CHECK' | 'DUPLICATE_CHECK' | 'DUAL_BLIND' | 'CUT_OFF_TIME' | 'HOLIDAY_CALENDAR';
  executionOrder: number;
  enabled: boolean;
  applicablePaymentTypes: PaymentType[];
  applicableCurrencies: string[];
  applicableEntities: string[];
  failureAction: 'REJECT' | 'HOLD' | 'SEND_TO_REPAIR' | 'REQUIRE_APPROVAL' | 'RETRY' | 'WARNING';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING';
  approvalRequiredToModify: boolean;
  rules: Record<string, any>;
  version: number;
  status: 'ACTIVE' | 'PENDING_APPROVAL';
}

export interface GatewayAdapterConfig {
  id: string;
  name: string;
  type: 'SWIFT_BOX' | 'SWIFT_CITISWITCH' | 'DOMESTIC_ISSAC' | 'DOMESTIC_RTGS' | 'DOMESTIC_ACH';
  protocol: 'MQ' | 'REST_HTTPS' | 'AS2' | 'SFTP';
  endpoint: string;
  supportedCurrencies: string[];
  supportedPaymentTypes: PaymentType[];
  status: 'ONLINE' | 'DEGRADED' | 'MAINTENANCE' | 'OFFLINE';
  circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  cutOffTimeUtc: string; // e.g. "17:00:00"
  timeoutMs: number;
  maxRetries: number;
  activeQueueDepth: number;
}

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: 'OPERATIONS_MAKER' | 'OPERATIONS_CHECKER' | 'COMPLIANCE_OFFICER' | 'SYSTEM_ADMIN' | 'AUDITOR';
  assignedEntities: string[];
}
