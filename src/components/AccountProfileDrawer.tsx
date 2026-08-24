import React, { useEffect, useState } from 'react';
import { Account, Transaction, Alert } from '../types';
import { 
  X, 
  ShieldAlert, 
  ExternalLink, 
  Share2, 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Building2, 
  User, 
  Globe,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { formatINR } from '../utils/currency';

interface AccountProfileDrawerProps {
  accountId: string | null;
  onClose: () => void;
  onNavigateToGraph: (options?: { accountId?: string }) => void;
  onGenerateSar: (alert: Alert) => void;
}

export const AccountProfileDrawer: React.FC<AccountProfileDrawerProps> = ({
  accountId,
  onClose,
  onNavigateToGraph,
  onGenerateSar,
}) => {
  const [accountData, setAccountData] = useState<{ account: Account; transactions: Transaction[]; alerts: Alert[] } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!accountId) {
      setAccountData(null);
      return;
    }

    setLoading(true);
    fetch(`/api/accounts/${accountId}`)
      .then((res) => res.json())
      .then((data) => {
        setAccountData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load account profile:', err);
        setLoading(false);
      });
  }, [accountId]);

  if (!accountId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col z-50 text-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between">
          {loading || !accountData ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 w-32 bg-slate-800 rounded"></div>
              <div className="h-6 w-56 bg-slate-800 rounded"></div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  accountData.account.riskScore >= 80
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : accountData.account.riskScore >= 60
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {accountData.account.riskTier} Risk ({accountData.account.riskScore}/100)
                </span>
                <span className="font-mono text-xs text-slate-400">{accountData.account.accountNumber}</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1.5">{accountData.account.accountHolderName}</h2>
              <p className="text-xs text-slate-400">{accountData.account.accountType} · {accountData.account.jurisdiction}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToGraph({ accountId })}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              title="Isolate in Graph Explorer"
            >
              <Share2 className="w-3.5 h-3.5" />
              Graph Explorer
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        {loading || !accountData ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* 360 Risk & KYC Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 block">KYC Status</span>
                <span className="text-xs font-semibold text-white mt-0.5 block">{accountData.account.kycStatus}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Total Inflow</span>
                <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">
                  {formatINR(accountData.account.totalInflow)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Total Outflow</span>
                <span className="text-xs font-mono font-bold text-rose-400 mt-0.5 block">
                  {formatINR(accountData.account.totalOutflow)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">PEP / Sanctions</span>
                <span className="text-xs font-semibold text-amber-400 mt-0.5 block">
                  {accountData.account.isPEP ? 'PEP Match' : accountData.account.sanctionsListed ? 'Sanction Listed' : 'None'}
                </span>
              </div>
            </div>

            {/* Active AML Alerts for this account */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Active Alerts for this Subject ({accountData.alerts.length})
              </h3>
              {accountData.alerts.length === 0 ? (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-500">
                  No active alerts recorded for this account.
                </div>
              ) : (
                accountData.alerts.map((alert) => (
                  <div key={alert.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {alert.severity} ({alert.patternType})
                      </span>
                      <button
                        onClick={() => onGenerateSar(alert)}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 rounded transition-colors flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" /> Draft SAR
                      </button>
                    </div>
                    <h4 className="text-xs font-bold text-white">{alert.title}</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{alert.triggerReason}</p>
                  </div>
                ))
              )}
            </div>

            {/* Associated Transaction History */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Transaction Stream ({accountData.transactions.length})
              </h3>

              <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800 bg-slate-950">
                {accountData.transactions.map((tx) => {
                  const isOutflow = tx.senderId === accountData.account.id;
                  return (
                    <div key={tx.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-900/50">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${isOutflow ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {isOutflow ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {isOutflow ? `To: ${tx.receiverName}` : `From: ${tx.senderName}`}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {tx.channel} · {new Date(tx.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-mono font-bold ${isOutflow ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isOutflow ? '-' : '+'}{formatINR(tx.amount)}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">Risk: {tx.riskScore}/100</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
