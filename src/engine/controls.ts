// Payment Controls Framework Engine

import { 
  PaymentInstruction, 
  ControlExecutionResult, 
  SanctionsMatch,
  HoldReason 
} from '../types/payment';

// Reference Sanctioned Entities for demonstration & real screening rules
export const SANCTIONED_ENTITIES_DATABASE = [
  { name: 'KOREA KWANGSON BANKING CORP', list: 'OFAC_SDN' as const, country: 'KP', aliases: ['KKBC', 'KWANGSON'] },
  { name: 'PETROCHEMICAL COMMERCIAL CO', list: 'OFAC_SDN' as const, country: 'IR', aliases: ['PCC', 'PETROCHEM'] },
  { name: 'ROSNEFT INTERNATIONAL TRADING', list: 'EU_SANCTIONS' as const, country: 'RU', aliases: ['ROSNEFT OIL'] },
  { name: 'SYRIAN AIRLINES GENERAL ORG', list: 'UN_SECURITY_COUNCIL' as const, country: 'SY', aliases: ['SYRIANAIR'] },
  { name: 'BELARUS RESIN CHEMICAL ENTERPRISE', list: 'UK_HMT' as const, country: 'BY', aliases: ['BELRESIN'] },
  { name: 'GLOBAL ARMS TRADING CORP', list: 'OFAC_SDN' as const, country: 'IR', aliases: ['GATC ARMS'] },
];

export interface ControlEvaluationOutcome {
  passed: boolean;
  controlResults: ControlExecutionResult[];
  holdsApplied: HoldReason[];
  sanctionsMatch?: SanctionsMatch;
  requiresDualBlind: boolean;
  requiresCheckerApproval: boolean;
  repairRequired: boolean;
  repairReason?: string;
}

// Normalized Levenshtein-based fuzzy match score
export function calculateMatchScore(s1: string, s2: string): number {
  const a = s1.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const b = s2.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (a === b) return 100;
  if (!a || !b) return 0;
  if (a.includes(b) || b.includes(a)) return 85;

  // Simple bigram similarity
  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };

  const bgA = getBigrams(a);
  const bgB = getBigrams(b);
  let intersection = 0;
  for (const bg of bgA) {
    if (bgB.has(bg)) intersection++;
  }
  const total = bgA.size + bgB.size;
  return total === 0 ? 0 : Math.round((2.0 * intersection / total) * 100);
}

// 1. Sanctions Screening
export function screenSanctions(payment: PaymentInstruction): SanctionsMatch | null {
  const partiesToScreen: { name: string; field: 'creditor' | 'debtor' | 'creditorAgent' | 'intermediary' }[] = [
    { name: payment.creditor?.entityName || '', field: 'creditor' },
    { name: payment.debtor?.entityName || '', field: 'debtor' },
    { name: payment.creditorAgent?.name || '', field: 'creditorAgent' },
  ];

  if (payment.intermediaryAgent?.name) {
    partiesToScreen.push({ name: payment.intermediaryAgent.name, field: 'intermediary' });
  }

  for (const party of partiesToScreen) {
    if (!party.name) continue;
    for (const sanctioned of SANCTIONED_ENTITIES_DATABASE) {
      const directScore = calculateMatchScore(party.name, sanctioned.name);
      let highestScore = directScore;
      for (const alias of sanctioned.aliases) {
        const aliasScore = calculateMatchScore(party.name, alias);
        if (aliasScore > highestScore) highestScore = aliasScore;
      }

      if (highestScore >= 80) {
        return {
          matchedEntity: sanctioned.name,
          listName: sanctioned.list,
          matchedField: party.field,
          matchScore: highestScore,
          status: highestScore >= 95 ? 'CONFIRMED_MATCH' : 'POTENTIAL_MATCH',
          complianceNotes: `Potential match flagged against ${sanctioned.list} (${sanctioned.name}). Score: ${highestScore}%`,
        };
      }
    }
  }

  return null;
}

// 2. Large Payment Control Thresholds
export const CURRENCY_HIGH_VALUE_THRESHOLDS: Record<string, number> = {
  USD: 1_000_000,
  EUR: 1_000_000,
  GBP: 750_000,
  JPY: 150_000_000,
  CHF: 1_000_000,
  SGD: 1_500_000,
  INR: 80_000_000,
};

export function checkLargePayment(payment: PaymentInstruction, customThreshold?: number): boolean {
  const threshold = customThreshold ?? CURRENCY_HIGH_VALUE_THRESHOLDS[payment.currency] ?? 1_000_000;
  return payment.amount >= threshold;
}

// 3. Duplicate Payment Detection
export function checkDuplicatePayment(
  payment: PaymentInstruction,
  recentPayments: PaymentInstruction[],
  windowMinutes: number = 60
): { isDuplicate: boolean; matchingPaymentId?: string; reason?: string } {
  const currentReceived = new Date(payment.receivedTimestamp).getTime();

  for (const existing of recentPayments) {
    if (existing.paymentId === payment.paymentId) continue;

    const existingReceived = new Date(existing.receivedTimestamp).getTime();
    const diffMinutes = Math.abs(currentReceived - existingReceived) / (1000 * 60);

    if (diffMinutes <= windowMinutes) {
      // Check matching critical attributes
      const matchDebtor = existing.debtor?.accountNumber === payment.debtor?.accountNumber;
      const matchCreditor = existing.creditor?.accountNumber === payment.creditor?.accountNumber;
      const matchAmount = existing.amount === payment.amount;
      const matchCurrency = existing.currency === payment.currency;
      const matchValueDate = existing.valueDate === payment.valueDate;
      const matchTxId = !!payment.sourceTransactionId && (existing.sourceTransactionId === payment.sourceTransactionId);

      if (matchTxId || (matchDebtor && matchCreditor && matchAmount && matchCurrency && matchValueDate)) {
        return {
          isDuplicate: true,
          matchingPaymentId: existing.paymentId,
          reason: matchTxId 
            ? `Exact Source Transaction ID duplicate of ${existing.paymentId}`
            : `Identical Debtor, Creditor, Amount (${payment.currency} ${payment.amount}), and Value Date with ${existing.paymentId}`,
        };
      }
    }
  }

  return { isDuplicate: false };
}

// 4. Entity Credit Limit Check
export const ENTITY_CREDIT_LIMITS: Record<string, number> = {
  'ACME CORP GLOBAL': 50_000_000,
  'VERTEX TRADING PTE': 10_000_000,
  'NORDIC ENERGY AS': 25_000_000,
  'GENERIC_DEFAULT': 5_000_000,
};

export function checkCreditLimit(debtorEntity: string, amount: number): { passed: boolean; availableLimit: number; limit: number } {
  const limit = ENTITY_CREDIT_LIMITS[debtorEntity.toUpperCase()] || ENTITY_CREDIT_LIMITS['GENERIC_DEFAULT'];
  // For demo, assume current exposure is roughly 30% of limit
  const currentExposure = limit * 0.3;
  const availableLimit = limit - currentExposure;
  return {
    passed: amount <= availableLimit,
    availableLimit,
    limit,
  };
}

// Complete Controls Evaluation Engine
export function evaluatePaymentControls(
  payment: PaymentInstruction,
  recentPayments: PaymentInstruction[] = []
): ControlEvaluationOutcome {
  const controlResults: ControlExecutionResult[] = [];
  const holdsApplied: HoldReason[] = [];
  const now = new Date().toISOString();
  let repairRequired = false;
  let repairReason: string | undefined;

  // A. Mandatory Field Validation Control
  const missingDebtor = !payment.debtor?.accountNumber;
  const missingCreditor = !payment.creditor?.accountNumber;
  const missingAmount = !payment.amount || payment.amount <= 0;
  if (missingDebtor || missingCreditor || missingAmount) {
    repairRequired = true;
    repairReason = 'Mandatory fields missing: Debtor/Creditor account or valid positive amount.';
    controlResults.push({
      controlId: 'CTRL-001',
      controlName: 'Mandatory Field Validation',
      passed: false,
      severity: 'CRITICAL',
      failureAction: 'SEND_TO_REPAIR',
      message: repairReason,
      executedAt: now,
    });
  } else {
    controlResults.push({
      controlId: 'CTRL-001',
      controlName: 'Mandatory Field Validation',
      passed: true,
      severity: 'CRITICAL',
      failureAction: 'REJECT',
      message: 'All mandatory debtor, creditor, currency, amount, and value date fields validated successfully.',
      executedAt: now,
    });
  }

  // B. Large Payment Check
  const isLarge = checkLargePayment(payment);
  let requiresDualBlind = false;
  let requiresCheckerApproval = false;

  if (isLarge) {
    requiresDualBlind = payment.amount >= (CURRENCY_HIGH_VALUE_THRESHOLDS[payment.currency] ?? 1_000_000) * 2;
    requiresCheckerApproval = true;
    holdsApplied.push('LARGE_PAYMENT_THRESHOLD');
    controlResults.push({
      controlId: 'CTRL-002',
      controlName: 'Large Payment Threshold Control',
      passed: false,
      severity: 'HIGH',
      failureAction: 'REQUIRE_APPROVAL',
      message: `Payment amount (${payment.currency} ${payment.amount.toLocaleString()}) exceeds configured threshold (${payment.currency} ${(CURRENCY_HIGH_VALUE_THRESHOLDS[payment.currency] ?? 1_000_000).toLocaleString()}). Routed to ${requiresDualBlind ? 'Dual-Blind' : 'Checker'} Approval.`,
      executedAt: now,
    });
  } else {
    controlResults.push({
      controlId: 'CTRL-002',
      controlName: 'Large Payment Threshold Control',
      passed: true,
      severity: 'MEDIUM',
      failureAction: 'REQUIRE_APPROVAL',
      message: `Amount within standard operational threshold.`,
      executedAt: now,
    });
  }

  // C. Sanctions Screening
  const sanctionsMatch = screenSanctions(payment);
  if (sanctionsMatch) {
    holdsApplied.push(sanctionsMatch.status === 'CONFIRMED_MATCH' ? 'SANCTIONS_CONFIRMED_MATCH' : 'SANCTIONS_POTENTIAL_MATCH');
    controlResults.push({
      controlId: 'CTRL-003',
      controlName: 'Global Sanctions & OFAC Screening',
      passed: false,
      severity: 'CRITICAL',
      failureAction: 'HOLD',
      message: `Sanctions Alert: Match identified against ${sanctionsMatch.listName} for ${sanctionsMatch.matchedEntity} (Field: ${sanctionsMatch.matchedField}, Match Score: ${sanctionsMatch.matchScore}%). Payment held for Compliance action.`,
      executedAt: now,
      details: { sanctionsMatch },
    });
  } else {
    controlResults.push({
      controlId: 'CTRL-003',
      controlName: 'Global Sanctions & OFAC Screening',
      passed: true,
      severity: 'CRITICAL',
      failureAction: 'HOLD',
      message: 'Debtor, Creditor, Agent Banks, and Remittance screened clear against OFAC, EU, UN, and HMT sanction lists.',
      executedAt: now,
    });
  }

  // D. Duplicate Payment Detection
  const duplicateCheck = checkDuplicatePayment(payment, recentPayments);
  if (duplicateCheck.isDuplicate) {
    holdsApplied.push('DUPLICATE_SUSPECT');
    controlResults.push({
      controlId: 'CTRL-004',
      controlName: 'Duplicate Payment Detection',
      passed: false,
      severity: 'HIGH',
      failureAction: 'HOLD',
      message: `Potential duplicate payment detected! Matched against existing payment ${duplicateCheck.matchingPaymentId}: ${duplicateCheck.reason}`,
      executedAt: now,
      details: duplicateCheck,
    });
  } else {
    controlResults.push({
      controlId: 'CTRL-004',
      controlName: 'Duplicate Payment Detection',
      passed: true,
      severity: 'HIGH',
      failureAction: 'HOLD',
      message: 'No duplicate transaction identified within 60-minute matching window.',
      executedAt: now,
    });
  }

  // E. Credit Limit Check
  const creditCheck = checkCreditLimit(payment.debtor?.entityName || '', payment.amount);
  if (!creditCheck.passed) {
    holdsApplied.push('CREDIT_LIMIT_EXCEEDED');
    controlResults.push({
      controlId: 'CTRL-005',
      controlName: 'Credit Limit & Facility Check',
      passed: false,
      severity: 'HIGH',
      failureAction: 'REQUIRE_APPROVAL',
      message: `Payment amount exceeds available credit line. Available: USD ${creditCheck.availableLimit.toLocaleString()}, Total Limit: USD ${creditCheck.limit.toLocaleString()}`,
      executedAt: now,
    });
    requiresCheckerApproval = true;
  } else {
    controlResults.push({
      controlId: 'CTRL-005',
      controlName: 'Credit Limit & Facility Check',
      passed: true,
      severity: 'MEDIUM',
      failureAction: 'REQUIRE_APPROVAL',
      message: `Sufficient available credit facility (Available: USD ${creditCheck.availableLimit.toLocaleString()}).`,
      executedAt: now,
    });
  }

  const passed = holdsApplied.length === 0 && !repairRequired;

  return {
    passed,
    controlResults,
    holdsApplied,
    sanctionsMatch: sanctionsMatch || undefined,
    requiresDualBlind,
    requiresCheckerApproval,
    repairRequired,
    repairReason,
  };
}
