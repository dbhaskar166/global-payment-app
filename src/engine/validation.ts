// Pure validation logic for Payment Instructions

import { PaymentInstruction } from '../types/payment';

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING';
}

export const VALID_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SGD', 'INR', 'AED', 'CNY', 'HKD'
]);

export function validatePaymentSchema(instruction: Partial<PaymentInstruction>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Mandatory fields
  if (!instruction.paymentId || instruction.paymentId.trim() === '') {
    errors.push({ field: 'paymentId', code: 'REQUIRED_FIELD', message: 'Payment ID is mandatory', severity: 'CRITICAL' });
  }

  if (!instruction.sourceSystem) {
    errors.push({ field: 'sourceSystem', code: 'REQUIRED_FIELD', message: 'Source System is mandatory', severity: 'CRITICAL' });
  }

  if (!instruction.paymentType) {
    errors.push({ field: 'paymentType', code: 'REQUIRED_FIELD', message: 'Payment Type is mandatory', severity: 'CRITICAL' });
  }

  // Amount and Currency
  if (instruction.amount === undefined || instruction.amount === null || isNaN(instruction.amount)) {
    errors.push({ field: 'amount', code: 'INVALID_AMOUNT', message: 'Payment amount is required and must be numeric', severity: 'CRITICAL' });
  } else if (instruction.amount <= 0) {
    errors.push({ field: 'amount', code: 'NON_POSITIVE_AMOUNT', message: 'Payment amount must be greater than zero', severity: 'CRITICAL' });
  }

  if (!instruction.currency || !VALID_CURRENCIES.has(instruction.currency.toUpperCase())) {
    errors.push({ field: 'currency', code: 'INVALID_CURRENCY', message: `Currency must be a valid ISO-4217 code (got '${instruction.currency}')`, severity: 'CRITICAL' });
  }

  // Debtor validation
  if (!instruction.debtor?.accountNumber || instruction.debtor.accountNumber.trim() === '') {
    errors.push({ field: 'debtor.accountNumber', code: 'REQUIRED_FIELD', message: 'Debtor Account Number is mandatory', severity: 'CRITICAL' });
  }
  if (!instruction.debtor?.entityName || instruction.debtor.entityName.trim() === '') {
    errors.push({ field: 'debtor.entityName', code: 'REQUIRED_FIELD', message: 'Debtor Entity Name is mandatory', severity: 'CRITICAL' });
  }

  // Creditor validation
  if (!instruction.creditor?.accountNumber || instruction.creditor.accountNumber.trim() === '') {
    errors.push({ field: 'creditor.accountNumber', code: 'REQUIRED_FIELD', message: 'Creditor Account Number is mandatory', severity: 'CRITICAL' });
  }
  if (!instruction.creditor?.entityName || instruction.creditor.entityName.trim() === '') {
    errors.push({ field: 'creditor.entityName', code: 'REQUIRED_FIELD', message: 'Creditor Entity Name is mandatory', severity: 'CRITICAL' });
  }

  // Agent BIC or routing
  if (instruction.paymentType?.startsWith('SWIFT')) {
    if (!instruction.debtorAgent?.bic || instruction.debtorAgent.bic.length < 8) {
      errors.push({ field: 'debtorAgent.bic', code: 'INVALID_BIC', message: 'Debtor Agent BIC must be at least 8 characters for SWIFT payments', severity: 'CRITICAL' });
    }
    if (!instruction.creditorAgent?.bic || instruction.creditorAgent.bic.length < 8) {
      errors.push({ field: 'creditorAgent.bic', code: 'INVALID_BIC', message: 'Creditor Agent BIC must be at least 8 characters for SWIFT payments', severity: 'CRITICAL' });
    }
  }

  // Value date
  if (!instruction.valueDate) {
    errors.push({ field: 'valueDate', code: 'REQUIRED_FIELD', message: 'Value Date is mandatory', severity: 'CRITICAL' });
  }

  return errors;
}

export function formatCurrencyAmount(amount: number, currency: string): string {
  const decimals = currency === 'JPY' ? 0 : 2;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}
