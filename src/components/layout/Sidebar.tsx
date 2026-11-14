import React from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { 
  LayoutDashboard, 
  CreditCard, 
  PenTool, 
  GitFork, 
  ShieldAlert, 
  FileCode2, 
  Server, 
  Share2, 
  CheckSquare, 
  Wrench, 
  Search, 
  Activity, 
  BarChart3, 
  History, 
  Sparkles,
  Layers,
  PanelLeftClose
} from 'lucide-react';

interface SidebarProps {
  onOpenScenarios: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenScenarios }) => {
  const { activeNav, setActiveNav, isSidebarOpen, toggleSidebar, payments } = usePaymentHub();

  if (!isSidebarOpen) {
    return null;
  }

  const pendingApprovals = payments.filter(p => p.status === 'PENDING_APPROVAL').length;
  const inRepair = payments.filter(p => p.status === 'REPAIR_REQUIRED').length;
  const onHold = payments.filter(p => p.status === 'ON_HOLD').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Operations' },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: payments.length, group: 'Operations' },
    { id: 'manual-payments', label: 'Manual Payments', icon: PenTool, group: 'Operations' },
    { id: 'approval-workbench', label: 'Approval Workbench', icon: CheckSquare, badge: pendingApprovals, badgeColor: 'amber', group: 'Operations' },
    { id: 'repair', label: 'Payment Repair', icon: Wrench, badge: inRepair, badgeColor: 'orange', group: 'Operations' },
    { id: 'investigation', label: 'Payment Investigation', icon: Search, group: 'Operations' },
    
    { id: 'payment-pipeline', label: 'Payment Pipeline', icon: GitFork, group: 'Configuration' },
    { id: 'payment-controls', label: 'Payment Controls', icon: ShieldAlert, badge: onHold ? `${onHold} Holds` : undefined, badgeColor: 'rose', group: 'Configuration' },
    { id: 'message-mapping', label: 'Message Mapping', icon: FileCode2, group: 'Configuration' },
    { id: 'gateways', label: 'Gateway Management', icon: Server, group: 'Configuration' },
    { id: 'downstream', label: 'Downstream Config', icon: Share2, group: 'Configuration' },
    { id: 'architecture', label: 'Architecture & DDD', icon: Layers, group: 'Configuration' },

    { id: 'event-monitoring', label: 'Event Monitoring', icon: Activity, group: 'Monitoring & Audit' },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, group: 'Monitoring & Audit' },
    { id: 'audit', label: 'Audit Trail', icon: History, group: 'Monitoring & Audit' },
  ];

  const grouped = {
    'Operations': navItems.filter(i => i.group === 'Operations'),
    'Configuration': navItems.filter(i => i.group === 'Configuration'),
    'Monitoring & Audit': navItems.filter(i => i.group === 'Monitoring & Audit'),
  };

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 animate-in fade-in duration-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Sidebar Header with Collapse Button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Navigation Menu
          </span>
          <button
            onClick={toggleSidebar}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title="Hide left panel"
            aria-label="Hide left panel"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Launch Scenarios Banner */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>End-to-End Scenarios</span>
          </div>
          <p className="text-[11px] text-blue-700 dark:text-blue-400 mb-2 leading-relaxed">
            Execute all 10 banking acceptance criteria with 1-click test runners.
          </p>
          <button
            onClick={onOpenScenarios}
            className="w-full py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors text-center"
          >
            Launch Scenarios
          </button>
        </div>

        {Object.entries(grouped).map(([groupName, items]) => (
          <div key={groupName}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
              {groupName}
            </div>
            <div className="space-y-1">
              {items.map(item => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-semibold' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        item.badgeColor === 'amber' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' :
                        item.badgeColor === 'orange' ? 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300' :
                        item.badgeColor === 'rose' ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
          <span>Processing Hub</span>
          <span className="text-emerald-600 dark:text-emerald-400">ACTIVE</span>
        </div>
        <div className="text-[11px] font-mono">
          ISO 20022 CBPR+ / SWIFT / ISSAC
        </div>
      </div>
    </aside>
  );
};
