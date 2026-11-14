import React, { useState } from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { 
  Sun, 
  Moon, 
  ShieldCheck, 
  PlayCircle, 
  RotateCcw,
  UserCheck,
  PanelLeft,
  PanelLeftClose,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';

export const Header: React.FC<{ onOpenScenarios: () => void }> = ({ onOpenScenarios }) => {
  const { 
    currentUser, 
    allUsers, 
    setCurrentUser, 
    isDarkMode, 
    setIsDarkMode, 
    activeNav, 
    setActiveNav,
    isSidebarOpen,
    toggleSidebar,
    resetToDefaultData,
    payments 
  } = usePaymentHub();

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const pendingApprovalsCount = payments.filter(p => p.status === 'PENDING_APPROVAL').length;
  const repairCount = payments.filter(p => p.status === 'REPAIR_REQUIRED').length;
  const holdCount = payments.filter(p => p.status === 'ON_HOLD').length;

  const moreViews = [
    { id: 'architecture', label: 'Architecture & HLD/LLD (10M Scale)' },
    { id: 'manual-payments', label: 'Manual Payments' },
    { id: 'investigation', label: 'Payment Investigation' },
    { id: 'payment-controls', label: `Payment Controls (${holdCount} Holds)` },
    { id: 'message-mapping', label: 'Message Mapping' },
    { id: 'downstream', label: 'Downstream Config' },
    { id: 'event-monitoring', label: 'Event Monitoring' },
    { id: 'reports', label: 'Reports & Analytics' },
    { id: 'audit', label: 'Audit Trail' },
  ];

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-6 flex items-center justify-between gap-4 md:gap-8 shrink-0 z-20">
      {/* Zone 1: Sidebar Toggle & Wordmark */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
          title={isSidebarOpen ? "Hide left panel" : "Show left panel"}
          aria-label={isSidebarOpen ? "Hide left panel" : "Show left panel"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <PanelLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        <a 
          href="#dashboard" 
          onClick={(e) => { e.preventDefault(); setActiveNav('dashboard'); }}
          className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded bg-blue-700 text-white flex items-center justify-center font-black text-sm tracking-wider">
            GPH
          </div>
          <span>Global Payment Hub</span>
        </a>
        <span className="hidden xl:inline text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          ENTERPRISE ORCHESTRATOR
        </span>
      </div>

      {/* Zone 2: Navigation Links & Quick Filter Metrics */}
      <nav className="hidden md:flex items-center gap-4 lg:gap-5 text-xs font-medium text-slate-600 dark:text-slate-400">
        <button 
          onClick={() => setActiveNav('dashboard')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap ${activeNav === 'dashboard' ? 'text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setActiveNav('payments')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap ${activeNav === 'payments' ? 'text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
        >
          All Payments ({payments.length})
        </button>
        <button 
          onClick={() => setActiveNav('approval-workbench')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeNav === 'approval-workbench' ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}`}
        >
          Approvals
          {pendingApprovalsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              {pendingApprovalsCount}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveNav('repair')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeNav === 'repair' ? 'text-orange-600 dark:text-orange-400 font-semibold' : ''}`}
        >
          Repair
          {repairCount > 0 && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
              {repairCount}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveNav('payment-pipeline')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap ${activeNav === 'payment-pipeline' ? 'text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
        >
          Pipeline
        </button>
        <button 
          onClick={() => setActiveNav('gateways')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap ${activeNav === 'gateways' ? 'text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
        >
          Gateways
        </button>
        <button 
          onClick={() => setActiveNav('architecture')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeNav === 'architecture' ? 'text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
        >
          <span>Architecture (HLD/LLD)</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
            10M DAU
          </span>
          <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono hidden xl:inline">
            28 SVCS
          </span>
        </button>

        {/* More Views Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap flex items-center gap-1 py-1 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span>More Views</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {isMoreMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setIsMoreMenuOpen(false)} 
              />
              <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-40">
                {moreViews.map(view => (
                  <button
                    key={view.id}
                    onClick={() => {
                      setActiveNav(view.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      activeNav === view.id
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Zone 3: Actions, Scenarios, Role Switcher & Theme */}
      <div className="flex items-center gap-3 shrink-0">
        {/* 10 Scenarios Modal Button */}
        <button 
          onClick={onOpenScenarios}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-sm whitespace-nowrap"
          title="Run 10 End-to-End Scenarios from Prompt"
        >
          <PlayCircle className="w-4 h-4" />
          <span>10 Scenarios</span>
        </button>

        {/* Reset Data Button */}
        <button
          onClick={resetToDefaultData}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Reset sample data"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Role Switcher */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <label htmlFor="role-select" className="sr-only">Switch Active Role</label>
          <div className="relative">
            <select
              id="role-select"
              value={currentUser.userId}
              onChange={(e) => {
                const user = allUsers.find(u => u.userId === e.target.value);
                if (user) setCurrentUser(user);
              }}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {allUsers.map(user => (
                <option key={user.userId} value={user.userId}>
                  {user.name} ({user.role.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
