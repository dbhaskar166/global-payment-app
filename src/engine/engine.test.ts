// Unit Tests for Pure Logic Engines (Ultra Mode Mandatory Verification)

import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePaymentSchema, VALID_CURRENCIES, formatCurrencyAmount } from './validation';
import { 
  screenSanctions, 
  checkLargePayment, 
  checkDuplicatePayment, 
  checkCreditLimit, 
  calculateMatchScore,
  evaluatePaymentControls 
} from './controls';
import { 
  transformToPacs008, 
  transformToPacs009, 
  transformToIssacDomestic, 
  transformToAchFixedWidth 
} from './transformations';
import { determinePaymentRoute } from './routing';
import { 
  canTransitionState, 
  processPaymentOrchestrator, 
  retrieveSsiFromAmc 
} from './orchestrator';
import { PaymentInstruction } from '../types/payment';

const MOCK_BASE_PAYMENT: PaymentInstruction = {
  paymentId: 'GPH-2026-TEST01',
  uetr: 'e86b03eb-7b71-4dd9-a5c9-9430fd36c24f',
  sourceTransactionId: 'TX-GCMS-99881',
  correlationId: 'CORR-99881',
  idempotencyKey: 'IDEMP-99881',
  sourceSystem: 'GCMS',
  sourceApplication: 'GlobalCashEngine',
  channel: 'REST_API',
  paymentType: 'SWIFT_PACS_008',
  paymentPriority: 'HIGH',
  currency: 'USD',
  amount: 250000,
  valueDate: '2026-11-06',
  bookingDate: '2026-11-05',
  requestedExecutionDate: '2026-11-06',
  debtor: {
    entityName: 'ACME CORP GLOBAL',
    accountNumber: 'ACC-US-100234',
    country: 'US',
    address: '100 Wall Street, New York, NY',
  },
  creditor: {
    entityName: 'NORDIC SUPPLY APS',
    accountNumber: 'ACC-DK-908122',
    country: 'DK',
    address: 'Havnegade 12, Copenhagen',
  },
  debtorAgent: {
    bic: 'CITIUS33XXX',
    name: 'Citibank N.A. New York',
    country: 'US',
  },
  creditorAgent: {
    bic: 'DABADKKKXXX',
    name: 'Danske Bank Copenhagen',
    country: 'DK',
  },
  paymentPurpose: 'Commercial Supply Invoice INV-8891',
  remittanceInformation: 'SUPPLY INVOICE 8891',
  charges: 'SHA',
  status: 'RECEIVED',
  receivedTimestamp: '2026-11-05T10:00:00.000Z',
  lastUpdatedTimestamp: '2026-11-05T10:00:00.000Z',
  originalPayloadJson: '{"amount":250000,"currency":"USD"}',
  controlResults: [],
  holds: [],
  publishedEventIds: [],
};

// 1. Validation Tests
test('validation: catches missing debtor and negative amount', () => {
  const invalidPayment: Partial<PaymentInstruction> = {
    paymentId: 'TEST-01',
    sourceSystem: 'GCMS',
    paymentType: 'SWIFT_PACS_008',
    amount: -500,
    currency: 'INVALID_CCY',
  };
  const errors = validatePaymentSchema(invalidPayment);
  assert.ok(errors.length >= 3, 'Should produce at least 3 errors');
  assert.ok(errors.some(e => e.field === 'amount'));
  assert.ok(errors.some(e => e.field === 'currency'));
  assert.ok(errors.some(e => e.field === 'debtor.accountNumber'));
});

test('validation: passes valid standard payment', () => {
  const errors = validatePaymentSchema(MOCK_BASE_PAYMENT);
  assert.equal(errors.length, 0, 'Valid payment should have zero validation errors');
});

// 2. Controls Tests
test('controls: sanctions screening identifies sanctioned entities and aliases', () => {
  const cleanMatch = screenSanctions(MOCK_BASE_PAYMENT);
  assert.equal(cleanMatch, null, 'Clean payment should not trigger sanctions');

  const sanctionedPayment: PaymentInstruction = {
    ...MOCK_BASE_PAYMENT,
    creditor: {
      ...MOCK_BASE_PAYMENT.creditor,
      entityName: 'KOREA KWANGSON BANKING CORP',
    },
  };
  const match = screenSanctions(sanctionedPayment);
  assert.ok(match !== null, 'Sanctioned entity should be detected');
  assert.equal(match?.listName, 'OFAC_SDN');
  assert.ok(match?.matchScore >= 90);
});

test('controls: large payment thresholds are evaluated accurately', () => {
  assert.equal(checkLargePayment({ ...MOCK_BASE_PAYMENT, amount: 500000 }), false);
  assert.equal(checkLargePayment({ ...MOCK_BASE_PAYMENT, amount: 1500000 }), true);
});

test('controls: duplicate payment detector flags matching transactions', () => {
  const existingList = [MOCK_BASE_PAYMENT];
  const duplicateCandidate: PaymentInstruction = {
    ...MOCK_BASE_PAYMENT,
    paymentId: 'GPH-2026-TEST02', // different payment ID but identical attributes
    receivedTimestamp: '2026-11-05T10:15:00.000Z',
  };
  const dupResult = checkDuplicatePayment(duplicateCandidate, existingList, 60);
  assert.equal(dupResult.isDuplicate, true);
  assert.equal(dupResult.matchingPaymentId, 'GPH-2026-TEST01');
});

// 3. Transformations Tests
test('transformations: pacs.008 XML conforms to ISO 20022 structure', () => {
  const transformed = transformToPacs008(MOCK_BASE_PAYMENT);
  assert.equal(transformed.format, 'ISO20022_PACS_008');
  assert.ok(transformed.rawPayload.includes('<head:AppHdr>'), 'Should contain AppHdr');
  assert.ok(transformed.rawPayload.includes('<FIToFICstmrCdtTrf>'), 'Should contain pacs.008 element');
  assert.ok(transformed.rawPayload.includes(MOCK_BASE_PAYMENT.uetr), 'Should contain UETR');
});

test('transformations: pacs.009 XML generated for FI payments', () => {
  const fiPayment: PaymentInstruction = {
    ...MOCK_BASE_PAYMENT,
    paymentType: 'SWIFT_PACS_009',
  };
  const transformed = transformToPacs009(fiPayment);
  assert.equal(transformed.format, 'ISO20022_PACS_009');
  assert.ok(transformed.rawPayload.includes('<FICdtTrf>'));
});

test('transformations: ISSAC domestic json clearing transform succeeds', () => {
  const issacPayment: PaymentInstruction = {
    ...MOCK_BASE_PAYMENT,
    paymentType: 'DOMESTIC_ISSAC',
  };
  const transformed = transformToIssacDomestic(issacPayment);
  assert.equal(transformed.format, 'ISSAC_DOMESTIC');
  const parsed = JSON.parse(transformed.rawPayload);
  assert.equal(parsed.transaction.paymentId, issacPayment.paymentId);
});

// 4. Routing & Failover Tests
test('routing: selects primary gateway when healthy', () => {
  const decision = determinePaymentRoute(MOCK_BASE_PAYMENT);
  assert.equal(decision.selectedGatewayId, 'GW-SWIFT-BOX');
  assert.equal(decision.routeType, 'PRIMARY');
  assert.equal(decision.failoverTriggered, false);
});

test('routing: triggers automatic failover when primary gateway is OFFLINE', () => {
  const modifiedGateways = [
    {
      id: 'GW-SWIFT-BOX',
      name: 'SWIFT BOX Gateway',
      type: 'SWIFT_BOX' as const,
      protocol: 'MQ' as const,
      endpoint: 'mq://box',
      supportedCurrencies: ['USD', 'EUR'],
      supportedPaymentTypes: ['SWIFT_PACS_008' as const],
      status: 'OFFLINE' as const,
      circuitBreakerState: 'OPEN' as const,
      cutOffTimeUtc: '21:00:00',
      timeoutMs: 3000,
      maxRetries: 3,
      activeQueueDepth: 0,
    },
    {
      id: 'GW-SWIFT-CITISWITCH',
      name: 'CitiSwitch SWIFT Gateway',
      type: 'SWIFT_CITISWITCH' as const,
      protocol: 'REST_HTTPS' as const,
      endpoint: 'https://citiswitch',
      supportedCurrencies: ['USD', 'EUR'],
      supportedPaymentTypes: ['SWIFT_PACS_008' as const],
      status: 'ONLINE' as const,
      circuitBreakerState: 'CLOSED' as const,
      cutOffTimeUtc: '22:30:00',
      timeoutMs: 2500,
      maxRetries: 3,
      activeQueueDepth: 1,
    },
  ];
  const decision = determinePaymentRoute(MOCK_BASE_PAYMENT, modifiedGateways);
  assert.equal(decision.selectedGatewayId, 'GW-SWIFT-CITISWITCH');
  assert.equal(decision.failoverTriggered, true);
  assert.equal(decision.routeType, 'SECONDARY_FALLBACK');
});

// 5. Orchestrator & State Machine Tests
test('state machine: prevents illegal payment lifecycle transitions', () => {
  assert.equal(canTransitionState('RECEIVED', 'VALIDATED'), true);
  assert.equal(canTransitionState('RECEIVED', 'CREDIT_CONFIRMED'), false, 'Cannot jump from RECEIVED directly to CREDIT_CONFIRMED');
  assert.equal(canTransitionState('SUBMITTED', 'ACKNOWLEDGED'), true);
  assert.equal(canTransitionState('CANCELLED', 'SUBMITTED'), false);
});

test('orchestrator: end-to-end processing generates valid lifecycle state and downstream events', () => {
  const { updatedPayment, emittedEvents } = processPaymentOrchestrator(MOCK_BASE_PAYMENT);
  assert.equal(updatedPayment.status, 'CREDIT_CONFIRMED');
  assert.ok(emittedEvents.length >= 6, 'Should emit lifecycle events across all stages');
  assert.ok(emittedEvents.some(e => e.eventType === 'PaymentInstructionReceived'));
  assert.ok(emittedEvents.some(e => e.eventType === 'PaymentEnriched'));
  assert.ok(emittedEvents.some(e => e.eventType === 'PaymentTransformed'));
  assert.ok(emittedEvents.some(e => e.eventType === 'PaymentSubmitted'));
  assert.ok(emittedEvents.some(e => e.eventType === 'PaymentCreditConfirmed'));
  assert.ok(updatedPayment.transformedMessage !== undefined);
  assert.ok(updatedPayment.gatewayRecord !== undefined);
});
