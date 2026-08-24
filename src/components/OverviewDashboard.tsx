import React from 'react';
import { 
  SystemKPIs, 
  Alert, 
  PatternType,
  RiskSeverity
} from '../types';
import { 
  ShieldAlert, 
  AlertCircle, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Zap,
  RefreshCw,
  Eye,
  Layers,
  FileText
} from 'lucide-react';
import { formatINRLarge } from '../utils/currency';

interface OverviewDashboardProps {
  kpis: SystemKPIs | null;
  recentAlerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
  onNavigateToGraph: (options?: { pattern?: string; accountId?: string }) => void;
  onNavigateToAlerts: (filter?: { pattern?: string; severity?: RiskSeverity }) => void;
  onQuickSimulate: (type: 'SMURFING_BURST' | 'CIRCULAR_LOOP' | 'RESET_BASELINE') => void;
  isSimulating: boolean;
  onGenerateSar: (alert: Alert) => void;
}

const PATTERN_METADATA: Record<PatternType, { label: string; desc: string; color: string; bg: string }> = {
  STRUCTURING: {
    label: 'Structuring / Smurfing',
    desc: 'Repetitive sub-₹10 Lakh deposits evading CTR thresholds',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20'
  },
  CIRCULAR_ROUTING: {
    label: 'Circular Routing Loops',
    desc: 'Multi-hop graph cycle returning funds to origin',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20'
  },
  RAPID_DISPERSAL: {
    label: 'Rapid Layering / Fan-Out',
    desc: 'Immediate fan-out of lump-sums into shell/crypto desks',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20'
  },
  SANCTIONS_PEPS: {
    label: 'Sanctions & PEP Nexus',
    desc: 'Flows involving high-risk jurisdictions or PEPs',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20'
  },
  VELOCITY_SURGE: {
    label: 'Velocity & Volume Surge',
    desc: '400%+ anomalous volume spike vs account baseline',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20'
  },
  ROUND_AMOUNT_ANOMALY: {
    label: 'Round Amount Anomalies',
    desc: 'Multiples of ₹5L/₹10L uncharacteristic for retail',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20'
  },
  LAYERING_CHAIN: {
    label: 'Multi-Hop Layering Chain',
    desc: 'Extended chain of pass-through shell accounts',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20'
  }
};

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  kpis,
  recentAlerts,
  onSelectAlert,
  onNavigateToGraph,
  onNavigateToAlerts,
  onQuickSimulate,
  isSimulating,
  onGenerateSar,
}) => {
  if (!kpis) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const flaggedPercentage = kpis.totalVolumeUSD > 0 
    ? ((kpis.flaggedVolumeUSD / kpis.totalVolumeUSD) * 100).toFixed(1)
    : '0.0';

  const maxVolumeHour = Math.max(...kpis.hourlyVelocity.map(h => h.normalCount + h.flaggedCount), 1);

  return (
    <div className="space-y-6">
      {/* Simulation & Scenario Sandbox Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-indigo-200 uppercase tracking-wider">
                Interactive AML Scenario Sandbox & Graph Testing Engine
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Test money laundering detection algorithms in real-time. Trigger realistic laundering typologies to verify graph cycle detection, sub-₹10L CTR structuring evasion rules, and AI SAR drafting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onQuickSimulate('CIRCULAR_LOOP')}
              disabled={isSimulating}
              className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all flex items-center gap-1.5 border border-indigo-400/40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              Inject Circular Loop (SpiderWeb)
            </button>
            <button
              onClick={() => onQuickSimulate('SMURFING_BURST')}
              disabled={isSimulating}
              className="px-3 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              Inject Smurfing Evasion (Sub-₹10L Mules)
            </button>
            <button
              onClick={() => onQuickSimulate('RESET_BASELINE')}
              disabled={isSimulating}
              className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              Reset Benchmark
            </button>
          </div>
        </div>
      </div>

      {/* 3-Step AML Detection Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigateToGraph()}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Step 1: Visual Discovery
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">Graph Topology Analysis</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Trace multi-hop fund flows, spot closed loops, and see how money mules funnel cash into shell corporations.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-blue-400 mt-3 block">
            Open Graph Explorer →
          </span>
        </div>

        <div 
          onClick={() => onNavigateToAlerts()}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Step 2: Case Triage
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">Investigate Flagged Alerts</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Review algorithmic trigger evidence, check counterparty jurisdictions, and evaluate risk scores (0–100).
            </p>
          </div>
          <span className="text-[11px] font-semibold text-amber-400 mt-3 block">
            View Priority Alerts →
          </span>
        </div>

        <div 
          onClick={() => {
            const highAlert = recentAlerts.find(a => a.severity === 'CRITICAL' || a.severity === 'HIGH') || recentAlerts[0];
            if (highAlert) onGenerateSar(highAlert);
          }}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Step 3: Regulatory Filing
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">AI STR / SAR Generator</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Draft comprehensive statutory Suspicious Transaction Reports (STR/SAR) compliant with FIU-IND and PMLA 2002.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-indigo-400 mt-3 block">
            Draft Sample SAR Report →
          </span>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Flagged Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Flagged Suspicious Volume</span>
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {formatINRLarge(kpis.flaggedVolumeINR || kpis.flaggedVolumeUSD)}
            </span>
            <span className="text-xs font-medium text-slate-400">
              INR
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{flaggedPercentage}% of total network volume</span>
            <span className="text-rose-400 font-medium">{kpis.flaggedTransactionsCount} txs flagged</span>
          </div>
        </div>

        {/* Card 2: High Risk Accounts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High-Risk Entities</span>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {kpis.highRiskAccountsCount}
            </span>
            <span className="text-xs font-medium text-slate-400">
              entities
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Shell corps & PEP nexus</span>
            <button 
              onClick={() => onNavigateToGraph({ minRisk: 60 })}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              Explore Graph <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 3: Active Investigations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Investigations</span>
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {kpis.activeInvestigationsCount}
            </span>
            <span className="text-xs font-medium text-slate-400">
              open cases
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{kpis.sarFiledCount} SARs filed</span>
            <button 
              onClick={() => onNavigateToAlerts()}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              View Triage <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 4: False Positive Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">False Positive Rate</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight">
              {kpis.falsePositiveRate}%
            </span>
            <span className="text-xs font-medium text-emerald-500/80">
              Optimal (&lt;5% target)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Graph context filtering</span>
            <span className="text-slate-300">95.8% precision</span>
          </div>
        </div>
      </div>

      {/* Two-Column Analytics: Pattern Breakdown & Transaction Velocity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pattern Typologies Grid */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Detected AML Pattern Typologies & Graph Clusters
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Distribution of high-confidence financial crime patterns flagged across transaction network
              </p>
            </div>
            <button
              onClick={() => onNavigateToGraph()}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Open Graph Explorer <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(PATTERN_METADATA) as PatternType[]).map((patternKey) => {
              const meta = PATTERN_METADATA[patternKey];
              const count = kpis.patternDistribution[patternKey] || 0;
              return (
                <div 
                  key={patternKey}
                  onClick={() => onNavigateToGraph({ pattern: patternKey })}
                  className={`p-3.5 rounded-lg border ${meta.bg} cursor-pointer hover:border-slate-500 transition-all flex flex-col justify-between`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{meta.desc}</p>
                    </div>
                    <span className="text-base font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/60 ml-2">
                      {count}
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>View graph sub-network</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Hourly Flow Velocity & Spikes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                24h Transaction Velocity
              </h3>
              <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                Live Feed
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Real-time comparison between clean baseline traffic and flagged spikes
            </p>

            {/* Custom Responsive Flow Chart */}
            <div className="space-y-3 pt-2">
              {kpis.hourlyVelocity.map((item) => {
                const total = item.normalCount + item.flaggedCount;
                const normalPct = (item.normalCount / maxVolumeHour) * 100;
                const flaggedPct = (item.flaggedCount / maxVolumeHour) * 100;

                return (
                  <div key={item.hour} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-mono text-slate-400">{item.hour}</span>
                      <div className="flex items-center gap-2">
                        {item.flaggedCount > 0 && (
                          <span className="text-rose-400 font-semibold">{item.flaggedCount} flagged</span>
                        )}
                        <span className="text-slate-400">{total} total</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-blue-500 h-full transition-all" 
                        style={{ width: `${normalPct}%` }}
                        title={`Normal: ${item.normalCount}`}
                      />
                      <div 
                        className="bg-rose-500 h-full transition-all animate-pulse" 
                        style={{ width: `${flaggedPct}%` }}
                        title={`Flagged: ${item.flaggedCount}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Normal
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Anomaly
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              Total: {kpis.totalTransactions} events
            </span>
          </div>
        </div>
      </div>

      {/* Immediate Triage Watchlist / Priority High-Risk Alerts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              Priority Alerts Awaiting Compliance Action
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              High-severity triggers requiring investigation, escalation, or Suspicious Activity Report (SAR) filing
            </p>
          </div>
          <button
            onClick={() => onNavigateToAlerts()}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            Open Full Case Manager <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Severity & Risk</th>
                <th className="px-4 py-3">Subject Entity</th>
                <th className="px-4 py-3">Pattern Typology</th>
                <th className="px-4 py-3">Trigger Reason & Evidence</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {recentAlerts.slice(0, 5).map((alert) => (
                <tr 
                  key={alert.id} 
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => onSelectAlert(alert)}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : alert.severity === 'HIGH'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="font-mono text-xs font-bold text-white">
                        {alert.riskScore}/100
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-white">
                    {alert.entityName}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-[11px] text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">
                      {alert.patternType}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 max-w-md truncate text-slate-300" title={alert.triggerReason}>
                    {alert.triggerReason}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      alert.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : alert.status === 'SAR_FILED'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {alert.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onGenerateSar(alert)}
                      className="px-2.5 py-1 text-[11px] font-medium text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 rounded transition-all inline-flex items-center gap-1"
                      title="Generate AI-Assisted SAR Narrative"
                    >
                      <FileText className="w-3 h-3" />
                      SAR Draft
                    </button>
                    <button
                      onClick={() => onSelectAlert(alert)}
                      className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-all inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Triage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
