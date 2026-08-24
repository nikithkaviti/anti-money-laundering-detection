export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskTier = RiskSeverity;

export type AlertStatus = 'PENDING' | 'UNDER_REVIEW' | 'ESCALATED' | 'DISMISSED_FP' | 'SAR_FILED';

export type PatternType = 
  | 'STRUCTURING' 
  | 'LAYERING_CHAIN' 
  | 'CIRCULAR_ROUTING' 
  | 'RAPID_DISPERSAL' 
  | 'SANCTIONS_PEPS' 
  | 'VELOCITY_SURGE'
  | 'ROUND_AMOUNT_ANOMALY';

export type AccountType = 
  | 'INDIVIDUAL' 
  | 'SHELL_CORP' 
  | 'OFFSHORE_LLC' 
  | 'CRYPTO_EXCHANGE' 
  | 'IMPORT_EXPORT' 
  | 'RETAIL_BUSINESS' 
  | 'PRIVATE_BANKING'
  | 'CORRESPONDENT_BANK';

export type TransactionStatus = 'NORMAL' | 'SUSPICIOUS' | 'FLAGGED' | 'BLOCKED';

export interface Account {
  id: string;
  accountNumber: string;
  accountHolderName: string;
  accountType: AccountType;
  jurisdiction: string;
  jurisdictionRisk: RiskSeverity;
  totalInflow: number;
  totalOutflow: number;
  balance: number;
  currency: string;
  transactionCount: number;
  riskScore: number; // 0 - 100
  riskTier: RiskSeverity;
  kycStatus: 'VERIFIED' | 'ENHANCED_DUE_DILIGENCE' | 'SANCTION_MATCH' | 'UNVERIFIED';
  isPEP: boolean; // Politically Exposed Person
  sanctionsListed: boolean;
  centralityScore: number;
  degreeIn: number;
  degreeOut: number;
  createdDate: string;
  avatarUrl?: string;
}

export interface Transaction {
  id: string;
  referenceNumber: string;
  senderId: string;
  senderName: string;
  senderType: AccountType;
  senderJurisdiction: string;
  receiverId: string;
  receiverName: string;
  receiverType: AccountType;
  receiverJurisdiction: string;
  amount: number;
  currency: string;
  timestamp: string; // ISO string
  channel: 'SWIFT' | 'ACH' | 'CRYPTO_TRANSFER' | 'WIRE' | 'CASH_DEPOSIT' | 'CARD' | 'NEFT' | 'RTGS' | 'UPI' | 'IMPS';
  riskScore: number; // 0 - 100
  flaggedPatterns: PatternType[];
  status: TransactionStatus;
  notes?: string;
  tags?: string[];
}

export interface Alert {
  id: string;
  transactionId?: string;
  primaryAccountId: string;
  entityName: string;
  title: string;
  severity: RiskSeverity;
  riskScore: number;
  patternType: PatternType;
  triggerReason: string;
  status: AlertStatus;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  notes: Array<{ author: string; timestamp: string; text: string }>;
  evidence: {
    loopPath?: string[];
    structuringTransactions?: Array<{ id: string; amount: number; timestamp: string }>;
    multiHopSequence?: string[];
    velocityMetric?: { countInWindow: number; timeWindowMinutes: number; totalAmount: number };
    anomalyScores?: {
      amountAnomaly: number;
      velocityAnomaly: number;
      graphCentralityAnomaly: number;
      jurisdictionRiskMultiplier: number;
    };
  };
  sarReportId?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  accountNumber: string;
  accountType: AccountType;
  riskScore: number;
  riskTier: RiskSeverity;
  jurisdiction: string;
  balance: number;
  isPEP: boolean;
  sanctionsListed: boolean;
  isFlagged: boolean;
  activeAlertCount: number;
  totalVolume: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  amount: number;
  currency: string;
  timestamp: string;
  riskScore: number;
  isSuspicious: boolean;
  patternType?: PatternType;
  channel: string;
  count?: number;
}

export interface AMLGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface AMLRule {
  id: string;
  name: string;
  code: PatternType;
  description: string;
  thresholdAmount: number;
  timeWindowHours: number;
  minTransactionsForBurst: number;
  riskWeight: number; // 10 - 50
  isEnabled: boolean;
}

export interface AMLRuleConfig {
  structuringThresholdUSD?: number;
  structuringLowerBoundUSD?: number;
  structuringThresholdINR: number;
  structuringLowerBoundINR: number;
  structuringTimeWindowHours: number;
  structuringMinTransactions: number;
  cycleMaxHops: number;
  cycleTimeWindowHours: number;
  dispersionMinOutflows: number;
  dispersionTimeWindowHours: number;
  velocitySurgeMultiplier: number;
  criticalRiskThreshold: number;
  highRiskThreshold: number;
}

export interface SystemKPIs {
  totalTransactions: number;
  totalVolumeUSD: number;
  flaggedVolumeUSD: number;
  totalVolumeINR?: number;
  flaggedVolumeINR?: number;
  flaggedTransactionsCount: number;
  highRiskAccountsCount: number;
  activeInvestigationsCount: number;
  sarFiledCount: number;
  falsePositiveRate: number;
  patternDistribution: Record<PatternType, number>;
  severityDistribution: Record<RiskSeverity, number>;
  hourlyVelocity: Array<{ hour: string; normalCount: number; flaggedCount: number }>;
}

export interface SARReport {
  id: string;
  alertId: string;
  subjectAccountId: string;
  subjectName: string;
  filingDate: string;
  reportingOfficer: string;
  fincenTrackingNumber: string;
  totalSuspiciousAmountUSD: number;
  totalSuspiciousAmountINR?: number;
  suspectedViolations: string[];
  executiveSummary: string;
  detailedNarrative: string;
  lawEnforcementReferralRecommended: boolean;
  involvedCounterparties: Array<{ name: string; account: string; role: string; jurisdiction: string }>;
  evidenceTransactions: Array<{ id: string; amount: number; date: string; channel: string }>;
}
