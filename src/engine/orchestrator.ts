// Payment Processing Orchestrator & State Machine Engine

import { 
  PaymentInstruction, 
  PaymentStatus, 
  PaymentEvent, 
  StandingSettlementInstruction,
  GatewayAdapterConfig,
  UserSession 
} from '../types/payment';
import { validatePaymentSchema } from './validation';
import { evaluatePaymentControls } from './controls';
import { transformPayment } from './transformations';
import { determinePaymentRoute, INITIAL_GATEWAY_CONFIGS } from './routing';

// Mock Account Management System (AMC) SSI Database
export const AMC_SSI_DIRECTORY: Record<string, StandingSettlementInstruction> = {
  'ACC-US-100234': {
    id: 'SSI-AMC-9001',
    entityId: 'ACME CORP GLOBAL',
    currency: 'USD',
    debtorAccount: 'ACC-US-100234',
    creditorAccount: 'ACC-UK-883921',
    nostroAccount: 'NOSTRO-USD-CITI-01',
    correspondentBic: 'CITIUS33XXX',
    intermediaryBic: 'CHASUS33XXX',
    status: 'ACTIVE',
    effectiveDate: '2025-01-01',
    expiryDate: '2028-12-31',
    verifiedBy: 'AMC_SETTLEMENT_SYSTEM',
  },
  'ACC-SG-500122': {
    id: 'SSI-AMC-9002',
    entityId: 'VERTEX TRADING PTE',
    currency: 'SGD',
    debtorAccount: 'ACC-SG-500122',
    creditorAccount: 'ACC-JP-772911',
    nostroAccount: 'NOSTRO-SGD-DBS-02',
    correspondentBic: 'DBSSSGSGXXX',
    status: 'ACTIVE',
    effectiveDate: '2025-06-01',
    expiryDate: '2027-12-31',
    verifiedBy: 'AMC_SETTLEMENT_SYSTEM',
  },
  'ACC-EU-330198': {
    id: 'SSI-AMC-9003',
    entityId: 'NORDIC ENERGY AS',
    currency: 'EUR',
    debtorAccount: 'ACC-EU-330198',
    creditorAccount: 'ACC-DE-449102',
    nostroAccount: 'NOSTRO-EUR-DEUT-01',
    correspondentBic: 'DEUTDEFFXXX',
    status: 'ACTIVE',
    effectiveDate: '2024-01-01',
    expiryDate: '2029-01-01',
    verifiedBy: 'AMC_SETTLEMENT_SYSTEM',
  },
};

export function retrieveSsiFromAmc(accountNumber: string): StandingSettlementInstruction | null {
  if (AMC_SSI_DIRECTORY[accountNumber]) {
    return AMC_SSI_DIRECTORY[accountNumber];
  }
  // Fallback auto-generated SSI for unmapped account in test mode
  return {
    id: `SSI-AMC-AUTO-${accountNumber.slice(-4)}`,
    entityId: 'STANDARD_SETTLEMENT_ENTITY',
    currency: 'USD',
    debtorAccount: accountNumber,
    creditorAccount: 'DEFAULT_SETTLEMENT_ACCOUNT',
    nostroAccount: 'NOSTRO-DEFAULT-CITI-01',
    correspondentBic: 'CITIUS33XXX',
    status: 'ACTIVE',
    effectiveDate: '2026-01-01',
    expiryDate: '2030-01-01',
    verifiedBy: 'AMC_DYNAMIC_RESOLVER',
  };
}

// Valid Lifecycle Transitions State Machine Guard
export const ALLOWED_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  RECEIVED: ['VALIDATED', 'REPAIR_REQUIRED', 'REJECTED'],
  VALIDATED: ['ENRICHED', 'REPAIR_REQUIRED', 'REJECTED'],
  ENRICHED: ['CONTROLS_PASSED', 'ON_HOLD', 'REPAIR_REQUIRED', 'REJECTED'],
  CONTROLS_PASSED: ['PENDING_APPROVAL', 'APPROVED', 'TRANSFORMED', 'REJECTED'],
  ON_HOLD: ['APPROVED', 'REPAIR_REQUIRED', 'REJECTED', 'CANCELLED'],
  REPAIR_REQUIRED: ['VALIDATED', 'CANCELLED', 'REJECTED'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'REPAIR_REQUIRED', 'CANCELLED'],
  APPROVED: ['TRANSFORMED', 'REJECTED', 'CANCELLED'],
  TRANSFORMED: ['ROUTED', 'REPAIR_REQUIRED', 'REJECTED'],
  ROUTED: ['SUBMITTED', 'REPAIR_REQUIRED', 'REJECTED'],
  SUBMITTED: ['ACKNOWLEDGED', 'REJECTED', 'RETURNED'],
  ACKNOWLEDGED: ['SETTLED', 'CREDIT_CONFIRMED', 'RETURNED', 'REJECTED'],
  SETTLED: ['CREDIT_CONFIRMED', 'RETURNED'],
  CREDIT_CONFIRMED: ['RETURNED'],
  RETURNED: [],
  CANCELLED: [],
  REJECTED: [],
};

export function canTransitionState(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return true;
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

// Helper to create Downstream Events with full tracking
export function createPaymentEvent(
  eventType: PaymentEvent['eventType'],
  payment: PaymentInstruction,
  actor: string = 'PAYMENT_ORCHESTRATOR',
  additionalPayload: Record<string, any> = {}
): PaymentEvent {
  const eventId = `EVT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const now = new Date().toISOString();

  return {
    eventId,
    eventType,
    paymentId: payment.paymentId,
    uetr: payment.uetr,
    sourceSystem: payment.sourceSystem,
    correlationId: payment.correlationId,
    eventTimestamp: now,
    paymentStatus: payment.status,
    paymentAmount: payment.amount,
    currency: payment.currency,
    debtorEntity: payment.debtor.entityName,
    creditorEntity: payment.creditor.entityName,
    gateway: payment.gatewayRecord?.gatewayId,
    gatewayReference: payment.gatewayRecord?.gatewayReference,
    eventVersion: '1.2.0',
    payload: {
      sourceTxId: payment.sourceTransactionId,
      valueDate: payment.valueDate,
      charges: payment.charges,
      paymentType: payment.paymentType,
      ...additionalPayload,
    },
    auditMetadata: {
      nodeId: 'GPH-NODE-PROD-01',
      serviceName: 'PaymentProcessingOrchestrator',
      actor,
      traceId: `TRACE-${payment.uetr.slice(0, 8)}`,
    },
    deliveryStatus: [
      { target: 'AUDIT_APP', status: 'DELIVERED', timestamp: now },
      { target: 'ACCOUNTING_GL', status: 'DELIVERED', timestamp: now },
      { target: 'RECONCILIATION', status: 'DELIVERED', timestamp: now },
      { target: 'DATA_LAKE', status: 'DELIVERED', timestamp: now },
      { target: 'REGULATORY_REPORTING', status: 'DELIVERED', timestamp: now },
    ],
  };
}

// Orchestrator Execution: Runs 18-step processing on a payment instruction
export function processPaymentOrchestrator(
  payment: PaymentInstruction,
  existingPayments: PaymentInstruction[] = [],
  gateways: GatewayAdapterConfig[] = INITIAL_GATEWAY_CONFIGS,
  actor: string = 'AUTOMATED_PIPELINE'
): { updatedPayment: PaymentInstruction; emittedEvents: PaymentEvent[] } {
  const emittedEvents: PaymentEvent[] = [];
  const updated: PaymentInstruction = JSON.parse(JSON.stringify(payment));

  const addEvent = (type: PaymentEvent['eventType'], payload?: Record<string, any>) => {
    const event = createPaymentEvent(type, updated, actor, payload);
    emittedEvents.push(event);
    if (!updated.publishedEventIds.includes(event.eventId)) {
      updated.publishedEventIds.push(event.eventId);
    }
  };

  // Step 1: Ingestion event
  addEvent('PaymentInstructionReceived', { rawPayloadSnippet: updated.originalPayloadJson?.slice(0, 100) });

  // Step 2 & 3: Validate Source System & Payment Schema
  const schemaErrors = validatePaymentSchema(updated);
  if (schemaErrors.length > 0) {
    updated.status = 'REPAIR_REQUIRED';
    updated.lastUpdatedTimestamp = new Date().toISOString();
    updated.controlResults.push({
      controlId: 'SCHEMA-001',
      controlName: 'Schema Validation',
      passed: false,
      severity: 'CRITICAL',
      failureAction: 'SEND_TO_REPAIR',
      message: `Schema validation failed: ${schemaErrors.map(e => `${e.field} (${e.message})`).join(', ')}`,
      executedAt: new Date().toISOString(),
    });
    addEvent('PaymentControlFailed', { errors: schemaErrors });
    return { updatedPayment: updated, emittedEvents };
  }

  updated.status = 'VALIDATED';
  addEvent('PaymentValidated');

  // Step 4 & 5 & 6: Data Normalization & Retrieve SSI Information from AMC
  const ssi = retrieveSsiFromAmc(updated.debtor.accountNumber);
  if (ssi) {
    updated.ssiReference = ssi;
    if (!updated.debtorAgent.bic && ssi.correspondentBic) {
      updated.debtorAgent.bic = ssi.correspondentBic;
    }
    updated.status = 'ENRICHED';
    addEvent('PaymentEnriched', { ssiId: ssi.id, nostroAccount: ssi.nostroAccount });
  }

  // Step 7 & 8: Apply Configured Payment Controls & Risk Assessment
  const controlOutcome = evaluatePaymentControls(updated, existingPayments);
  updated.controlResults = controlOutcome.controlResults;

  if (controlOutcome.repairRequired) {
    updated.status = 'REPAIR_REQUIRED';
    addEvent('PaymentControlFailed', { reason: controlOutcome.repairReason });
    return { updatedPayment: updated, emittedEvents };
  }

  if (controlOutcome.holdsApplied.length > 0) {
    updated.status = 'ON_HOLD';
    for (const hold of controlOutcome.holdsApplied) {
      if (!updated.holds.some(h => h.reason === hold && h.active)) {
        updated.holds.push({
          reason: hold,
          active: true,
          placedAt: new Date().toISOString(),
          notes: controlOutcome.controlResults.find(c => !c.passed)?.message || 'Automatic risk hold',
        });
      }
    }
    if (controlOutcome.sanctionsMatch) {
      updated.sanctionsResult = controlOutcome.sanctionsMatch;
    }
    addEvent('PaymentHeld', { holds: controlOutcome.holdsApplied });
    return { updatedPayment: updated, emittedEvents };
  }

  // Controls Passed
  updated.status = 'CONTROLS_PASSED';
  addEvent('PaymentControlPassed');

  // Step 12: Maker-Checker Check if large amount or manual override
  if (controlOutcome.requiresCheckerApproval || controlOutcome.requiresDualBlind || updated.approvalWorkflow?.checker1?.status === 'PENDING') {
    updated.status = 'PENDING_APPROVAL';
    addEvent('PaymentControlPassed', { approvalRequired: true, dualBlind: controlOutcome.requiresDualBlind });
    return { updatedPayment: updated, emittedEvents };
  }

  // Step 10 & 11: Determine Message Format & Transform Payment Message
  const transformed = transformPayment(updated);
  updated.transformedMessage = transformed;
  updated.status = 'TRANSFORMED';
  addEvent('PaymentTransformed', { format: transformed.format, schemaVersion: transformed.schemaVersion });

  // Step 9: Determine Payment Route
  const routing = determinePaymentRoute(updated, gateways);
  updated.status = 'ROUTED';
  addEvent('PaymentRouted', { routingDecision: routing });

  // Step 13: Submit Payment to Gateway
  const gatewayRef = `GW-REF-${updated.paymentId}-${Date.now().toString().slice(-6)}`;
  updated.gatewayRecord = {
    gatewayId: routing.selectedGatewayId,
    gatewayName: routing.selectedGatewayName,
    submissionTimestamp: new Date().toISOString(),
    gatewayReference: gatewayRef,
    responseStatus: 'ACK',
    ackTimestamp: new Date(Date.now() + 80).toISOString(),
    settlementTimestamp: new Date(Date.now() + 180).toISOString(),
    creditConfirmationTimestamp: new Date(Date.now() + 320).toISOString(),
    retryCount: 0,
  };
  updated.status = 'SUBMITTED';
  addEvent('PaymentSubmitted', { gateway: routing.selectedGatewayName, reference: gatewayRef });

  // Step 14: Gateway Acknowledgement (Distinct from Credit Confirmation)
  updated.status = 'ACKNOWLEDGED';
  addEvent('PaymentAcknowledged', { gatewayRef });

  // Step 15: Credit Confirmation & Settlement
  updated.status = 'SETTLED';
  addEvent('PaymentSettled', { settlementType: 'GROSS_CLEARING' });

  updated.status = 'CREDIT_CONFIRMED';
  addEvent('PaymentCreditConfirmed', { beneficiaryCredited: true });

  updated.lastUpdatedTimestamp = new Date().toISOString();
  return { updatedPayment: updated, emittedEvents };
}
