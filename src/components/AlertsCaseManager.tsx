import React, { useState } from 'react';
import { Alert, RiskSeverity, PatternType, AlertStatus } from '../types';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  ArrowUpRight, 
  FileText, 
  Share2, 
  UserCheck, 
  Clock, 
  ShieldAlert,
  ChevronDown,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { formatINR } from '../utils/currency';

interface AlertsCaseManagerProps {
  alerts: Alert[];
  onUpdateAlertStatus: (alertId: string, status: AlertStatus, notes?: string, assignedTo?: string) => Promise<void>;
  onGenerateSar: (alert: Alert) => void;
  onNavigateToGraph: (options?: { pattern?: string; accountId?: string }) => void;
  onSelectAccount: (accountId: string) => void;
}

export const AlertsCaseManager: React.FC<AlertsCaseManagerProps> = ({
  alerts,
  onUpdateAlertStatus,
  onGenerateSar,
  onNavigateToGraph,
  onSelectAccount,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedPattern, setSelectedPattern] = useState<string>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(alerts[0] || null);
  const [triageNote, setTriageNote] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Filtered Alerts
  const filteredAlerts = alerts.filter(a => {
    if (selectedStatus !== 'ALL' && a.status !== selectedStatus) return false;
    if (selectedSeverity !== 'ALL' && a.severity !== selectedSeverity) return false;
    if (selectedPattern !== 'ALL' && a.patternType !== selectedPattern) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.entityName.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.triggerReason.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = async (newStatus: AlertStatus) => {
    if (!selectedAlert) return;
    setIsUpdating(true);
    try {
      await onUpdateAlertStatus(selectedAlert.id, newStatus, triageNote.trim() ? triageNote : undefined);
      setTriageNote('');
      // update local reference
      setSelectedAlert({
        ...selectedAlert,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[650px]">
      {/* Left 7 Cols: Alert Queue & Case Table */}
      <div className="lg:col-span-7 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Table Filters Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search alert title, entity, or trigger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                {filteredAlerts.length} / {alerts.length} cases
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ESCALATED">Escalated</option>
              <option value="SAR_FILED">SAR Filed</option>
              <option value="DISMISSED_FP">Dismissed (False Positive)</option>
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Severity</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="LOW">Low Severity</option>
            </select>

            {/* Pattern Filter */}
            <select
              value={selectedPattern}
              onChange={(e) => setSelectedPattern(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Typologies</option>
              <option value="CIRCULAR_ROUTING">Circular Routing Loops</option>
              <option value="STRUCTURING">Structuring / Smurfing</option>
              <option value="RAPID_DISPERSAL">Rapid Layering Fan-Out</option>
              <option value="SANCTIONS_PEPS">Sanctions & PEPs</option>
              <option value="VELOCITY_SURGE">Velocity Surge</option>
            </select>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <CheckCircle className="w-10 h-10 text-emerald-500/40 mb-2" />
              <p className="text-sm font-medium">No alerts match current filter criteria</p>
              <p className="text-xs text-slate-500 mt-1">Adjust filters or inject test scenarios to view alerts.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;
              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-950/40 border-l-4 border-blue-500' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : alert.severity === 'HIGH'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                          {alert.severity} ({alert.riskScore}/100)
                        </span>

                        <span className="font-mono text-[11px] text-slate-400">
                          {alert.id}
                        </span>

                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          alert.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-300'
                            : alert.status === 'SAR_FILED'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : alert.status === 'DISMISSED_FP'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-blue-500/10 text-blue-300'
                        }`}>
                          {alert.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white leading-tight">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 font-medium">
                        Subject: <span className="text-blue-400">{alert.entityName}</span>
                      </p>
                    </div>

                    <span className="font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {alert.triggerReason}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right 5 Cols: Selected Alert Details & Investigation Workbench */}
      <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {selectedAlert ? (
          <div className="flex-1 flex flex-col overflow-y-auto p-5 space-y-5">
            {/* Alert Header */}
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase border ${
                  selectedAlert.severity === 'CRITICAL'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : selectedAlert.severity === 'HIGH'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                }`}>
                  {selectedAlert.severity} Severity · Risk {selectedAlert.riskScore}/100
                </span>

                <span className="font-mono text-xs text-slate-400">{selectedAlert.id}</span>
              </div>

              <h3 className="text-sm font-bold text-white mt-2 leading-snug">
                {selectedAlert.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Triggered on {new Date(selectedAlert.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Subject Entity & Jump Links */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Subject Entity:</span>
                <button
                  onClick={() => onSelectAccount(selectedAlert.primaryAccountId)}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {selectedAlert.entityName} <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Assigned Officer:</span>
                <span className="text-xs text-slate-200 font-medium">{selectedAlert.assignedTo}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Typology Class:</span>
                <span className="font-mono text-xs text-indigo-300 font-medium">{selectedAlert.patternType}</span>
              </div>
            </div>

            {/* Trigger Reason & Evidence Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Detection Reason & Graph Evidence
              </h4>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed">
                {selectedAlert.triggerReason}
              </div>

              {/* Loop Path Evidence if Circular */}
              {selectedAlert.evidence.loopPath && (
                <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-lg text-xs space-y-2">
                  <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Circular Routing Cycle Identified:
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 flex flex-wrap items-center gap-1.5">
                    {selectedAlert.evidence.loopPath.map((nodeName, idx) => (
                      <React.Fragment key={idx}>
                        <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-700">
                          {nodeName}
                        </span>
                        {idx < selectedAlert.evidence.loopPath!.length - 1 && (
                          <span className="text-rose-400">➔</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Structuring Evidence if Smurfing */}
              {selectedAlert.evidence.structuringTransactions && (
                <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg text-xs space-y-2">
                  <div className="font-semibold text-amber-300">
                    Structuring Burst Transactions (&lt; ₹10 Lakhs CTR Threshold):
                  </div>
                  <div className="space-y-1">
                    {selectedAlert.evidence.structuringTransactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between text-[11px] font-mono text-slate-300">
                        <span>{tx.id}</span>
                        <span className="font-bold text-amber-400">{formatINR(tx.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="pt-2 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onGenerateSar(selectedAlert)}
                  className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 border border-indigo-400/40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate AI SAR Report
                </button>

                <button
                  onClick={() => onNavigateToGraph({ accountId: selectedAlert.primaryAccountId })}
                  className="px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Isolate in Graph
                </button>
              </div>
            </div>

            {/* Compliance Triage Action & Audit Trail */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Investigator Action & Audit Notes
              </h4>

              <textarea
                value={triageNote}
                onChange={(e) => setTriageNote(e.target.value)}
                placeholder="Enter investigation notes, justification, or escalation details..."
                rows={2}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleStatusChange('UNDER_REVIEW')}
                  disabled={isUpdating}
                  className="py-1.5 text-xs font-medium text-blue-300 bg-blue-950/60 hover:bg-blue-900 border border-blue-800 rounded-lg transition-colors"
                >
                  Under Review
                </button>

                <button
                  onClick={() => handleStatusChange('ESCALATED')}
                  disabled={isUpdating}
                  className="py-1.5 text-xs font-medium text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 rounded-lg transition-colors"
                >
                  Escalate Case
                </button>

                <button
                  onClick={() => handleStatusChange('DISMISSED_FP')}
                  disabled={isUpdating}
                  className="py-1.5 text-xs font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                >
                  Dismiss (FP)
                </button>
              </div>

              {/* Existing Audit Notes */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] text-slate-400 font-medium">Audit History:</span>
                {selectedAlert.notes.map((note, idx) => (
                  <div key={idx} className="p-2 bg-slate-950 border border-slate-800/80 rounded text-[11px] text-slate-300">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-400">{note.author}</span>
                      <span>{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {note.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
            <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">Select an alert from the queue to view full investigation workbench.</p>
          </div>
        )}
      </div>
    </div>
  );
};
