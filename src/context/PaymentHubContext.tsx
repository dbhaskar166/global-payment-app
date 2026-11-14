// Global Payment Hub - Application State Context & Operations Engine

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  PaymentInstruction, 
  PaymentPipeline, 
  PaymentControlConfig, 
  GatewayAdapterConfig, 
  PaymentEvent, 
  UserSession,
  PaymentStatus 
} from '../types/payment';
import { 
  INITIAL_PAYMENTS, 
  INITIAL_PIPELINES, 
  INITIAL_CONTROLS, 
  CURRENT_USERS 
} from '../data/mockData';
import { INITIAL_GATEWAY_CONFIGS, determinePaymentRoute } from '../engine/routing';
import { 
  processPaymentOrchestrator, 
  createPaymentEvent, 
  retrieveSsiFromAmc 
} from '../engine/orchestrator';
import { transformPayment } from '../engine/transformations';

interface PaymentHubContextType {
  payments: PaymentInstruction[];
  pipelines: PaymentPipeline[];
  controls: PaymentControlConfig[];
  gateways: GatewayAdapterConfig[];
  events: PaymentEvent[];
  currentUser: UserSession;
  allUsers: UserSession[];
  isDarkMode: boolean;
  selectedPayment: PaymentInstruction | null;
  activeNav: string;
  isSidebarOpen: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
  
  // Actions
  setActiveNav: (nav: string) => void;
  setIsDarkMode: (val: boolean) => void;
  setIsSidebarOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
  setCurrentUser: (user: UserSession) => void;
  setSelectedPayment: (payment: PaymentInstruction | null) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  
  // Business Operations
  ingestPayment: (payment: Partial<PaymentInstruction>, autoProcess?: boolean) => PaymentInstruction;
  approvePayment: (paymentId: string, checkerNum: 1 | 2, comment: string) => boolean;
  rejectPayment: (paymentId: string, reason: string) => boolean;
  repairAndResubmitPayment: (paymentId: string, updatedFields: Partial<PaymentInstruction>, reason: string) => boolean;
  releaseSanctionsHold: (paymentId: string, complianceNotes: string) => boolean;
  resolveDuplicateHold: (paymentId: string, decision: 'RELEASE' | 'CANCEL', resolutionNotes: string) => boolean;
  updateGateway: (gatewayId: string, updates: Partial<GatewayAdapterConfig>) => void;
  updatePipeline: (pipelineId: string, updates: Partial<PaymentPipeline>) => void;
  updateControl: (controlId: string, updates: Partial<PaymentControlConfig>) => void;
  replayEvent: (eventId: string) => void;
  runScenario: (scenarioId: number) => Promise<string>;
  resetToDefaultData: () => void;
}

const PaymentHubContext = createContext<PaymentHubContextType | undefined>(undefined);

export const PaymentHubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [payments, setPayments] = useState<PaymentInstruction[]>(INITIAL_PAYMENTS);
  const [pipelines, setPipelines] = useState<PaymentPipeline[]>(INITIAL_PIPELINES);
  const [controls, setControls] = useState<PaymentControlConfig[]>(INITIAL_CONTROLS);
  const [gateways, setGateways] = useState<GatewayAdapterConfig[]>(INITIAL_GATEWAY_CONFIGS);
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSession>(CURRENT_USERS[0]); // Default to Operations Maker
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentInstruction | null>(null);
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false); // Hidden by default per user request
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  // Sync dark mode class on document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // 1. Ingest Payment Instruction
  const ingestPayment = (paymentInput: Partial<PaymentInstruction>, autoProcess: boolean = true): PaymentInstruction => {
    const paymentId = paymentInput.paymentId || `GPH-2026-${String(payments.length + 10).padStart(4, '0')}`;
    const now = new Date().toISOString();
    
    const newPayment: PaymentInstruction = {
      paymentId,
      uetr: paymentInput.uetr || crypto.randomUUID(),
      sourceTransactionId: paymentInput.sourceTransactionId || `TX-${Date.now().toString().slice(-6)}`,
      correlationId: paymentInput.correlationId || `CORR-${Date.now().toString().slice(-6)}`,
      idempotencyKey: paymentInput.idempotencyKey || `IDEMP-${Date.now()}`,
      sourceSystem: paymentInput.sourceSystem || 'GCMS',
      sourceApplication: paymentInput.sourceApplication || 'ProductEngine',
      channel: paymentInput.channel || 'REST_API',
      paymentType: paymentInput.paymentType || 'SWIFT_PACS_008',
      paymentPriority: paymentInput.paymentPriority || 'NORMAL',
      currency: paymentInput.currency || 'USD',
      amount: paymentInput.amount || 10000,
      valueDate: paymentInput.valueDate || now.slice(0, 10),
      bookingDate: now.slice(0, 10),
      requestedExecutionDate: paymentInput.requestedExecutionDate || now.slice(0, 10),
      debtor: paymentInput.debtor || {
        entityName: 'DEFAULT ENTERPRISE CORP',
        accountNumber: 'ACC-US-100234',
        country: 'US',
      },
      creditor: paymentInput.creditor || {
        entityName: 'BENEFICIARY PARTNER LTD',
        accountNumber: 'ACC-GB-883921',
        country: 'GB',
      },
      debtorAgent: paymentInput.debtorAgent || {
        bic: 'CITIUS33XXX',
        name: 'Citibank N.A.',
        country: 'US',
      },
      creditorAgent: paymentInput.creditorAgent || {
        bic: 'BARCGB22XXX',
        name: 'Barclays Bank PLC',
        country: 'GB',
      },
      paymentPurpose: paymentInput.paymentPurpose || 'Commercial Invoicing Settlement',
      remittanceInformation: paymentInput.remittanceInformation || 'COMMERCIAL PAYMENT',
      charges: paymentInput.charges || 'SHA',
      status: 'RECEIVED',
      receivedTimestamp: now,
      lastUpdatedTimestamp: now,
      originalPayloadJson: JSON.stringify(paymentInput, null, 2),
      controlResults: [],
      holds: paymentInput.holds || [],
      publishedEventIds: [],
      approvalWorkflow: paymentInput.approvalWorkflow,
    };

    if (autoProcess) {
      const { updatedPayment, emittedEvents } = processPaymentOrchestrator(
        newPayment,
        payments,
        gateways,
        currentUser.name
      );
      setPayments(prev => [updatedPayment, ...prev]);
      setEvents(prev => [...emittedEvents, ...prev]);
      showToast(`Payment ${updatedPayment.paymentId} ingested. Status: ${updatedPayment.status}`, 'success');
      return updatedPayment;
    } else {
      setPayments(prev => [newPayment, ...prev]);
      return newPayment;
    }
  };

  // 2. Maker-Checker & Dual-Blind Approval
  const approvePayment = (paymentId: string, checkerNum: 1 | 2, comment: string): boolean => {
    const payment = payments.find(p => p.paymentId === paymentId);
    if (!payment) return false;

    // Segregation of duties: Maker cannot approve
    if (payment.approvalWorkflow?.maker.userId === currentUser.userId) {
      showToast('Segregation of Duties Violation: Maker cannot approve their own payment!', 'error');
      return false;
    }

    const updated = JSON.parse(JSON.stringify(payment)) as PaymentInstruction;
    const now = new Date().toISOString();

    if (!updated.approvalWorkflow) {
      updated.approvalWorkflow = {
        requiredLevel: 1,
        dualBlind: false,
        maker: { userId: 'SYSTEM', userName: 'System Automated Ingest', timestamp: payment.receivedTimestamp },
      };
    }

    if (checkerNum === 1) {
      updated.approvalWorkflow.checker1 = {
        userId: currentUser.userId,
        userName: currentUser.name,
        status: 'APPROVED',
        timestamp: now,
        comment,
      };
    } else {
      updated.approvalWorkflow.checker2 = {
        userId: currentUser.userId,
        userName: currentUser.name,
        status: 'APPROVED',
        timestamp: now,
        comment,
      };
    }

    const isDualBlind = updated.approvalWorkflow.dualBlind || updated.approvalWorkflow.requiredLevel === 2;
    const checker1Approved = updated.approvalWorkflow.checker1?.status === 'APPROVED';
    const checker2Approved = updated.approvalWorkflow.checker2?.status === 'APPROVED';

    const fullyApproved = isDualBlind ? (checker1Approved && checker2Approved) : checker1Approved;

    if (fullyApproved) {
      updated.status = 'APPROVED';
      // Release large payment hold
      updated.holds = updated.holds.map(h => 
        h.reason === 'LARGE_PAYMENT_THRESHOLD' ? { ...h, active: false, releasedAt: now, releasedBy: currentUser.name } : h
      );

      // Now route, transform, and submit
      const transformed = transformPayment(updated);
      updated.transformedMessage = transformed;
      const routing = determinePaymentRoute(updated, gateways);
      const gatewayRef = `GW-APP-${updated.paymentId}-${Date.now().toString().slice(-5)}`;
      updated.gatewayRecord = {
        gatewayId: routing.selectedGatewayId,
        gatewayName: routing.selectedGatewayName,
        submissionTimestamp: now,
        gatewayReference: gatewayRef,
        responseStatus: 'CREDIT_CONFIRMED',
        ackTimestamp: new Date(Date.now() + 100).toISOString(),
        settlementTimestamp: new Date(Date.now() + 250).toISOString(),
        creditConfirmationTimestamp: new Date(Date.now() + 450).toISOString(),
        retryCount: 0,
      };
      updated.status = 'CREDIT_CONFIRMED';
      updated.lastUpdatedTimestamp = now;

      const appEvt = createPaymentEvent('PaymentApproved', updated, currentUser.name, { checker1Approved, checker2Approved });
      const confEvt = createPaymentEvent('PaymentCreditConfirmed', updated, currentUser.name, { gatewayRef });
      setEvents(prev => [confEvt, appEvt, ...prev]);

      showToast(`Payment ${paymentId} fully approved by ${currentUser.name} and released to gateway!`, 'success');
    } else {
      showToast(`Checker ${checkerNum} approved payment ${paymentId}. Pending second independent checker approval.`, 'info');
    }

    setPayments(prev => prev.map(p => p.paymentId === paymentId ? updated : p));
    if (selectedPayment?.paymentId === paymentId) setSelectedPayment(updated);
    return true;
  };

  // 3. Reject Payment
  const rejectPayment = (paymentId: string, reason: string): boolean => {
    const payment = payments.find(p => p.paymentId === paymentId);
    if (!payment) return false;

    const updated: PaymentInstruction = {
      ...payment,
      status: 'REJECTED',
      lastUpdatedTimestamp: new Date().toISOString(),
    };
    if (updated.approvalWorkflow) {
      updated.approvalWorkflow.checker1 = {
        userId: currentUser.userId,
        userName: currentUser.name,
        status: 'REJECTED',
        timestamp: new Date().toISOString(),
        comment: reason,
      };
    }
    const rejEvent = createPaymentEvent('PaymentRejected', updated, currentUser.name, { rejectionReason: reason });
    setPayments(prev => prev.map(p => p.paymentId === paymentId ? updated : p));
    setEvents(prev => [rejEvent, ...prev]);
    if (selectedPayment?.paymentId === paymentId) setSelectedPayment(updated);
    showToast(`Payment ${paymentId} rejected: ${reason}`, 'warning');
    return true;
  };

  // 4. Payment Repair & Resubmit
  const repairAndResubmitPayment = (paymentId: string, updatedFields: Partial<PaymentInstruction>, reason: string): boolean => {
    const existing = payments.find(p => p.paymentId === paymentId);
    if (!existing) return false;

    const now = new Date().toISOString();
    const merged: PaymentInstruction = {
      ...existing,
      ...updatedFields,
      debtor: { ...existing.debtor, ...(updatedFields.debtor || {}) },
      creditor: { ...existing.creditor, ...(updatedFields.creditor || {}) },
      debtorAgent: { ...existing.debtorAgent, ...(updatedFields.debtorAgent || {}) },
      creditorAgent: { ...existing.creditorAgent, ...(updatedFields.creditorAgent || {}) },
      lastUpdatedTimestamp: now,
      status: 'RECEIVED', // re-enter lifecycle
      repairHistory: [
        ...(existing.repairHistory || []),
        {
          repairedBy: currentUser.name,
          repairedAt: now,
          fieldsChanged: {
            repairAction: { before: existing.status, after: 'RESUBMITTED' },
          },
          reason,
        },
      ],
    };

    const { updatedPayment, emittedEvents } = processPaymentOrchestrator(
      merged,
      payments.filter(p => p.paymentId !== paymentId),
      gateways,
      `REPAIR_DESK_${currentUser.name}`
    );

    const repairEvt = createPaymentEvent('PaymentRepaired', updatedPayment, currentUser.name, { repairReason: reason });
    setPayments(prev => prev.map(p => p.paymentId === paymentId ? updatedPayment : p));
    setEvents(prev => [repairEvt, ...emittedEvents, ...prev]);
    if (selectedPayment?.paymentId === paymentId) setSelectedPayment(updatedPayment);
    showToast(`Payment ${paymentId} repaired and successfully re-evaluated! Status: ${updatedPayment.status}`, 'success');
    return true;
  };

  // 5. Sanctions Hold Release
  const releaseSanctionsHold = (paymentId: string, complianceNotes: string): boolean => {
    const payment = payments.find(p => p.paymentId === paymentId);
    if (!payment) return false;

    if (currentUser.role !== 'COMPLIANCE_OFFICER' && currentUser.role !== 'SYSTEM_ADMIN') {
      showToast('Permission Denied: Only authorized Compliance Officers can release Sanctions holds!', 'error');
      return false;
    }

    const now = new Date().toISOString();
    const updated = JSON.parse(JSON.stringify(payment)) as PaymentInstruction;

    updated.holds = updated.holds.map(h => 
      h.reason.startsWith('SANCTIONS') ? { ...h, active: false, releasedAt: now, releasedBy: currentUser.name, notes: complianceNotes } : h
    );
    if (updated.sanctionsResult) {
      updated.sanctionsResult.status = 'FALSE_POSITIVE';
      updated.sanctionsResult.complianceNotes = complianceNotes;
      updated.sanctionsResult.resolvedBy = currentUser.name;
      updated.sanctionsResult.resolvedAt = now;
    }

    // Move to transform and submit
    const transformed = transformPayment(updated);
    updated.transformedMessage = transformed;
    const routing = determinePaymentRoute(updated, gateways);
    const gatewayRef = `GW-COMPL-${updated.paymentId}-${Date.now().toString().slice(-5)}`;
    updated.gatewayRecord = {
      gatewayId: routing.selectedGatewayId,
      gatewayName: routing.selectedGatewayName,
      submissionTimestamp: now,
      gatewayReference: gatewayRef,
      responseStatus: 'CREDIT_CONFIRMED',
      ackTimestamp: new Date(Date.now() + 100).toISOString(),
      settlementTimestamp: new Date(Date.now() + 250).toISOString(),
      creditConfirmationTimestamp: new Date(Date.now() + 450).toISOString(),
      retryCount: 0,
    };
    updated.status = 'CREDIT_CONFIRMED';
    updated.lastUpdatedTimestamp = now;

    const relEvt = createPaymentEvent('PaymentApproved', updated, currentUser.name, { sanctionsReleased: true, complianceNotes });
    const confEvt = createPaymentEvent('PaymentCreditConfirmed', updated, currentUser.name, { gatewayRef });
    setPayments(prev => prev.map(p => p.paymentId === paymentId ? updated : p));
    setEvents(prev => [confEvt, relEvt, ...prev]);
    if (selectedPayment?.paymentId === paymentId) setSelectedPayment(updated);
    showToast(`Sanctions hold on ${paymentId} cleared by Compliance. Payment released to ${routing.selectedGatewayName}!`, 'success');
    return true;
  };

  // 6. Duplicate Hold Resolution
  const resolveDuplicateHold = (paymentId: string, decision: 'RELEASE' | 'CANCEL', resolutionNotes: string): boolean => {
    const payment = payments.find(p => p.paymentId === paymentId);
    if (!payment) return false;

    const now = new Date().toISOString();
    const updated = JSON.parse(JSON.stringify(payment)) as PaymentInstruction;

    if (decision === 'CANCEL') {
      updated.status = 'CANCELLED';
      updated.holds = updated.holds.map(h => 
        h.reason === 'DUPLICATE_SUSPECT' ? { ...h, active: false, releasedAt: now, releasedBy: currentUser.name, notes: `Cancelled as true duplicate: ${resolutionNotes}` } : h
      );
      const cancelEvt = createPaymentEvent('PaymentCancelled', updated, currentUser.name, { resolutionNotes });
      setPayments(prev => prev.map(p => p.paymentId === paymentId ? updated : p));
      setEvents(prev => [cancelEvt, ...prev]);
      showToast(`Duplicate payment ${paymentId} cancelled.`, 'info');
    } else {
      updated.holds = updated.holds.map(h => 
        h.reason === 'DUPLICATE_SUSPECT' ? { ...h, active: false, releasedAt: now, releasedBy: currentUser.name, notes: `Authorized genuine transfer: ${resolutionNotes}` } : h
      );
      const transformed = transformPayment(updated);
      updated.transformedMessage = transformed;
      const routing = determinePaymentRoute(updated, gateways);
      const gatewayRef = `GW-DUP-REL-${updated.paymentId}-${Date.now().toString().slice(-5)}`;
      updated.gatewayRecord = {
        gatewayId: routing.selectedGatewayId,
        gatewayName: routing.selectedGatewayName,
        submissionTimestamp: now,
        gatewayReference: gatewayRef,
        responseStatus: 'CREDIT_CONFIRMED',
        ackTimestamp: new Date(Date.now() + 100).toISOString(),
        settlementTimestamp: new Date(Date.now() + 250).toISOString(),
        creditConfirmationTimestamp: new Date(Date.now() + 450).toISOString(),
        retryCount: 0,
      };
      updated.status = 'CREDIT_CONFIRMED';
      const confEvt = createPaymentEvent('PaymentCreditConfirmed', updated, currentUser.name, { gatewayRef, duplicateCleared: true });
      setPayments(prev => prev.map(p => p.paymentId === paymentId ? updated : p));
      setEvents(prev => [confEvt, ...prev]);
      showToast(`Duplicate check cleared for ${paymentId}. Payment processed!`, 'success');
    }

    if (selectedPayment?.paymentId === paymentId) setSelectedPayment(updated);
    return true;
  };

  // 7. Update Gateway
  const updateGateway = (gatewayId: string, updates: Partial<GatewayAdapterConfig>) => {
    setGateways(prev => prev.map(g => g.id === gatewayId ? { ...g, ...updates } : g));
    showToast(`Gateway ${gatewayId} configuration updated.`, 'info');
  };

  // 8. Update Pipeline
  const updatePipeline = (pipelineId: string, updates: Partial<PaymentPipeline>) => {
    setPipelines(prev => prev.map(p => p.id === pipelineId ? { ...p, ...updates, version: p.version + 1, lastUpdatedBy: currentUser.name } : p));
    showToast(`Pipeline ${pipelineId} updated to version.`, 'info');
  };

  // 9. Update Control
  const updateControl = (controlId: string, updates: Partial<PaymentControlConfig>) => {
    setControls(prev => prev.map(c => c.id === controlId ? { ...c, ...updates, version: c.version + 1 } : c));
    showToast(`Control ${controlId} rules updated.`, 'info');
  };

  // 10. Replay Downstream Event
  const replayEvent = (eventId: string) => {
    const evt = events.find(e => e.eventId === eventId);
    if (!evt) return;
    const replayed: PaymentEvent = {
      ...evt,
      eventId: `EVT-REPLAY-${Date.now().toString().slice(-6)}`,
      eventTimestamp: new Date().toISOString(),
      auditMetadata: {
        ...evt.auditMetadata,
        actor: `${currentUser.name} (REPLAY)`,
      },
      deliveryStatus: evt.deliveryStatus.map(d => ({ ...d, status: 'DELIVERED', timestamp: new Date().toISOString() })),
    };
    setEvents(prev => [replayed, ...prev]);
    showToast(`Event ${eventId} replayed and delivered to downstream consumers.`, 'success');
  };

  // 11. Run 10 Mandatory Scenarios (from Section 17)
  const runScenario = async (scenarioId: number): Promise<string> => {
    const timestamp = Date.now().toString().slice(-4);
    switch (scenarioId) {
      case 1: {
        // Scenario 1: Product Processor Payment (GCMS -> pacs.008 -> BOX -> ACK -> Confirmation)
        const p = ingestPayment({
          paymentId: `GPH-SC1-${timestamp}`,
          sourceSystem: 'GCMS',
          sourceApplication: 'GlobalCashServices',
          paymentType: 'SWIFT_PACS_008',
          currency: 'USD',
          amount: 620000,
          debtor: { entityName: 'ACME CORP GLOBAL', accountNumber: 'ACC-US-100234', country: 'US' },
          creditor: { entityName: 'GLOBAL RETAIL GMBH', accountNumber: 'ACC-DE-991200', country: 'DE' },
          debtorAgent: { bic: 'CITIUS33XXX', name: 'Citibank N.A. New York', country: 'US' },
          creditorAgent: { bic: 'DEUTDEFFXXX', name: 'Deutsche Bank Frankfurt', country: 'DE' },
          paymentPurpose: 'Commercial Trade Invoice INV-9901',
          charges: 'SHA',
        });
        setSelectedPayment(p);
        setActiveNav('payments');
        return `Scenario 1 executed: Ingested from GCMS -> Enriched via AMC SSI -> Transformed to pacs.008 -> Routed via SWIFT BOX -> ACK & Credit Confirmed!`;
      }
      case 2: {
        // Scenario 2: Financial Institution Payment (Treasury -> pacs.009 -> CitiSwitch)
        const p = ingestPayment({
          paymentId: `GPH-SC2-${timestamp}`,
          sourceSystem: 'TREASURY',
          sourceApplication: 'TreasuryCoreEngine',
          paymentType: 'SWIFT_PACS_009',
          currency: 'EUR',
          amount: 5500000,
          debtor: { entityName: 'GLOBAL BANK TREASURY DESK', accountNumber: 'ACC-EU-330198', country: 'DE' },
          creditor: { entityName: 'BANQUE DE FRANCE PARIS', accountNumber: 'ACC-FR-112233', country: 'FR' },
          debtorAgent: { bic: 'CITIUS33XXX', name: 'Citibank N.A.', country: 'DE' },
          creditorAgent: { bic: 'BDFEFRPPXXX', name: 'Banque de France', country: 'FR' },
          paymentPurpose: 'Central Bank Liquidity Reserve Settlement',
          charges: 'OUR',
        });
        setSelectedPayment(p);
        setActiveNav('payments');
        return `Scenario 2 executed: Financial Institution payment transformed to pacs.009 and routed through CitiSwitch!`;
      }
      case 3: {
        // Scenario 3: Domestic Payment (CORP_PAY -> ISSAC)
        const p = ingestPayment({
          paymentId: `GPH-SC3-${timestamp}`,
          sourceSystem: 'CORP_PAY',
          sourceApplication: 'DomesticPayroll',
          paymentType: 'DOMESTIC_ISSAC',
          currency: 'USD',
          amount: 24500,
          debtor: { entityName: 'VERTEX TRADING PTE', accountNumber: 'ACC-SG-500122', country: 'US' },
          creditor: { entityName: 'LOCAL UTILITY PROVIDER', accountNumber: 'ACC-US-339911', country: 'US' },
          debtorAgent: { routingNumber: '021000021', name: 'Citibank N.A. Domestic', country: 'US' },
          creditorAgent: { routingNumber: '121000248', name: 'Chase Bank Domestic', country: 'US' },
          paymentPurpose: 'Monthly Commercial Utility Settlement',
          charges: 'BEN',
        });
        setSelectedPayment(p);
        setActiveNav('payments');
        return `Scenario 3 executed: Domestic payment transformed to ISSAC format and confirmed!`;
      }
      case 4: {
        // Scenario 4: Manual Payment with AMC SSI
        const p = ingestPayment({
          paymentId: `GPH-SC4-${timestamp}`,
          sourceSystem: 'MANUAL_UI',
          sourceApplication: 'ManualPaymentPortal',
          paymentType: 'SWIFT_PACS_008',
          currency: 'USD',
          amount: 150000,
          debtor: { entityName: 'ACME CORP GLOBAL', accountNumber: 'ACC-US-100234', country: 'US' },
          creditor: { entityName: 'SINGAPORE LOGISTICS PTE', accountNumber: 'ACC-SG-771122', country: 'SG' },
          debtorAgent: { bic: 'CITIUS33XXX', name: 'Citibank N.A.', country: 'US' },
          creditorAgent: { bic: 'DBSSSGSGXXX', name: 'DBS Bank Singapore', country: 'SG' },
          paymentPurpose: 'Manual Operations Settlement',
          charges: 'SHA',
          approvalWorkflow: {
            requiredLevel: 1,
            dualBlind: false,
            maker: { userId: currentUser.userId, userName: currentUser.name, timestamp: new Date().toISOString(), comment: 'Manual supplier contract PO-889' },
          },
        });
        setSelectedPayment(p);
        setActiveNav('approval-workbench');
        return `Scenario 4 executed: Manual payment created with AMC SSI retrieved, queued for Checker approval!`;
      }
      case 5: {
        // Scenario 5: Sanctions Hold
        const p = ingestPayment({
          paymentId: `GPH-SC5-${timestamp}`,
          sourceSystem: 'TRADE_PROCESSOR',
          paymentType: 'SWIFT_PACS_008',
          currency: 'USD',
          amount: 890000,
          debtor: { entityName: 'WESTERN OIL CORP', accountNumber: 'ACC-US-100234', country: 'US' },
          creditor: { entityName: 'PETROCHEMICAL COMMERCIAL CO', accountNumber: 'ACC-IR-554411', country: 'IR' }, // OFAC Sanctioned
          debtorAgent: { bic: 'CITIUS33XXX', name: 'Citibank N.A.', country: 'US' },
          creditorAgent: { bic: 'BMIIRTHHXXX', name: 'Bank Melli Iran', country: 'IR' },
          paymentPurpose: 'Petrochemical Supply Consignment',
          charges: 'SHA',
        });
        setSelectedPayment(p);
        setActiveNav('payments');
        return `Scenario 5 executed: Sanctions match triggered against OFAC SDN list. Payment placed ON_HOLD!`;
      }
      case 6: {
        // Scenario 6: Duplicate Payment Detection
        // Ingest first payment
        const first = ingestPayment({
          paymentId: `GPH-SC6A-${timestamp}`,
          sourceSystem: 'GCMS',
          sourceTransactionId: `TX-DUP-REF-${timestamp}`,
          paymentType: 'SWIFT_PACS_008',
          currency: 'GBP',
          amount: 75000,
          valueDate: '2026-11-06',
          debtor: { entityName: 'ACME CORP GLOBAL', accountNumber: 'ACC-US-100234', country: 'US' },
          creditor: { entityName: 'BRITISH STEEL CORP', accountNumber: 'ACC-UK-112299', country: 'GB' },
          debtorAgent: { bic: 'CITIUS33XXX', name: 'Citibank N.A.', country: 'US' },
          creditorAgent: { bic: 'BARCGB22XXX', name: 'Barclays Bank', country: 'GB' },
        });
        // Ingest duplicate immediately with identical attributes
        const second = ingestPayment({
          paymentId: `GPH-SC6B-${timestamp}`,
          sourceSystem: 'GCMS',
          sourceTransactionId: `TX-DUP-REF-${timestamp}`,
          paymentType: 'SWIFT_PACS_008',
          currency: 'GBP',
          amount: 75000,
          valueDate: '2026-11-06',
          debtor: { entityName: 'ACME CORP GLOBAL', accountNumber: 'ACC-US-100234', country: 'US' },
          creditor: { entityName: 'BRITISH STEEL CORP', accountNumber: 'ACC-UK-112299', country: 'GB' },
          debtorAgent: { bic: 'CITIUS33XXX', name: 'Citibank N.A.', country: 'US' },
          creditorAgent: { bic: 'BARCGB22XXX', name: 'Barclays Bank', country: 'GB' },
        });
        setSelectedPayment(second);
        setActiveNav('payments');
        return `Scenario 6 executed: Duplicate transaction detected within 60-min window! Placed on DUPLICATE_SUSPECT hold.`;
      }
      case 7: {
        // Scenario 7: Dual-Blind Approval
        const p = ingestPayment({
          paymentId: `GPH-SC7-${timestamp}`,
          sourceSystem: 'GCMS',
          paymentType: 'SWIFT_PACS_008',
          currency: 'USD',
          amount: 3500000, // > 2M triggers dual-blind
          debtor: { entityName: 'ACME CORP GLOBAL', accountNumber: 'ACC-US-100234', country: 'US' },
          creditor: { entityName: 'TOKYO HEAVY INDUSTRIES', accountNumber: 'ACC-JP-998811', country: 'JP' },
          debtorAgent: { bic: 'CITIUS33XXX', name: 'Citibank N.A.', country: 'US' },
          creditorAgent: { bic: 'BOTKJPJTXXX', name: 'MUFG Bank Tokyo', country: 'JP' },
          paymentPurpose: 'Industrial Plant Expansion Capital Tranche',
          charges: 'OUR',
          approvalWorkflow: {
            requiredLevel: 2,
            dualBlind: true,
            maker: { userId: 'USR-OP-MAKER', userName: 'Sarah Jenkins', timestamp: new Date().toISOString() },
            checker1: { userId: '', userName: '', status: 'PENDING' },
            checker2: { userId: '', userName: '', status: 'PENDING' },
          },
        });
        setSelectedPayment(p);
        setActiveNav('approval-workbench');
        return `Scenario 7 executed: High-value payment of USD 3.5M routed to Dual-Blind Approval (Checker 1 & 2 independent reviews)!`;
      }
      case 8: {
        // Scenario 8: Pipeline Configuration
        setActiveNav('payment-pipeline');
        return `Scenario 8 executed: Navigated to Visual Pipeline Designer. Maker creates, inspects stages, and submits for Checker activation.`;
      }
      case 9: {
        // Scenario 9: Gateway Failure & Fallback Routing
        // Set SWIFT BOX to OFFLINE
        setGateways(prev => prev.map(g => g.id === 'GW-SWIFT-BOX' ? { ...g, status: 'OFFLINE', circuitBreakerState: 'OPEN' } : g));
        const p = ingestPayment({
          paymentId: `GPH-SC9-${timestamp}`,
          sourceSystem: 'GCMS',
          paymentType: 'SWIFT_PACS_008',
          currency: 'USD',
          amount: 450000,
          debtor: { entityName: 'ACME CORP GLOBAL', accountNumber: 'ACC-US-100234', country: 'US' },
          creditor: { entityName: 'ROTTERDAM FREIGHT HUB', accountNumber: 'ACC-NL-776655', country: 'NL' },
          debtorAgent: { bic: 'CITIUS33XXX', name: 'Citibank N.A.', country: 'US' },
          creditorAgent: { bic: 'INGBNL2AXXX', name: 'ING Bank Netherlands', country: 'NL' },
        });
        setSelectedPayment(p);
        setActiveNav('gateways');
        return `Scenario 9 executed: SWIFT BOX primary tripped to OFFLINE. Automated circuit-breaker failover rerouted payment to CitiSwitch!`;
      }
      case 10: {
        // Scenario 10: Payment Event Publication
        setActiveNav('event-monitoring');
        return `Scenario 10 executed: Navigated to Downstream Event Monitoring. Transactional outbox, Kafka event schemas, and delivery tracking active.`;
      }
      default:
        return 'Unknown scenario';
    }
  };

  const resetToDefaultData = () => {
    setPayments(INITIAL_PAYMENTS);
    setPipelines(INITIAL_PIPELINES);
    setControls(INITIAL_CONTROLS);
    setGateways(INITIAL_GATEWAY_CONFIGS);
    setEvents([]);
    showToast('Platform reset to standard initial banking state.', 'info');
  };

  return (
    <PaymentHubContext.Provider
      value={{
        payments,
        pipelines,
        controls,
        gateways,
        events,
        currentUser,
        allUsers: CURRENT_USERS,
        isDarkMode,
        selectedPayment,
        activeNav,
        isSidebarOpen,
        toast,
        setActiveNav,
        setIsDarkMode,
        setIsSidebarOpen,
        toggleSidebar,
        setCurrentUser,
        setSelectedPayment,
        showToast,
        ingestPayment,
        approvePayment,
        rejectPayment,
        repairAndResubmitPayment,
        releaseSanctionsHold,
        resolveDuplicateHold,
        updateGateway,
        updatePipeline,
        updateControl,
        replayEvent,
        runScenario,
        resetToDefaultData,
      }}
    >
      {children}
    </PaymentHubContext.Provider>
  );
};

export const usePaymentHub = () => {
  const context = useContext(PaymentHubContext);
  if (!context) throw new Error('usePaymentHub must be used within PaymentHubProvider');
  return context;
};
