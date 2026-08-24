import React, { useState } from 'react';
import { Transaction, PatternType, TransactionStatus } from '../types';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, ShieldAlert, CheckCircle2, Download } from 'lucide-react';
import { formatINR } from '../utils/currency';

interface TransactionMonitoringTableProps {
  transactions: Transaction[];
  onSelectAccount: (accountId: string) => void;
  onNavigateToGraph: (options?: { accountId?: string }) => void;
}

export const TransactionMonitoringTable: React.FC<TransactionMonitoringTableProps> = ({
  transactions,
  onSelectAccount,
  onNavigateToGraph,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [minRiskScore, setMinRiskScore] = useState<number>(0);

  const filteredTransactions = transactions.filter((t) => {
    if (selectedChannel !== 'ALL' && t.channel !== selectedChannel) return false;
    if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
    if (t.riskScore < minRiskScore) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.referenceNumber.toLowerCase().includes(q) ||
        t.senderName.toLowerCase().includes(q) ||
        t.receiverName.toLowerCase().includes(q) ||
        t.senderJurisdiction.toLowerCase().includes(q) ||
        t.receiverJurisdiction.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = 'ID,Reference,Sender,SenderJurisdiction,Receiver,ReceiverJurisdiction,Amount,Currency,Channel,RiskScore,Status,Timestamp\n';
    const rows = filteredTransactions.map(t => 
      `"${t.id}","${t.referenceNumber}","${t.senderName}","${t.senderJurisdiction}","${t.receiverName}","${t.receiverJurisdiction}",${t.amount},"${t.currency || 'INR'}","${t.channel}",${t.riskScore},"${t.status}","${t.timestamp}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AML_Transactions_INR_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-140px)] min-h-[650px]">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference, sender, receiver, jurisdiction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              {filteredTransactions.length} of {transactions.length} records
            </span>
            <button
              onClick={exportCSV}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
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
            <option value="FLAGGED">Flagged High-Risk</option>
            <option value="SUSPICIOUS">Suspicious</option>
            <option value="NORMAL">Normal Traffic</option>
          </select>

          {/* Channel Filter */}
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Channels</option>
            <option value="NEFT">NEFT Transfer</option>
            <option value="RTGS">RTGS High-Value</option>
            <option value="UPI">UPI Instant</option>
            <option value="IMPS">IMPS Immediate</option>
            <option value="SWIFT">SWIFT Cross-Border</option>
            <option value="ACH">ACH Transfer</option>
            <option value="CRYPTO_TRANSFER">Crypto Asset Desk</option>
            <option value="WIRE">Domestic Wire</option>
            <option value="CASH_DEPOSIT">Cash Deposit</option>
            <option value="CARD">Card Payment</option>
          </select>

          {/* Min Risk Slider */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg">
            <span className="text-[11px] text-slate-400">Min Risk:</span>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minRiskScore}
              onChange={(e) => setMinRiskScore(Number(e.target.value))}
              className="w-16 accent-blue-500 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-blue-400">{minRiskScore}+</span>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">Reference & Time</th>
              <th className="px-4 py-3">Originator (Sender)</th>
              <th className="px-4 py-3">Beneficiary (Receiver)</th>
              <th className="px-4 py-3">Amount (INR)</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Risk Score</th>
              <th className="px-4 py-3">Detected Patterns</th>
              <th className="px-4 py-3 text-right">Topology</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredTransactions.map((tx) => {
              const isHighRisk = tx.riskScore >= 75;
              const isMediumRisk = tx.riskScore >= 45 && tx.riskScore < 75;

              return (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-mono text-xs font-semibold text-white">{tx.referenceNumber}</div>
                    <div className="text-[10px] text-slate-500">{new Date(tx.timestamp).toLocaleString()}</div>
                  </td>

                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => onSelectAccount(tx.senderId)}
                      className="font-medium text-blue-400 hover:text-blue-300 text-left truncate max-w-[180px] block"
                    >
                      {tx.senderName}
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">{tx.senderJurisdiction}</span>
                  </td>

                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => onSelectAccount(tx.receiverId)}
                      className="font-medium text-blue-400 hover:text-blue-300 text-left truncate max-w-[180px] block"
                    >
                      {tx.receiverName}
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">{tx.receiverJurisdiction}</span>
                  </td>

                  <td className="px-4 py-3.5 font-mono font-bold text-white whitespace-nowrap">
                    {formatINR(tx.amount)}
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {tx.channel}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${
                        isHighRisk
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : isMediumRisk
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {tx.riskScore}/100
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    {tx.flaggedPatterns.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tx.flaggedPatterns.map((p) => (
                          <span
                            key={p}
                            className="px-1.5 py-0.2 rounded text-[9.5px] font-mono bg-rose-950/60 text-rose-300 border border-rose-800/50"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500">None (Clean)</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => onNavigateToGraph({ accountId: tx.senderId })}
                      className="px-2 py-1 text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
                      title="Inspect Ego-Graph"
                    >
                      Graph
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
