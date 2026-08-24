import React, { useState } from 'react';
import { Account, AccountType, RiskTier } from '../types';
import { Search, Filter, ShieldAlert, ArrowUpRight, Building2, User, Globe, Share2 } from 'lucide-react';
import { formatINR } from '../utils/currency';

interface AccountsDirectoryProps {
  accounts: Account[];
  onSelectAccount: (accountId: string) => void;
  onNavigateToGraph: (options?: { accountId?: string }) => void;
}

export const AccountsDirectory: React.FC<AccountsDirectoryProps> = ({
  accounts,
  onSelectAccount,
  onNavigateToGraph,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [minRisk, setMinRisk] = useState<number>(0);

  const filteredAccounts = accounts.filter((a) => {
    if (selectedType !== 'ALL' && a.accountType !== selectedType) return false;
    if (selectedTier !== 'ALL' && a.riskTier !== selectedTier) return false;
    if (a.riskScore < minRisk) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.accountHolderName.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q) ||
        a.jurisdiction.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-140px)] min-h-[650px]">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search account name, number, or jurisdiction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              {filteredAccounts.length} of {accounts.length} entities
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Entity Types</option>
            <option value="SHELL_CORP">Shell Corporation</option>
            <option value="OFFSHORE_LLC">Offshore LLC</option>
            <option value="CRYPTO_EXCHANGE">Crypto Asset Desk</option>
            <option value="IMPORT_EXPORT">Import / Export Trade</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="RETAIL_BUSINESS">Retail Business</option>
          </select>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg">
            <span className="text-[11px] text-slate-400">Min Risk:</span>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minRisk}
              onChange={(e) => setMinRisk(Number(e.target.value))}
              className="w-16 accent-blue-500 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-blue-400">{minRisk}+</span>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map((acc) => {
          const isHighRisk = acc.riskScore >= 70;
          return (
            <div
              key={acc.id}
              onClick={() => onSelectAccount(acc.id)}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-4 rounded-xl shadow-sm cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    acc.riskScore >= 80
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : acc.riskScore >= 60
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {acc.riskTier} Risk ({acc.riskScore}/100)
                  </span>

                  <span className="font-mono text-[10px] text-slate-500">{acc.accountNumber}</span>
                </div>

                <h3 className="font-bold text-white text-sm mt-2 leading-snug">{acc.accountHolderName}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>{acc.accountType}</span>
                  <span>•</span>
                  <span>{acc.jurisdiction}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Inflow</span>
                    <span className="font-mono font-semibold text-emerald-400 text-xs">
                      {formatINR(acc.totalInflow)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Outflow</span>
                    <span className="font-mono font-semibold text-rose-400 text-xs">
                      {formatINR(acc.totalOutflow)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className={`text-[11px] font-medium ${acc.isPEP ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                  {acc.isPEP ? 'PEP Nexus Flag' : acc.sanctionsListed ? 'Sanction Listed' : 'Clean KYC'}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToGraph({ accountId: acc.id });
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium text-blue-400 hover:text-white hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Share2 className="w-3 h-3" /> Graph
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
