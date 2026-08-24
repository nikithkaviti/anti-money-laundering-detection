import React, { useState } from 'react';
import { AMLRuleConfig } from '../types';
import { X, Sliders, CheckCircle2, RotateCcw } from 'lucide-react';

interface RuleTuningModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AMLRuleConfig;
  onSave: (newConfig: AMLRuleConfig) => Promise<void>;
}

export const RuleTuningModal: React.FC<RuleTuningModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [formData, setFormData] = useState<AMLRuleConfig>({ ...config });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setFormData({
      structuringThresholdINR: 1000000,
      structuringLowerBoundINR: 700000,
      structuringThresholdUSD: 1000000,
      structuringLowerBoundUSD: 700000,
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
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden text-slate-200">
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AML Rule Engine & Threshold Configuration</h2>
              <p className="text-xs text-slate-400">Tune sensitivity and operational boundaries of detection algorithms</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Structuring CTR Evasion Rules */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              1. Structuring / Smurfing (PMLA CTR Evasion)
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">CTR Legal Threshold (₹ INR)</label>
                <input
                  type="number"
                  value={formData.structuringThresholdINR ?? formData.structuringThresholdUSD ?? 1000000}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFormData({ ...formData, structuringThresholdINR: val, structuringThresholdUSD: val });
                  }}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Smurfing Lower Bound (₹ INR)</label>
                <input
                  type="number"
                  value={formData.structuringLowerBoundINR ?? formData.structuringLowerBoundUSD ?? 700000}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFormData({ ...formData, structuringLowerBoundINR: val, structuringLowerBoundUSD: val });
                  }}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Burst Window (Hours)</label>
                <input
                  type="number"
                  value={formData.structuringTimeWindowHours}
                  onChange={(e) => setFormData({ ...formData, structuringTimeWindowHours: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Min Structured Count</label>
                <input
                  type="number"
                  value={formData.structuringMinTransactions}
                  onChange={(e) => setFormData({ ...formData, structuringMinTransactions: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Circular Graph Cycles */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              2. Circular Fund Routing (Graph DFS Depth)
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Max DFS Cycle Hop Depth</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={formData.cycleMaxHops}
                  onChange={(e) => setFormData({ ...formData, cycleMaxHops: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Cycle Lookback (Hours)</label>
                <input
                  type="number"
                  value={formData.cycleTimeWindowHours}
                  onChange={(e) => setFormData({ ...formData, cycleTimeWindowHours: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow transition-colors flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Saved!
                  </>
                ) : isSaving ? (
                  'Updating Rule Engine...'
                ) : (
                  'Apply & Re-evaluate Engine'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
