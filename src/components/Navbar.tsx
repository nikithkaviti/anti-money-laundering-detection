import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Share2, 
  AlertTriangle, 
  ListOrdered, 
  Users, 
  Sliders, 
  PlusCircle, 
  Sparkles, 
  RefreshCw,
  Zap
} from 'lucide-react';

export type ViewTab = 'overview' | 'graph' | 'alerts' | 'transactions' | 'accounts' | 'rules';

interface NavbarProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  openIngestModal: () => void;
  openScenarioModal: () => void;
  openCopilotDrawer: () => void;
  openRulesModal: () => void;
  pendingAlertsCount: number;
  onQuickSimulate: (type: 'SMURFING_BURST' | 'CIRCULAR_LOOP' | 'RESET_BASELINE') => void;
  isSimulating: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openIngestModal,
  openCopilotDrawer,
  openRulesModal,
  pendingAlertsCount,
  onQuickSimulate,
  isSimulating,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100 shadow-md">
      {/* Top Banner / Brand Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">AML SHIELD</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  UC-017 Core
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  GNN + Graph Engine Active
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Anti-Money Laundering & Transaction Network Topology Surveillance
              </p>
            </div>
          </div>

          {/* Quick Actions & Copilot Trigger */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Scenario Quick Launcher */}
            <div className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
              <button
                id="btn-simulate-smurf"
                onClick={() => onQuickSimulate('SMURFING_BURST')}
                disabled={isSimulating}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5"
                title="Inject rapid structured deposits under ₹10 Lakhs CTR reporting threshold"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Simulate Smurfing
              </button>
              <button
                id="btn-simulate-loop"
                onClick={() => onQuickSimulate('CIRCULAR_LOOP')}
                disabled={isSimulating}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5"
                title="Inject multi-hop circular funds routing loop"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                Simulate Cycle Loop
              </button>
            </div>

            {/* Ingest Transaction Button */}
            <button
              id="btn-ingest-tx"
              onClick={openIngestModal}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 border border-blue-400/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Ingest Transaction</span>
              <span className="sm:hidden">Ingest</span>
            </button>

            {/* AI Compliance Copilot Button */}
            <button
              id="btn-copilot"
              onClick={openCopilotDrawer}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-200 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">AI Compliance Copilot</span>
              <span className="sm:hidden">AI</span>
            </button>

            {/* Rule Engine Config */}
            <button
              id="btn-rule-tuner"
              onClick={openRulesModal}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60"
              title="AML Detection Rule Engine Parameters"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none">
          <button
            id="tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            Overview & Analytics
          </button>

          <button
            id="tab-graph"
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'graph'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Graph Topology Explorer
          </button>

          <button
            id="tab-alerts"
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-colors relative ${
              activeTab === 'alerts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Alerts & Case Triage
            {pendingAlertsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {pendingAlertsCount}
              </span>
            )}
          </button>

          <button
            id="tab-transactions"
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'transactions'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Transaction Stream
          </button>

          <button
            id="tab-accounts"
            onClick={() => setActiveTab('accounts')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'accounts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Entities & Accounts
          </button>
        </nav>
      </div>
    </header>
  );
};
