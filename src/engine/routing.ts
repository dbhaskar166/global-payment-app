// Gateway Dynamic Routing Engine & Failover Logic

import { PaymentInstruction, GatewayAdapterConfig } from '../types/payment';

export interface RoutingDecision {
  selectedGatewayId: string;
  selectedGatewayName: string;
  routeType: 'PRIMARY' | 'SECONDARY_FALLBACK' | 'MANUAL_OVERRIDE';
  reason: string;
  originalCandidateId?: string;
  failoverTriggered: boolean;
}

export const INITIAL_GATEWAY_CONFIGS: GatewayAdapterConfig[] = [
  {
    id: 'GW-SWIFT-BOX',
    name: 'SWIFT BOX Gateway',
    type: 'SWIFT_BOX',
    protocol: 'MQ',
    endpoint: 'mq://prod-box.banking.network:1414/SWIFT_IN_QL',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'SGD'],
    supportedPaymentTypes: ['SWIFT_PACS_008', 'SWIFT_PACS_009'],
    status: 'ONLINE',
    circuitBreakerState: 'CLOSED',
    cutOffTimeUtc: '21:00:00',
    timeoutMs: 3000,
    maxRetries: 3,
    activeQueueDepth: 12,
  },
  {
    id: 'GW-SWIFT-CITISWITCH',
    name: 'CitiSwitch SWIFT Gateway',
    type: 'SWIFT_CITISWITCH',
    protocol: 'REST_HTTPS',
    endpoint: 'https://citiswitch.internal.bank.net/api/v3/submit',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'SGD', 'AED'],
    supportedPaymentTypes: ['SWIFT_PACS_008', 'SWIFT_PACS_009'],
    status: 'ONLINE',
    circuitBreakerState: 'CLOSED',
    cutOffTimeUtc: '22:30:00',
    timeoutMs: 2500,
    maxRetries: 3,
    activeQueueDepth: 4,
  },
  {
    id: 'GW-DOM-ISSAC',
    name: 'ISSAC Domestic Instant Clearing',
    type: 'DOMESTIC_ISSAC',
    protocol: 'REST_HTTPS',
    endpoint: 'https://issac-hub.clearing.net/v2/payments',
    supportedCurrencies: ['USD', 'GBP', 'EUR', 'INR'],
    supportedPaymentTypes: ['DOMESTIC_ISSAC', 'DOMESTIC_IMPS', 'DOMESTIC_UPI'],
    status: 'ONLINE',
    circuitBreakerState: 'CLOSED',
    cutOffTimeUtc: '23:59:59', // 24x7 real-time
    timeoutMs: 1500,
    maxRetries: 2,
    activeQueueDepth: 2,
  },
  {
    id: 'GW-DOM-RTGS',
    name: 'National High-Value RTGS Gateway',
    type: 'DOMESTIC_RTGS',
    protocol: 'MQ',
    endpoint: 'mq://rtgs-core.clearing.net:1415/RTGS_HIGH_VAL_QL',
    supportedCurrencies: ['USD', 'EUR', 'INR', 'GBP'],
    supportedPaymentTypes: ['DOMESTIC_RTGS', 'SWIFT_PACS_009'],
    status: 'ONLINE',
    circuitBreakerState: 'CLOSED',
    cutOffTimeUtc: '18:00:00',
    timeoutMs: 4000,
    maxRetries: 3,
    activeQueueDepth: 1,
  },
  {
    id: 'GW-DOM-ACH',
    name: 'Domestic Automated Clearing House (ACH)',
    type: 'DOMESTIC_ACH',
    protocol: 'SFTP',
    endpoint: 'sftp://fedach.clearing.gov/batches/inbound',
    supportedCurrencies: ['USD'],
    supportedPaymentTypes: ['DOMESTIC_ACH'],
    status: 'ONLINE',
    circuitBreakerState: 'CLOSED',
    cutOffTimeUtc: '17:00:00',
    timeoutMs: 10000,
    maxRetries: 1,
    activeQueueDepth: 0,
  },
];

export function determinePaymentRoute(
  payment: PaymentInstruction,
  gateways: GatewayAdapterConfig[] = INITIAL_GATEWAY_CONFIGS
): RoutingDecision {
  const getGateway = (id: string) => gateways.find(g => g.id === id);

  // Default selection candidate based on payment type & target currency
  let primaryCandidateId = 'GW-SWIFT-BOX';
  let secondaryCandidateId = 'GW-SWIFT-CITISWITCH';

  if (payment.paymentType === 'DOMESTIC_ISSAC' || payment.paymentType === 'DOMESTIC_IMPS' || payment.paymentType === 'DOMESTIC_UPI') {
    primaryCandidateId = 'GW-DOM-ISSAC';
    secondaryCandidateId = 'GW-DOM-RTGS';
  } else if (payment.paymentType === 'DOMESTIC_RTGS') {
    primaryCandidateId = 'GW-DOM-RTGS';
    secondaryCandidateId = 'GW-SWIFT-BOX';
  } else if (payment.paymentType === 'DOMESTIC_ACH') {
    primaryCandidateId = 'GW-DOM-ACH';
    secondaryCandidateId = 'GW-DOM-ISSAC';
  } else if (payment.paymentType === 'SWIFT_PACS_009') {
    // Financial Institution high-value credit transfers prefer CitiSwitch or RTGS
    primaryCandidateId = 'GW-SWIFT-CITISWITCH';
    secondaryCandidateId = 'GW-SWIFT-BOX';
  } else {
    // Default SWIFT Customer Credit
    primaryCandidateId = 'GW-SWIFT-BOX';
    secondaryCandidateId = 'GW-SWIFT-CITISWITCH';
  }

  const primaryGateway = getGateway(primaryCandidateId);
  const secondaryGateway = getGateway(secondaryCandidateId);

  // Check if primary is healthy
  const isPrimaryAvailable = primaryGateway && 
    primaryGateway.status === 'ONLINE' && 
    primaryGateway.circuitBreakerState !== 'OPEN';

  if (isPrimaryAvailable && primaryGateway) {
    return {
      selectedGatewayId: primaryGateway.id,
      selectedGatewayName: primaryGateway.name,
      routeType: 'PRIMARY',
      reason: `Primary gateway selected for ${payment.paymentType} in ${payment.currency}. Operational health: ${primaryGateway.status}`,
      failoverTriggered: false,
    };
  }

  // Primary unavailable -> Trigger fallback routing
  if (secondaryGateway && (secondaryGateway.status === 'ONLINE' || secondaryGateway.status === 'DEGRADED')) {
    return {
      selectedGatewayId: secondaryGateway.id,
      selectedGatewayName: secondaryGateway.name,
      routeType: 'SECONDARY_FALLBACK',
      reason: `Primary gateway ${primaryCandidateId} unavailable (${primaryGateway?.status || 'UNKNOWN'}, CB: ${primaryGateway?.circuitBreakerState}). Auto-failover routed to secondary gateway ${secondaryGateway.name}.`,
      originalCandidateId: primaryCandidateId,
      failoverTriggered: true,
    };
  }

  // If both unavailable, pick first available gateway that supports the currency
  const availableAny = gateways.find(g => g.status === 'ONLINE' && g.circuitBreakerState !== 'OPEN' && g.supportedCurrencies.includes(payment.currency));
  if (availableAny) {
    return {
      selectedGatewayId: availableAny.id,
      selectedGatewayName: availableAny.name,
      routeType: 'SECONDARY_FALLBACK',
      reason: `Emergency failover to ${availableAny.name} due to primary and secondary outage.`,
      originalCandidateId: primaryCandidateId,
      failoverTriggered: true,
    };
  }

  // Fallback to primary anyway with warning
  return {
    selectedGatewayId: primaryGateway?.id || 'GW-SWIFT-BOX',
    selectedGatewayName: primaryGateway?.name || 'SWIFT BOX Gateway',
    routeType: 'PRIMARY',
    reason: `All candidate gateways reporting degraded or offline status. Retaining ${primaryCandidateId} in queue with retry policy.`,
    failoverTriggered: false,
  };
}
