import React, { useState } from 'react';
import { Alert, SARReport } from '../types';
import { 
  X, 
  Sparkles, 
  FileText, 
  CheckCircle, 
  Download, 
  Copy, 
  ShieldAlert, 
  ExternalLink,
  Code,
  Building,
  Check
} from 'lucide-react';
import { formatINR } from '../utils/currency';

interface SarFilingModalProps {
  alert: Alert | null;
  sarReport: SARReport | null;
  onClose: () => void;
  onGenerate: (alert: Alert, officerName: string) => Promise<void>;
  isGenerating: boolean;
}

export const SarFilingModal: React.FC<SarFilingModalProps> = ({
  alert,
  sarReport,
  onClose,
  onGenerate,
  isGenerating,
}) => {
  const [officerName, setOfficerName] = useState<string>('Senior AML Investigator (Lead)');
  const [viewMode, setViewMode] = useState<'narrative' | 'xml' | 'summary'>('narrative');
  const [copied, setCopied] = useState<boolean>(false);

  if (!alert) return null;

  const handleCopy = () => {
    if (!sarReport) return;
    navigator.clipboard.writeText(sarReport.detailedNarrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!sarReport) return;
    const suspAmount = formatINR(sarReport.totalSuspiciousAmountINR || sarReport.totalSuspiciousAmountUSD);
    const content = `FIU-IND / AML SUSPICIOUS TRANSACTION REPORT (STR / SAR)
TRACKING NUMBER: ${sarReport.fincenTrackingNumber}
FILING DATE: ${sarReport.filingDate}
REPORTING OFFICER: ${sarReport.reportingOfficer}
SUBJECT: ${sarReport.subjectName} (ID: ${sarReport.subjectAccountId})
SUSPICIOUS VOLUME: ${suspAmount} INR

==================== EXECUTIVE SUMMARY ====================
${sarReport.executiveSummary}

==================== REGULATORY VIOLATIONS ====================
${sarReport.suspectedViolations.join('\n')}

==================== DETAILED INVESTIGATION NARRATIVE ====================
${sarReport.detailedNarrative}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FIU_IND_SAR_${sarReport.fincenTrackingNumber}.txt`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">FinCEN SAR Filing & AI Narrative Studio</h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  BSA / AML Form 111
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated Suspicious Activity Report drafting powered by Gemini & AML Graph Telemetry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* If No SAR Generated Yet */}
          {!sarReport ? (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Investigation Case Context
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Primary Subject:</span>
                    <span className="font-bold text-white text-sm">{alert.entityName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Alert Code & Severity:</span>
                    <span className="font-bold text-rose-400">{alert.patternType} ({alert.severity})</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block">Identified Trigger:</span>
                    <span className="text-slate-200 mt-1 block">{alert.triggerReason}</span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-indigo-200 block mb-1">
                    Reporting Compliance Officer Signature / Title:
                  </label>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="E.g. Jane Doe, CAMS, Senior Vice President of AML Surveillance"
                  />
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Generating a SAR will synthesize graph network loops, transaction chronology, CTR threshold evasion evidence, and statutory violation classifications into a regulatory-standard narrative ready for FinCEN submission.
                </p>

                <button
                  onClick={() => onGenerate(alert, officerName)}
                  disabled={isGenerating}
                  className="w-full py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 border border-indigo-400/40"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Drafting FinCEN Narrative with Gemini 3.7 Flash...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate AI-Assisted SAR Narrative
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* SAR Report View */
            <div className="space-y-5">
              {/* Meta Banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      SAR FILING READY
                    </span>
                    <span className="font-mono text-xs font-bold text-white">
                      Tracking ID: {sarReport.fincenTrackingNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Subject: {sarReport.subjectName} · Total Suspicious Volume: {formatINR(sarReport.totalSuspiciousAmountINR || sarReport.totalSuspiciousAmountUSD)} INR
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-0.5 flex">
                    <button
                      onClick={() => setViewMode('narrative')}
                      className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'narrative' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Narrative View
                    </button>
                    <button
                      onClick={() => setViewMode('xml')}
                      className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'xml' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      XML Payload
                    </button>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                    title="Copy Narrative"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleDownload}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>

              {/* Suspected Violations Badges */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Suspected Statutory Violations & Red Flags:
                </span>
                <div className="flex flex-wrap gap-2">
                  {sarReport.suspectedViolations.map((v, i) => (
                    <span key={i} className="px-2.5 py-1 rounded text-xs font-mono bg-rose-950/40 text-rose-300 border border-rose-500/30">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              {/* View Switcher Output */}
              {viewMode === 'narrative' ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans space-y-4">
                  <div className="prose prose-invert max-w-none text-xs">
                    {sarReport.detailedNarrative}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
                  <pre className="font-mono text-[11px] text-emerald-400">
{`<?xml version="1.0" encoding="UTF-8"?>
<FC2SAR xmlns="http://www.fincen.gov/sar/v1">
  <ActivityDetail>
    <BSAID>${sarReport.fincenTrackingNumber}</BSAID>
    <FilingDate>${sarReport.filingDate}</FilingDate>
    <ReportingOfficer>${sarReport.reportingOfficer}</ReportingOfficer>
    <TotalAmount Currency="USD">${sarReport.totalSuspiciousAmountUSD}</TotalAmount>
  </ActivityDetail>
  <SubjectEntity>
    <Name>${sarReport.subjectName}</Name>
    <AccountID>${sarReport.subjectAccountId}</AccountID>
    <Violations>
${sarReport.suspectedViolations.map(v => `      <Violation>${v}</Violation>`).join('\n')}
    </Violations>
  </SubjectEntity>
  <Narrative>
${sarReport.detailedNarrative.replace(/[<>&]/g, '')}
  </Narrative>
</FC2SAR>`}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
