import React, { useState } from 'react';
import { PaymentHubProvider, usePaymentHub } from './context/PaymentHubContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Toast } from './components/common/Toast';
import { DashboardView } from './components/dashboard/DashboardView';
import { PaymentsListView } from './components/payments/PaymentsListView';
import { ManualPaymentView } from './components/manual/ManualPaymentView';
import { PipelineDesigner } from './components/pipeline/PipelineDesigner';
import { ControlsConfigView } from './components/controls/ControlsConfigView';
import { MessageMappingView } from './components/mapping/MessageMappingView';
import { GatewayManagementView } from './components/gateways/GatewayManagementView';
import { DownstreamConfigView } from './components/downstream/DownstreamConfigView';
import { ApprovalWorkbenchView } from './components/approvals/ApprovalWorkbenchView';
import { PaymentRepairView } from './components/repair/PaymentRepairView';
import { EventMonitoringView } from './components/events/EventMonitoringView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditLedgerView } from './components/audit/AuditLedgerView';
import { ArchitectureView } from './components/architecture/ArchitectureView';
import { PaymentDetailModal } from './components/payments/PaymentDetailModal';
import { ScenarioRunnerModal } from './components/scenarios/ScenarioRunnerModal';

const AppContent: React.FC = () => {
  const { 
    activeNav, 
    selectedPayment, 
    setSelectedPayment, 
    isSidebarOpen, 
    toggleSidebar, 
    toast 
  } = usePaymentHub();
  const [isScenariosOpen, setIsScenariosOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeNav) {
      case 'dashboard':
        return <DashboardView onOpenScenarios={() => setIsScenariosOpen(true)} />;
      case 'architecture':
        return <ArchitectureView />;
      case 'payments':
      case 'investigation':
        return <PaymentsListView onOpenDetail={(p) => setSelectedPayment(p)} />;
      case 'manual-payments':
        return <ManualPaymentView />;
      case 'approval-workbench':
        return <ApprovalWorkbenchView onOpenDetail={(p) => setSelectedPayment(p)} />;
      case 'repair':
        return <PaymentRepairView />;
      case 'payment-pipeline':
        return <PipelineDesigner />;
      case 'payment-controls':
        return <ControlsConfigView />;
      case 'message-mapping':
        return <MessageMappingView />;
      case 'gateways':
        return <GatewayManagementView />;
      case 'downstream':
        return <DownstreamConfigView />;
      case 'event-monitoring':
        return <EventMonitoringView />;
      case 'reports':
        return <ReportsView />;
      case 'audit':
        return <AuditLedgerView />;
      default:
        return <DashboardView onOpenScenarios={() => setIsScenariosOpen(true)} />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Header */}
      <Header onOpenScenarios={() => setIsScenariosOpen(true)} />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar onOpenScenarios={() => setIsScenariosOpen(true)} />

        {/* Dynamic Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950">
          {renderActiveView()}
        </main>
      </div>

      {/* 360 Degree Payment Investigation Modal */}
      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}

      {/* Scenario Runner Modal */}
      {isScenariosOpen && (
        <ScenarioRunnerModal onClose={() => setIsScenariosOpen(false)} />
      )}

      {/* Real-time Toast Notifications */}
      <Toast toast={toast} />
    </div>
  );
};

export default function App() {
  return (
    <PaymentHubProvider>
      <AppContent />
    </PaymentHubProvider>
  );
}
