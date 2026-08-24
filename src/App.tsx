import React, { useEffect, useState, useCallback } from 'react';
import { 
  SystemKPIs, 
  AMLGraphData, 
  Alert, 
  Transaction, 
  Account, 
  AMLRuleConfig, 
  SARReport,
  AlertStatus
} from './types';
import { Navbar, ViewTab } from './components/Navbar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { GraphExplorer } from './components/GraphExplorer';
import { AlertsCaseManager } from './components/AlertsCaseManager';
import { TransactionMonitoringTable } from './components/TransactionMonitoringTable';
import { AccountsDirectory } from './components/AccountsDirectory';
import { AccountProfileDrawer } from './components/AccountProfileDrawer';
import { SarFilingModal } from './components/SarFilingModal';
import { TransactionIngestModal } from './components/TransactionIngestModal';
import { RuleTuningModal } from './components/RuleTuningModal';
import { CopilotDrawer } from './components/CopilotDrawer';

export function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  
  // Data State
  const [kpis, setKpis] = useState<SystemKPIs | null>(null);
  const [graphData, setGraphData] = useState<AMLGraphData>({ nodes: [], links: [] });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [ruleConfig, setRuleConfig] = useState<AMLRuleConfig>({
    structuringThresholdUSD: 10000,
    structuringLowerBoundUSD: 7000,
    structuringTimeWindowHours: 72,
    structuringMinTransactions: 3,
    cycleMaxHops: 5,
    cycleTimeWindowHours: 168,
    dispersionMinOutflows: 4,
    dispersionTimeWindowHours: 24,
    velocitySurgeMultiplier: 3.5,
    criticalRiskThreshold: 80,
    highRiskThreshold: 60,
  });

  // Selection & Modal States
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedAlertForSar, setSelectedAlertForSar] = useState<Alert | null>(null);
  const [activeSarReport, setActiveSarReport] = useState<SARReport | null>(null);
  const [isGeneratingSar, setIsGeneratingSar] = useState<boolean>(false);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [graphPatternFilter, setGraphPatternFilter] = useState<string>('ALL');

  // Fetch all initial data
  const refreshAllData = useCallback(async () => {
    try {
      const [kpiRes, graphRes, alertRes, txRes, accRes, ruleRes] = await Promise.all([
        fetch('/api/kpis').then(r => r.json()),
        fetch('/api/graph').then(r => r.json()),
        fetch('/api/alerts').then(r => r.json()),
        fetch('/api/transactions').then(r => r.json()),
        fetch('/api/accounts').then(r => r.json()),
        fetch('/api/rules/config').then(r => r.json()).catch(() => null),
      ]);

      setKpis(kpiRes);
      setGraphData(graphRes);
      setAlerts(alertRes);
      setTransactions(txRes);
      setAccounts(accRes);
      if (ruleRes) setRuleConfig(ruleRes);
    } catch (err) {
      console.error('Error loading AML system telemetry:', err);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Scenario Simulation
  const handleQuickSimulate = async (scenarioType: 'SMURFING_BURST' | 'CIRCULAR_LOOP' | 'RESET_BASELINE') => {
    setIsSimulating(true);
    try {
      await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioType }),
      });
      await refreshAllData();
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Alert Status Updates
  const handleUpdateAlertStatus = async (alertId: string, status: AlertStatus, notes?: string, assignedTo?: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, assignedTo }),
      });
      await refreshAllData();
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  // SAR Generation
  const handleGenerateSar = async (alert: Alert, officerName: string) => {
    setIsGeneratingSar(true);
    try {
      const res = await fetch('/api/sar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: alert.id,
          reportingOfficer: officerName,
        }),
      });
      const data = await res.json();
      setActiveSarReport(data);
      await refreshAllData();
    } catch (err) {
      console.error('SAR generation error:', err);
    } finally {
      setIsGeneratingSar(false);
    }
  };

  // Transaction Ingestion
  const handleIngestTransaction = async (txData: any) => {
    const res = await fetch('/api/transactions/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData),
    });
    const data = await res.json();
    await refreshAllData();
    return data;
  };

  // Rule Config Update
  const handleSaveRuleConfig = async (newConfig: AMLRuleConfig) => {
    await fetch('/api/rules/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    });
    setRuleConfig(newConfig);
    await refreshAllData();
  };

  // Navigation Helpers
  const handleNavigateToGraph = (options?: { pattern?: string; accountId?: string }) => {
    if (options?.pattern) {
      setGraphPatternFilter(options.pattern);
    }
    if (options?.accountId) {
      setSelectedAccountId(options.accountId);
    }
    setActiveTab('graph');
  };

  const handleNavigateToAlerts = () => {
    setActiveTab('alerts');
  };

  const pendingAlertsCount = alerts.filter(a => a.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openIngestModal={() => setIsIngestModalOpen(true)}
        openScenarioModal={() => {}}
        openCopilotDrawer={() => setIsCopilotOpen(true)}
        openRulesModal={() => setIsRulesModalOpen(true)}
        pendingAlertsCount={pendingAlertsCount}
        onQuickSimulate={handleQuickSimulate}
        isSimulating={isSimulating}
      />

      {/* Main View Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'overview' && (
          <OverviewDashboard
            kpis={kpis}
            recentAlerts={alerts}
            onSelectAlert={(alert) => {
              setSelectedAlertForSar(alert);
              setActiveSarReport(null);
            }}
            onNavigateToGraph={handleNavigateToGraph}
            onNavigateToAlerts={handleNavigateToAlerts}
            onQuickSimulate={handleQuickSimulate}
            isSimulating={isSimulating}
            onGenerateSar={(alert) => {
              setSelectedAlertForSar(alert);
              setActiveSarReport(null);
            }}
          />
        )}

        {activeTab === 'graph' && (
          <GraphExplorer
            data={graphData}
            onSelectAccount={(accId) => setSelectedAccountId(accId)}
            selectedAccountId={selectedAccountId}
            initialPatternFilter={graphPatternFilter}
            onGenerateSarForAccount={(accId) => {
              const matchingAlert = alerts.find(a => a.primaryAccountId === accId);
              if (matchingAlert) {
                setSelectedAlertForSar(matchingAlert);
                setActiveSarReport(null);
              }
            }}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsCaseManager
            alerts={alerts}
            onUpdateAlertStatus={handleUpdateAlertStatus}
            onGenerateSar={(alert) => {
              setSelectedAlertForSar(alert);
              setActiveSarReport(null);
            }}
            onNavigateToGraph={handleNavigateToGraph}
            onSelectAccount={(accId) => setSelectedAccountId(accId)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionMonitoringTable
            transactions={transactions}
            onSelectAccount={(accId) => setSelectedAccountId(accId)}
            onNavigateToGraph={handleNavigateToGraph}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsDirectory
            accounts={accounts}
            onSelectAccount={(accId) => setSelectedAccountId(accId)}
            onNavigateToGraph={handleNavigateToGraph}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      {/* 1. Account 360 Profile Drawer */}
      <AccountProfileDrawer
        accountId={selectedAccountId}
        onClose={() => setSelectedAccountId(null)}
        onNavigateToGraph={handleNavigateToGraph}
        onGenerateSar={(alert) => {
          setSelectedAlertForSar(alert);
          setActiveSarReport(null);
        }}
      />

      {/* 2. SAR Filing & AI Narrative Modal */}
      {selectedAlertForSar && (
        <SarFilingModal
          alert={selectedAlertForSar}
          sarReport={activeSarReport}
          onClose={() => {
            setSelectedAlertForSar(null);
            setActiveSarReport(null);
          }}
          onGenerate={handleGenerateSar}
          isGenerating={isGeneratingSar}
        />
      )}

      {/* 3. Transaction Ingestion Modal */}
      <TransactionIngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngest={handleIngestTransaction}
      />

      {/* 4. Rule Engine Tuner Modal */}
      <RuleTuningModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        config={ruleConfig}
        onSave={handleSaveRuleConfig}
      />

      {/* 5. AI Compliance Copilot Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
}

export default App;
