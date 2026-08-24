import React, { useState } from 'react';
import { Transaction, AccountType, RiskSeverity, PatternType } from '../types';
import { 
  X, 
  PlusCircle, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  Code
} from 'lucide-react';

interface TransactionIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngest: (txData: any) => Promise<{ transaction: Transaction; generatedAlerts: any[] } | null>;
}

export const TransactionIngestModal: React.FC<TransactionIngestModalProps> = ({
  isOpen,
  onClose,
  onIngest,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [senderName, setSenderName] = useState<string>('Alpine Wealth Management LLC');
  const [senderType, setSenderType] = useState<AccountType>('SHELL_CORP');
  const [senderJurisdiction, setSenderJurisdiction] = useState<string>('Cayman Islands');
  
  const [receiverName, setReceiverName] = useState<string>('Horizon Digital Liquidity Desk');
  const [receiverType, setReceiverType] = useState<AccountType>('CRYPTO_EXCHANGE');
  const [receiverJurisdiction, setReceiverJurisdiction] = useState<string>('Seychelles');

  const [amount, setAmount] = useState<number>(985000);
  const [currency, setCurrency] = useState<string>('INR');
  const [channel, setChannel] = useState<'SWIFT' | 'ACH' | 'CRYPTO_TRANSFER' | 'WIRE' | 'CASH_DEPOSIT' | 'NEFT' | 'RTGS' | 'UPI' | 'IMPS'>('NEFT');
  const [notes, setNotes] = useState<string>('Consultancy retainer tranche payment (sub-10L)');

  const [jsonInput, setJsonInput] = useState<string>(JSON.stringify({
    senderName: 'Vanguard Trade Holdings Inc',
    senderType: 'OFFSHORE_LLC',
    senderJurisdiction: 'Cayman Islands',
    receiverName: 'Apex Logistics Global SA',
    receiverType: 'SHELL_CORP',
    receiverJurisdiction: 'Panama',
    amount: 4500000,
    currency: 'INR',
    channel: 'SWIFT',
    notes: 'Maritime consultancy settlement'
  }, null, 2));

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [ingestResult, setIngestResult] = useState<{ transaction: Transaction; generatedAlerts: any[] } | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (presetType: 'smurf' | 'loop' | 'dispersion' | 'clean') => {
    if (presetType === 'smurf') {
      setSenderName('Aarav Patel (Mule)');
      setSenderType('INDIVIDUAL');
      setSenderJurisdiction('India');
      setReceiverName('BlueSky Realty & Advisory Pvt Ltd');
      setReceiverType('SHELL_CORP');
      setReceiverJurisdiction('India');
      setAmount(985000);
      setChannel('NEFT');
      setNotes('Structuring deposit tranche (sub-₹10L)');
    } else if (presetType === 'loop') {
      setSenderName('Nautilus Capital FZE');
      setSenderType('IMPORT_EXPORT');
      setSenderJurisdiction('United Arab Emirates');
      setReceiverName('Vanguard Trade Holdings Inc');
      setReceiverType('OFFSHORE_LLC');
      setReceiverJurisdiction('Cayman Islands');
      setAmount(4400000);
      setChannel('SWIFT');
      setNotes('Management dividend loop return');
    } else if (presetType === 'dispersion') {
      setSenderName('Nexus Global Commodities Inc');
      setSenderType('OFFSHORE_LLC');
      setSenderJurisdiction('Belize');
      setReceiverName('BitSafe OTC Gateway Ltd');
      setReceiverType('CRYPTO_EXCHANGE');
      setReceiverJurisdiction('Seychelles');
      setAmount(9500000);
      setChannel('CRYPTO_TRANSFER');
      setNotes('Rapid OTC liquidity dispersion');
    } else {
      setSenderName('Bharat Enterprise Tech Solutions');
      setSenderType('RETAIL_BUSINESS');
      setSenderJurisdiction('India');
      setReceiverName('Vikramaditya Rao');
      setReceiverType('INDIVIDUAL');
      setReceiverJurisdiction('India');
      setAmount(72000);
      setChannel('NEFT');
      setNotes('Monthly developer payroll credit');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIngestResult(null);

    try {
      let payload: any;
      if (activeTab === 'form') {
        payload = {
          senderId: `acc-live-${senderName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          senderName,
          senderType,
          senderJurisdiction,
          receiverId: `acc-live-${receiverName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          receiverName,
          receiverType,
          receiverJurisdiction,
          amount: Number(amount),
          currency,
          channel,
          notes,
        };
      } else {
        payload = JSON.parse(jsonInput);
        if (!payload.senderId) payload.senderId = `acc-live-${payload.senderName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'sender'}`;
        if (!payload.receiverId) payload.receiverId = `acc-live-${payload.receiverName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'receiver'}`;
      }

      const result = await onIngest(payload);
      if (result) {
        setIngestResult(result);
      }
    } catch (err: any) {
      alert(`Ingestion failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Live Transaction Ingestion & Rule Pipeline</h2>
              <p className="text-xs text-slate-400">Ingest real-time wire, ACH, or crypto flows and run live detection models</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Preset Buttons */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Test Typology Presets:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('smurf')}
                className="p-2 text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-left transition-colors"
              >
                <span className="text-amber-400 font-bold block">₹9.85L Smurfing</span>
                <span className="text-[10px] text-slate-400">Sub-CTR evasion</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('loop')}
                className="p-2 text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-left transition-colors"
              >
                <span className="text-rose-400 font-bold block">Circular Loop</span>
                <span className="text-[10px] text-slate-400">SpiderWeb cycle</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('dispersion')}
                className="p-2 text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-left transition-colors"
              >
                <span className="text-indigo-400 font-bold block">Layering Fan-Out</span>
                <span className="text-[10px] text-slate-400">Crypto dispersion</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('clean')}
                className="p-2 text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-left transition-colors"
              >
                <span className="text-emerald-400 font-bold block">Clean Payroll</span>
                <span className="text-[10px] text-slate-400">Standard retail</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Originator & Beneficiary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              {/* Originator */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Originator (Sender)</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={senderType}
                    onChange={(e) => setSenderType(e.target.value as AccountType)}
                    className="p-1.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-200"
                  >
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="SHELL_CORP">Shell Corp</option>
                    <option value="OFFSHORE_LLC">Offshore LLC</option>
                    <option value="RETAIL_BUSINESS">Retail Business</option>
                  </select>
                  <input
                    type="text"
                    value={senderJurisdiction}
                    onChange={(e) => setSenderJurisdiction(e.target.value)}
                    className="p-1.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-white"
                    placeholder="Jurisdiction"
                    required
                  />
                </div>
              </div>

              {/* Beneficiary */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Beneficiary (Receiver)</label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={receiverType}
                    onChange={(e) => setReceiverType(e.target.value as AccountType)}
                    className="p-1.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-200"
                  >
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="SHELL_CORP">Shell Corp</option>
                    <option value="OFFSHORE_LLC">Offshore LLC</option>
                    <option value="CRYPTO_EXCHANGE">Crypto Desk</option>
                    <option value="RETAIL_BUSINESS">Retail Business</option>
                  </select>
                  <input
                    type="text"
                    value={receiverJurisdiction}
                    onChange={(e) => setReceiverJurisdiction(e.target.value)}
                    className="p-1.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-white"
                    placeholder="Jurisdiction"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Amount, Channel & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Amount (₹ INR)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Transfer Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="NEFT">NEFT Transfer</option>
                  <option value="RTGS">RTGS High-Value</option>
                  <option value="UPI">UPI Instant</option>
                  <option value="IMPS">IMPS Immediate</option>
                  <option value="SWIFT">SWIFT Cross-Border Wire</option>
                  <option value="ACH">ACH Transfer</option>
                  <option value="WIRE">Domestic Wire</option>
                  <option value="CRYPTO_TRANSFER">Crypto Transfer</option>
                  <option value="CASH_DEPOSIT">Cash Deposit</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Transaction Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Evaluating Detection Engine...' : 'Ingest & Run Real-Time AML Scoring'}
            </button>
          </form>

          {/* Instant Detection Response Box */}
          {ingestResult && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Transaction Ingested Successfully
                </span>
                <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold border ${
                  ingestResult.transaction.riskScore >= 75
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : ingestResult.transaction.riskScore >= 50
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  Score: {ingestResult.transaction.riskScore}/100 ({ingestResult.transaction.status})
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <div>Patterns Detected: {ingestResult.transaction.flaggedPatterns.join(', ') || 'None (Clean)'}</div>
                <div>Alerts Generated: <span className="font-bold text-amber-400">{ingestResult.generatedAlerts.length}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
