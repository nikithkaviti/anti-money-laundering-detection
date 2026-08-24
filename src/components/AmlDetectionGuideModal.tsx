import React from 'react';
import { 
  ShieldAlert, 
  RefreshCw, 
  Zap, 
  Layers, 
  Globe, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Sparkles, 
  AlertTriangle,
  ExternalLink,
  BookOpen,
  Info
} from 'lucide-react';
import { formatINR } from '../utils/currency';

interface AmlDetectionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTypologyOnGraph: (patternKey: string) => void;
  onQuickSimulate: (type: 'SMURFING_BURST' | 'CIRCULAR_LOOP' | 'RESET_BASELINE') => void;
}

export const AmlDetectionGuideModal: React.FC<AmlDetectionGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectTypologyOnGraph,
  onQuickSimulate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg border border-indigo-400/30">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  AML Detection Academy & Red Flag Guide
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Beginner to Expert
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Understand how financial crime typologies work, how to spot them on graphs, and how our automated engine flags them.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Quick Summary Banner */}
          <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-200 space-y-1">
              <span className="font-semibold text-white block">
                The 3 Fundamental Stages of Money Laundering
              </span>
              <p className="text-slate-300 leading-relaxed">
                <strong>1. Placement:</strong> Introducing illegal funds into the financial system (e.g., structured cash deposits). 
                <strong> 2. Layering:</strong> Concealing the illicit origin through a complex web of transactions (e.g., circular routing, shell companies, crypto swaps). 
                <strong> 3. Integration:</strong> Re-entering the clean funds into the legitimate economy (e.g., luxury assets, dividends).
              </p>
            </div>
          </div>

          {/* 4 Core Typologies Breakdown */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              Core AML Typologies & How to Detect Them
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Typology 1: Structuring / Smurfing */}
              <div className="p-4 bg-slate-950 border border-amber-500/30 rounded-xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-amber-300">1. Structuring / Smurfing</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                    Sub-₹10L CTR Evasion
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong>What it is:</strong> Criminals hire multiple "money mules" to deposit amounts just below the mandatory ₹10,00,000 Cash Transaction Report (CTR) threshold (e.g., ₹9.65L, ₹9.80L, ₹9.95L) into a single collector shell company within 24–72 hours.
                  </p>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-[11px] text-amber-200/90 font-mono">
                    🚨 <strong>Red Flag:</strong> Multiple unrelated individual accounts sending repetitive ₹9.5L–₹9.99L tranches to the same entity within 72 hours.
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => {
                      onClose();
                      onSelectTypologyOnGraph('STRUCTURING');
                    }}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    View on Graph <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onQuickSimulate('SMURFING_BURST');
                    }}
                    className="px-2 py-1 text-[11px] font-medium text-slate-900 bg-amber-400 hover:bg-amber-300 rounded transition-colors"
                  >
                    Inject Live Test
                  </button>
                </div>
              </div>

              {/* Typology 2: Circular Routing (SpiderWeb Loop) */}
              <div className="p-4 bg-slate-950 border border-rose-500/30 rounded-xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-rose-300">2. Circular Routing (Looping)</span>
                  </div>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                    Cycle Layering
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong>What it is:</strong> Funds travel through a multi-hop circle of international shell companies (e.g., Cayman ➔ Panama ➔ Cyprus ➔ UAE ➔ Cayman) using fake consulting or maritime invoices to create an illusion of legitimate commercial activity before returning to the original controller.
                  </p>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-[11px] text-rose-200/90 font-mono">
                    🚨 <strong>Red Flag:</strong> Graph topology forms a closed directed cycle with minimal value retention (~90-95% forwarded).
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => {
                      onClose();
                      onSelectTypologyOnGraph('CIRCULAR_ROUTING');
                    }}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    View Loop on Graph <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onQuickSimulate('CIRCULAR_LOOP');
                    }}
                    className="px-2 py-1 text-[11px] font-medium text-white bg-rose-600 hover:bg-rose-500 rounded transition-colors"
                  >
                    Inject Live Loop
                  </button>
                </div>
              </div>

              {/* Typology 3: Rapid Dispersal & Layering */}
              <div className="p-4 bg-slate-950 border border-orange-500/30 rounded-xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-orange-300">3. Rapid Dispersal (Fan-Out)</span>
                  </div>
                  <span className="text-[10px] font-mono text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-500/30">
                    Pass-Through Shell
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong>What it is:</strong> A large lump-sum deposit (e.g., ₹2.85 Cr) enters a hub account and within 2 to 4 hours is immediately sliced and wired into 3–5 different crypto OTC desks or foreign shell entities.
                  </p>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-[11px] text-orange-200/90 font-mono">
                    🚨 <strong>Red Flag:</strong> High velocity ratio: &gt;95% of incoming funds exited within &lt;24 hours with near-zero permanent balance retained.
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => {
                      onClose();
                      onSelectTypologyOnGraph('RAPID_DISPERSAL');
                    }}
                    className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1"
                  >
                    View Dispersal on Graph <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Typology 4: Sanctioned & PEP Nexus */}
              <div className="p-4 bg-slate-950 border border-purple-500/30 rounded-xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-purple-300">4. High-Risk Havens & PEPs</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                    Jurisdiction Risk
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong>What it is:</strong> Transactions originating from or terminating in secretive financial jurisdictions (Cayman Islands, Belize, Panama, Seychelles) involving politically exposed persons (PEPs).
                  </p>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-[11px] text-purple-200/90 font-mono">
                    🚨 <strong>Red Flag:</strong> Direct nexus between shell entities in FATF-monitored jurisdictions with zero demonstrable operating footprint.
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => {
                      onClose();
                      onSelectTypologyOnGraph('SANCTIONS_PEPS');
                    }}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    View High-Risk Nodes <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Graph Cheatsheet */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              Graph Visual Cheatsheet: What Colors & Shapes Mean
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0"></span>
                <span><strong>Red Node:</strong> Critical Risk (&gt;80/100)</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0"></span>
                <span><strong>Amber Node:</strong> High Risk (60-79)</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span><strong>Blue Node:</strong> Medium Risk (30-59)</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0"></span>
                <span><strong>Green Node:</strong> Clean / Low Risk (&lt;30)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Compliant with FIU-IND, PMLA 2002, and FATF 40 Recommendations
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Got it, Start Investigating
          </button>
        </div>

      </div>
    </div>
  );
};
