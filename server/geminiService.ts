import { GoogleGenAI } from '@google/genai';
import { Alert, Account, Transaction, SARReport } from '../src/types.js';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function generateSARReportWithGemini(params: {
  alert: Alert;
  account: Account;
  relatedTransactions: Transaction[];
  reportingOfficer: string;
}): Promise<SARReport> {
  const { alert, account, relatedTransactions, reportingOfficer } = params;
  const ai = getGenAI();

  const totalSuspiciousAmount = relatedTransactions.reduce((acc, t) => acc + t.amount, 0);
  const counterpartyList = relatedTransactions.map(t => {
    const isSender = t.senderId === account.id;
    return {
      name: isSender ? t.receiverName : t.senderName,
      account: isSender ? t.receiverId : t.senderId,
      role: isSender ? 'Beneficiary' : 'Originator',
      jurisdiction: isSender ? t.receiverJurisdiction : t.senderJurisdiction,
    };
  });

  const prompt = `
You are an expert Certified Anti-Money Laundering Specialist (CAMS) and senior Financial Crime Investigator specialized in Indian and International AML/CFT frameworks (FIU-IND, PMLA 2002, RBI AML Guidelines, and FATF recommendations).
Draft a rigorous Suspicious Activity / Suspicious Transaction Report (SAR / STR) narrative based on the following automated detection telemetry:

PRIMARY SUBJECT ENTITY:
- Name: ${account.accountHolderName}
- Account Number: ${account.accountNumber}
- Entity Type: ${account.accountType}
- Jurisdiction: ${account.jurisdiction} (Risk Level: ${account.jurisdictionRisk})
- KYC Status: ${account.kycStatus}
- Politically Exposed Person (PEP): ${account.isPEP ? 'YES' : 'NO'}
- Sanctions / Watchlist Match: ${account.sanctionsListed ? 'YES' : 'NO'}

ALERT DETAILS:
- Title: ${alert.title}
- Pattern Code: ${alert.patternType}
- Risk Score: ${alert.riskScore}/100 (Severity: ${alert.severity})
- Trigger Reason: ${alert.triggerReason}
- Evidence Details: ${JSON.stringify(alert.evidence, null, 2)}

TRANSACTION SAMPLE (${relatedTransactions.length} items, Total: ₹${totalSuspiciousAmount.toLocaleString('en-IN')} INR):
${relatedTransactions.map(t => `- [${t.timestamp}] Ref: ${t.referenceNumber}, From: ${t.senderName} (${t.senderJurisdiction}) -> To: ${t.receiverName} (${t.receiverJurisdiction}), Amount: ₹${t.amount.toLocaleString('en-IN')} ${t.currency || 'INR'}, Channel: ${t.channel}, Notes: ${t.notes || 'N/A'}`).join('\n')}

INSTRUCTIONS:
Provide a clear, legally sound SAR/STR narrative with:
1. Executive Summary (1-2 concise paragraphs referencing amounts in INR / ₹)
2. Detailed Typology Breakdown (Structuring/Smurfing, Layering, Circular Fund Flow, or Sanction Nexus)
3. Chronological Pattern of Transactions & Counterparties
4. Specific Regulatory Violations (e.g., Section 12 of Prevention of Money Laundering Act (PMLA) 2002, FIU-IND Rule 3 CTR/STR reporting, RBI Master Direction on KYC/AML, 18 U.S.C. / FATF 40 Recommendations)
5. Law Enforcement Recommendation (whether immediate referral to FIU-IND / Enforcement Directorate (ED) / Central Economic Intelligence Bureau is strongly advised).

Respond in clean markdown formatted text.
`;

  let executiveSummary = `Automated SAR/STR report generated for subject ${account.accountHolderName} following flagged ${alert.patternType} activity totaling ₹${totalSuspiciousAmount.toLocaleString('en-IN')} INR across ${relatedTransactions.length} related transactions.`;
  let detailedNarrative = `The compliance monitoring engine detected suspicious fund movement characterized by ${alert.triggerReason}. Investigation confirmed pattern alignment with ${alert.patternType} typologies.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });
      if (response.text) {
        detailedNarrative = response.text;
        const paragraphs = detailedNarrative.split('\n\n').filter(p => p.trim().length > 0);
        if (paragraphs.length > 0) {
          executiveSummary = paragraphs[0].replace(/^#+\s*/, '');
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to heuristic narrative generator:', err);
    }
  } else {
    // High-quality fallback rule-based narrative
    detailedNarrative = `### FIU-IND / AML Suspicious Activity Report (SAR / STR) Narrative
**Subject Entity:** ${account.accountHolderName} (${account.accountType})  
**Jurisdiction:** ${account.jurisdiction} | **Risk Score:** ${alert.riskScore}/100 (${alert.severity})

#### 1. Executive Summary
During automated and manual transaction surveillance conducted on ${new Date().toLocaleDateString()}, the AML Compliance Unit flagged a pattern of anomalous activity associated with ${account.accountHolderName} (Account #${account.accountNumber}). The activity demonstrates textbook indicators of **${alert.patternType}**, involving cumulative suspicious volume of **₹${totalSuspiciousAmount.toLocaleString('en-IN')} INR**.

#### 2. Pattern Analysis & Typology Findings
- **Primary Trigger:** ${alert.triggerReason}
- **Structural Anomalies:** Examination of graph network relationships reveals high velocity flow between counterparties in ${account.jurisdiction} and interconnected offshore entities.
- **Evidentiary Breakdown:** The timing and quantum of the transactions strongly suggest intent to conceal ultimate beneficial ownership and circumvent standard Cash/Currency Transaction Reporting (CTR) thresholds under Section 12 of the Prevention of Money Laundering Act (PMLA) 2002.

#### 3. Recommended Actions & Law Enforcement Referral
Given the severity of the findings and the heightened risk tier of the subject (${account.riskTier}), the Compliance Officer recommends immediate escalation, account suspension pending Enhanced Due Diligence (EDD), and formal submission of this SAR/STR to the Financial Intelligence Unit - India (FIU-IND) and competent regulatory authorities.`;
  }

  const sarReport: SARReport = {
    id: `SAR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    alertId: alert.id,
    subjectAccountId: account.id,
    subjectName: account.accountHolderName,
    filingDate: new Date().toISOString(),
    reportingOfficer: reportingOfficer || 'Compliance Officer (Lead AML Analyst)',
    fincenTrackingNumber: `FIU-IND-2026-${Math.floor(10000000 + Math.random() * 90000000)}`,
    totalSuspiciousAmountUSD: totalSuspiciousAmount,
    totalSuspiciousAmountINR: totalSuspiciousAmount,
    suspectedViolations: [
      'PMLA 2002 § 12 - Evasion of reporting & maintenance of records',
      'PMLA 2002 § 3 - Offence of money-laundering & projection of untainted property',
      'RBI Master Direction - Know Your Customer (KYC) Direction Chapter VI',
      'FATF Recommendation 10 & 16 - Wire Transfers and Beneficial Ownership Transparency',
      ...(account.sanctionsListed ? ['UNSC Sanctions Committee / Section 51A UAPA List Matching'] : [])
    ],
    executiveSummary,
    detailedNarrative,
    lawEnforcementReferralRecommended: alert.riskScore >= 75 || alert.severity === 'CRITICAL',
    involvedCounterparties: counterpartyList.slice(0, 10),
    evidenceTransactions: relatedTransactions.map(t => ({
      id: t.id,
      amount: t.amount,
      date: t.timestamp,
      channel: t.channel,
    })),
  };

  return sarReport;
}

export async function askComplianceCopilot(params: {
  query: string;
  context: {
    totalAlerts: number;
    highRiskEntities: string[];
    recentPatterns: string[];
  };
}): Promise<string> {
  const ai = getGenAI();
  if (!ai) {
    return `AML Assistant (Offline Mode): Surveillance monitoring is active across ${params.context.totalAlerts} open alerts with INR (₹) denominated transactions. High-risk accounts include ${params.context.highRiskEntities.slice(0, 3).join(', ')}. Active typologies: ${params.context.recentPatterns.join(', ')}. Standard reporting threshold: ₹10,00,000 CTR (PMLA/FIU-IND).`;
  }

  try {
    const prompt = `
You are an expert AML/CFT compliance assistant for a tier-1 financial institution operating in Indian and global markets (INR currency, PMLA 2002, FIU-IND, RBI Master Directions, FATF 40 Recommendations).
Context:
- Open Alerts: ${params.context.totalAlerts}
- High-Risk Flagged Entities: ${params.context.highRiskEntities.join(', ')}
- Detected Typologies: ${params.context.recentPatterns.join(', ')}
- Currency: Indian Rupee (INR / ₹)
- CTR Standard Threshold: ₹10,00,000 (10 Lakhs) under PMLA

User Query: "${params.query}"

Provide a concise, precise, expert response referencing relevant regulatory standards (FIU-IND, PMLA 2002, RBI AML, FATF, FinCEN BSA). Format monetary amounts in INR (₹ Lakhs / ₹ Crores). Keep the answer practical and actionable for an AML analyst.
`;
    const res = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });
    return res.text || 'No response generated.';
  } catch (err: any) {
    return `Assistant could not process query: ${err.message || 'Unknown error'}`;
  }
}
