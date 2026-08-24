import { Account, Transaction, Alert, PatternType, RiskSeverity, AMLRule, AMLGraphData, GraphNode, GraphLink, AMLRuleConfig } from '../src/types.js';

export const HIGH_RISK_JURISDICTIONS = new Set([
  'Panama', 'Cayman Islands', 'British Virgin Islands', 'Cyprus', 
  'Belize', 'Seychelles', 'Vanuatu', 'Malta', 'Gibraltar', 'United Arab Emirates', 'Bahamas'
]);

export const SANCTIONED_JURISDICTIONS = new Set([
  'North Korea', 'Iran', 'Syria', 'Myanmar', 'Russia', 'Cuba'
]);

export const DEFAULT_AML_RULE_CONFIG: AMLRuleConfig = {
  structuringThresholdUSD: 1000000,
  structuringLowerBoundUSD: 700000,
  structuringThresholdINR: 1000000,
  structuringLowerBoundINR: 700000,
  structuringTimeWindowHours: 72,
  structuringMinTransactions: 3,
  cycleMaxHops: 5,
  cycleTimeWindowHours: 168,
  dispersionMinOutflows: 4,
  dispersionTimeWindowHours: 24,
  velocitySurgeMultiplier: 3.5,
  criticalRiskThreshold: 80,
  highRiskThreshold: 60,
};

export const DEFAULT_AML_RULES: AMLRule[] = [
  {
    id: 'RULE_STRUCTURING',
    name: 'Structuring / Smurfing Evasion Detector',
    code: 'STRUCTURING',
    description: 'Detects repetitive deposits between ₹7,00,000 and ₹9,99,999 to evade ₹10,00,000 (10 Lakhs) CTR reporting threshold within 72 hours.',
    thresholdAmount: 1000000,
    timeWindowHours: 72,
    minTransactionsForBurst: 3,
    riskWeight: 35,
    isEnabled: true,
  },
  {
    id: 'RULE_CIRCULAR',
    name: 'Circular Fund Routing & Graph Cycle Analysis',
    code: 'CIRCULAR_ROUTING',
    description: 'Identifies closed graph cycles (A -> B -> C -> ... -> A) used to wash funds and obscure the beneficial origin.',
    thresholdAmount: 25000,
    timeWindowHours: 168, // 7 days
    minTransactionsForBurst: 3,
    riskWeight: 45,
    isEnabled: true,
  },
  {
    id: 'RULE_RAPID_DISPERSAL',
    name: 'Rapid Layering & Fan-Out Dispersion',
    code: 'RAPID_DISPERSAL',
    description: 'Detects significant incoming capital quickly fragmented into 3+ downstream offshore or crypto accounts within 4 hours.',
    thresholdAmount: 50000,
    timeWindowHours: 4,
    minTransactionsForBurst: 3,
    riskWeight: 40,
    isEnabled: true,
  },
  {
    id: 'RULE_SANCTIONS_PEPS',
    name: 'PEP & High-Risk Jurisdiction Nexus',
    code: 'SANCTIONS_PEPS',
    description: 'Flags flows involving Politically Exposed Persons (PEPs) or entities registered in FATF non-cooperative tax havens.',
    thresholdAmount: 15000,
    timeWindowHours: 24,
    minTransactionsForBurst: 1,
    riskWeight: 50,
    isEnabled: true,
  },
  {
    id: 'RULE_VELOCITY_SURGE',
    name: 'Unusual Volume & Velocity Anomaly',
    code: 'VELOCITY_SURGE',
    description: 'Flags accounts experiencing a 400%+ sudden surge in transaction frequency or volume compared to baseline historical activity.',
    thresholdAmount: 30000,
    timeWindowHours: 12,
    minTransactionsForBurst: 4,
    riskWeight: 30,
    isEnabled: true,
  },
];

export class AMLEngine {
  private accounts: Map<string, Account> = new Map();
  private transactions: Transaction[] = [];
  private alerts: Alert[] = [];
  private rules: AMLRule[] = [...DEFAULT_AML_RULES];
  private ruleConfig: AMLRuleConfig = { ...DEFAULT_AML_RULE_CONFIG };

  constructor(initialAccounts?: Account[], initialTransactions?: Transaction[], initialAlerts?: Alert[]) {
    if (initialAccounts) {
      initialAccounts.forEach(acc => this.accounts.set(acc.id, acc));
    }
    if (initialTransactions) {
      this.transactions = [...initialTransactions];
    }
    if (initialAlerts) {
      this.alerts = [...initialAlerts];
    }
  }

  public getAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  public getAccount(id: string): Account | undefined {
    return this.accounts.get(id);
  }

  public getTransactions(): Transaction[] {
    return this.transactions;
  }

  public getAlerts(): Alert[] {
    return this.alerts;
  }

  public getRules(): AMLRule[] {
    return this.rules;
  }

  public getRuleConfig(): AMLRuleConfig {
    return this.ruleConfig;
  }

  public setRuleConfig(config: Partial<AMLRuleConfig>): AMLRuleConfig {
    this.ruleConfig = { ...this.ruleConfig, ...config };
    return this.ruleConfig;
  }

  public updateRule(ruleId: string, updates: Partial<AMLRule>): boolean {
    const idx = this.rules.findIndex(r => r.id === ruleId);
    if (idx !== -1) {
      this.rules[idx] = { ...this.rules[idx], ...updates };
      return true;
    }
    return false;
  }

  public updateAlertStatus(alertId: string, status: Alert['status'], officerNotes?: string, assignedTo?: string): Alert | null {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return null;

    alert.status = status;
    alert.updatedAt = new Date().toISOString();
    if (assignedTo) alert.assignedTo = assignedTo;
    if (officerNotes) {
      alert.notes.push({
        author: assignedTo || 'Compliance Officer',
        timestamp: new Date().toISOString(),
        text: officerNotes,
      });
    }
    return alert;
  }

  public addAccount(account: Account): void {
    this.accounts.set(account.id, account);
  }

  /**
   * Ingest single or batch transactions and run detection models
   */
  public ingestTransaction(tx: Omit<Transaction, 'riskScore' | 'flaggedPatterns' | 'status'> & { riskScore?: number; flaggedPatterns?: PatternType[]; status?: Transaction['status'] }): { transaction: Transaction; generatedAlerts: Alert[] } {
    const sender = this.accounts.get(tx.senderId);
    const receiver = this.accounts.get(tx.receiverId);

    // Auto register unknown accounts if needed
    if (!sender) {
      const newSender: Account = {
        id: tx.senderId,
        accountNumber: `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
        accountHolderName: tx.senderName,
        accountType: tx.senderType || 'INDIVIDUAL',
        jurisdiction: tx.senderJurisdiction || 'United States',
        jurisdictionRisk: HIGH_RISK_JURISDICTIONS.has(tx.senderJurisdiction) ? 'HIGH' : 'LOW',
        totalInflow: 0,
        totalOutflow: tx.amount,
        balance: 100000 - tx.amount,
        currency: tx.currency,
        transactionCount: 1,
        riskScore: 20,
        riskTier: 'LOW',
        kycStatus: 'VERIFIED',
        isPEP: false,
        sanctionsListed: false,
        centralityScore: 0.1,
        degreeIn: 0,
        degreeOut: 1,
        createdDate: new Date().toISOString(),
      };
      this.accounts.set(newSender.id, newSender);
    } else {
      sender.totalOutflow += tx.amount;
      sender.balance -= tx.amount;
      sender.transactionCount += 1;
      sender.degreeOut += 1;
    }

    if (!receiver) {
      const newReceiver: Account = {
        id: tx.receiverId,
        accountNumber: `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
        accountHolderName: tx.receiverName,
        accountType: tx.receiverType || 'INDIVIDUAL',
        jurisdiction: tx.receiverJurisdiction || 'United States',
        jurisdictionRisk: HIGH_RISK_JURISDICTIONS.has(tx.receiverJurisdiction) ? 'HIGH' : 'LOW',
        totalInflow: tx.amount,
        totalOutflow: 0,
        balance: tx.amount,
        currency: tx.currency,
        transactionCount: 1,
        riskScore: 20,
        riskTier: 'LOW',
        kycStatus: 'VERIFIED',
        isPEP: false,
        sanctionsListed: false,
        centralityScore: 0.1,
        degreeIn: 1,
        degreeOut: 0,
        createdDate: new Date().toISOString(),
      };
      this.accounts.set(newReceiver.id, newReceiver);
    } else {
      receiver.totalInflow += tx.amount;
      receiver.balance += tx.amount;
      receiver.transactionCount += 1;
      receiver.degreeIn += 1;
    }

    // Evaluate Transaction Rules & Anomaly
    const { riskScore, flaggedPatterns, candidateAlerts } = this.evaluateTransaction(tx);

    const completeTx: Transaction = {
      ...tx,
      riskScore,
      flaggedPatterns,
      status: riskScore >= 75 ? 'FLAGGED' : riskScore >= 50 ? 'SUSPICIOUS' : 'NORMAL',
    };

    this.transactions.push(completeTx);

    // Save alerts
    candidateAlerts.forEach(alert => {
      this.alerts.unshift(alert);
    });

    // Recalculate account risk scores
    this.recalculateAccountRisks();

    return { transaction: completeTx, generatedAlerts: candidateAlerts };
  }

  /**
   * Run multi-model AML detection rules on a single transaction and its graph neighborhood
   */
  private evaluateTransaction(tx: Omit<Transaction, 'riskScore' | 'flaggedPatterns' | 'status'>): {
    riskScore: number;
    flaggedPatterns: PatternType[];
    candidateAlerts: Alert[];
  } {
    const flaggedPatterns: PatternType[] = [];
    const candidateAlerts: Alert[] = [];
    let baseScore = 5;

    const sender = this.accounts.get(tx.senderId);
    const receiver = this.accounts.get(tx.receiverId);
    const txTime = new Date(tx.timestamp).getTime();

    // 1. Check PEP & Sanctioned / High Risk Jurisdictions
    const isSenderHighRisk = sender?.jurisdictionRisk === 'HIGH' || HIGH_RISK_JURISDICTIONS.has(tx.senderJurisdiction);
    const isReceiverHighRisk = receiver?.jurisdictionRisk === 'HIGH' || HIGH_RISK_JURISDICTIONS.has(tx.receiverJurisdiction);
    const isSenderSanctioned = SANCTIONED_JURISDICTIONS.has(tx.senderJurisdiction) || sender?.sanctionsListed;
    const isReceiverSanctioned = SANCTIONED_JURISDICTIONS.has(tx.receiverJurisdiction) || receiver?.sanctionsListed;
    const isPepInvolved = sender?.isPEP || receiver?.isPEP;

    if (isSenderSanctioned || isReceiverSanctioned) {
      baseScore += 65;
      flaggedPatterns.push('SANCTIONS_PEPS');
      candidateAlerts.push(this.createAlert({
        transactionId: tx.id,
        primaryAccountId: isSenderSanctioned ? tx.senderId : tx.receiverId,
        entityName: isSenderSanctioned ? tx.senderName : tx.receiverName,
        title: 'Direct OFAC/Sanctions Regime Nexus Match',
        severity: 'CRITICAL',
        riskScore: 98,
        patternType: 'SANCTIONS_PEPS',
        triggerReason: `Transaction routed through sanctioned jurisdiction (${isSenderSanctioned ? tx.senderJurisdiction : tx.receiverJurisdiction}) or designated entity.`,
        evidence: {
          anomalyScores: { amountAnomaly: 0.8, velocityAnomaly: 0.5, graphCentralityAnomaly: 0.9, jurisdictionRiskMultiplier: 4.0 }
        }
      }));
    } else if (isPepInvolved || isSenderHighRisk || isReceiverHighRisk) {
      baseScore += 30;
      flaggedPatterns.push('SANCTIONS_PEPS');
      if (tx.amount > 20000) {
        candidateAlerts.push(this.createAlert({
          transactionId: tx.id,
          primaryAccountId: isPepInvolved ? (sender?.isPEP ? tx.senderId : tx.receiverId) : tx.senderId,
          entityName: isPepInvolved ? (sender?.isPEP ? tx.senderName : tx.receiverName) : tx.senderName,
          title: 'Politically Exposed Person (PEP) / Tax-Haven Fund Flow',
          severity: 'HIGH',
          riskScore: 78,
          patternType: 'SANCTIONS_PEPS',
          triggerReason: `High-value transfer (₹${tx.amount.toLocaleString('en-IN')}) connected to PEP / Offshore jurisdiction (${tx.senderJurisdiction} -> ${tx.receiverJurisdiction}).`,
          evidence: {
            anomalyScores: { amountAnomaly: 0.65, velocityAnomaly: 0.4, graphCentralityAnomaly: 0.7, jurisdictionRiskMultiplier: 2.5 }
          }
        }));
      }
    }

    // 2. Structuring / Smurfing Evasion (Amounts near CTR threshold or burst of deposits)
    const structuringThreshold = this.ruleConfig.structuringThresholdINR || this.ruleConfig.structuringThresholdUSD || 1000000;
    const structuringLowerBound = this.ruleConfig.structuringLowerBoundINR || this.ruleConfig.structuringLowerBoundUSD || 700000;
    const isNearCTR = tx.amount >= structuringLowerBound && tx.amount < structuringThreshold;
    const structuringWindow = (this.ruleConfig.structuringTimeWindowHours || 72) * 60 * 60 * 1000;
    const recentSenderDeposits = this.transactions.filter(t => 
      t.senderId === tx.senderId && 
      Math.abs(txTime - new Date(t.timestamp).getTime()) <= structuringWindow &&
      t.amount >= structuringLowerBound && t.amount < structuringThreshold
    );

    const recentReceiverAggregations = this.transactions.filter(t =>
      t.receiverId === tx.receiverId &&
      Math.abs(txTime - new Date(t.timestamp).getTime()) <= structuringWindow &&
      t.amount >= structuringLowerBound && t.amount < structuringThreshold
    );

    const minStructuredCount = this.ruleConfig.structuringMinTransactions || 3;

    if (isNearCTR || (recentSenderDeposits.length + 1) >= minStructuredCount || (recentReceiverAggregations.length + 1) >= minStructuredCount) {
      baseScore += 35;
      flaggedPatterns.push('STRUCTURING');
      
      const relatedTxs = [...recentSenderDeposits, ...recentReceiverAggregations].map(t => ({
        id: t.id,
        amount: t.amount,
        timestamp: t.timestamp
      }));
      relatedTxs.push({ id: tx.id, amount: tx.amount, timestamp: tx.timestamp });

      candidateAlerts.push(this.createAlert({
        transactionId: tx.id,
        primaryAccountId: recentReceiverAggregations.length >= 2 ? tx.receiverId : tx.senderId,
        entityName: recentReceiverAggregations.length >= 2 ? tx.receiverName : tx.senderName,
        title: 'CTR Evasion / Smurfing Pattern Detected',
        severity: relatedTxs.length >= 4 ? 'CRITICAL' : 'HIGH',
        riskScore: Math.min(95, 65 + relatedTxs.length * 7),
        patternType: 'STRUCTURING',
        triggerReason: `Repeated structured deposits (₹${structuringLowerBound.toLocaleString('en-IN')} - ₹${(structuringThreshold - 1).toLocaleString('en-IN')}) totaling ₹${relatedTxs.reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')} within ${this.ruleConfig.structuringTimeWindowHours}h window to bypass ₹${structuringThreshold.toLocaleString('en-IN')} PMLA/FIU-IND CTR reporting.`,
        evidence: {
          structuringTransactions: relatedTxs,
          velocityMetric: {
            countInWindow: relatedTxs.length,
            timeWindowMinutes: this.ruleConfig.structuringTimeWindowHours * 60,
            totalAmount: relatedTxs.reduce((sum, t) => sum + t.amount, 0),
          },
          anomalyScores: { amountAnomaly: 0.9, velocityAnomaly: 0.85, graphCentralityAnomaly: 0.4, jurisdictionRiskMultiplier: 1.2 }
        }
      }));
    }

    // 3. Round Amount Anomaly
    if (tx.amount >= 1000000 && tx.amount % 500000 === 0) {
      baseScore += 10;
      flaggedPatterns.push('ROUND_AMOUNT_ANOMALY');
    }

    // 4. Graph Cycle / Circular Fund Routing Analysis
    const maxCycleHops = this.ruleConfig.cycleMaxHops || 5;
    const cycle = this.detectCircularCycle(tx.receiverId, tx.senderId, maxCycleHops);
    if (cycle && cycle.length >= 3) {
      baseScore += 45;
      flaggedPatterns.push('CIRCULAR_ROUTING');
      const loopNames = cycle.map(id => this.accounts.get(id)?.accountHolderName || id);
      loopNames.push(tx.senderName);

      candidateAlerts.push(this.createAlert({
        transactionId: tx.id,
        primaryAccountId: tx.senderId,
        entityName: tx.senderName,
        title: `Circular Fund Loop (${cycle.length + 1} Hops) Detected`,
        severity: 'CRITICAL',
        riskScore: 92,
        patternType: 'CIRCULAR_ROUTING',
        triggerReason: `Funds originate from ${tx.senderName} and loop through ${cycle.length} intermediaries before returning to the original cluster.`,
        evidence: {
          loopPath: loopNames,
          multiHopSequence: cycle,
          anomalyScores: { amountAnomaly: 0.7, velocityAnomaly: 0.6, graphCentralityAnomaly: 0.95, jurisdictionRiskMultiplier: 2.0 }
        }
      }));
    }

    // 5. Rapid Layering & Dispersion (Fan-Out)
    const dispersionWindow = (this.ruleConfig.dispersionTimeWindowHours || 4) * 60 * 60 * 1000;
    const minOutflows = this.ruleConfig.dispersionMinOutflows || 3;
    const recentInflowsToSender = this.transactions.filter(t =>
      t.receiverId === tx.senderId &&
      (txTime - new Date(t.timestamp).getTime()) >= 0 &&
      (txTime - new Date(t.timestamp).getTime()) <= dispersionWindow &&
      t.amount >= 2000000
    );

    const recentOutflowsFromSender = this.transactions.filter(t =>
      t.senderId === tx.senderId &&
      Math.abs(txTime - new Date(t.timestamp).getTime()) <= dispersionWindow
    );

    if (recentInflowsToSender.length > 0 && recentOutflowsFromSender.length >= minOutflows) {
      const totalIn = recentInflowsToSender.reduce((s, t) => s + t.amount, 0);
      const totalOut = recentOutflowsFromSender.reduce((s, t) => s + t.amount, 0) + tx.amount;
      
      if (totalOut >= totalIn * 0.65) {
        baseScore += 35;
        flaggedPatterns.push('RAPID_DISPERSAL');
        candidateAlerts.push(this.createAlert({
          transactionId: tx.id,
          primaryAccountId: tx.senderId,
          entityName: tx.senderName,
          title: 'Rapid Layering / Fan-Out Fund Dispersion',
          severity: 'HIGH',
          riskScore: 84,
          patternType: 'RAPID_DISPERSAL',
          triggerReason: `Inflow of ₹${totalIn.toLocaleString('en-IN')} dispersed into ${recentOutflowsFromSender.length + 1} recipient accounts within ${this.ruleConfig.dispersionTimeWindowHours} hours (pass-through shell behavior).`,
          evidence: {
            velocityMetric: {
              countInWindow: recentOutflowsFromSender.length + 1,
              timeWindowMinutes: this.ruleConfig.dispersionTimeWindowHours * 60,
              totalAmount: totalOut
            },
            anomalyScores: { amountAnomaly: 0.82, velocityAnomaly: 0.9, graphCentralityAnomaly: 0.8, jurisdictionRiskMultiplier: 1.8 }
          }
        }));
      }
    }

    // 6. Velocity Surge
    const velocityWindow = 12 * 60 * 60 * 1000;
    const sender12hTxs = this.transactions.filter(t => 
      (t.senderId === tx.senderId || t.receiverId === tx.senderId) &&
      Math.abs(txTime - new Date(t.timestamp).getTime()) <= velocityWindow
    );
    if (sender12hTxs.length >= 6) {
      baseScore += 20;
      flaggedPatterns.push('VELOCITY_SURGE');
    }

    // Cap riskScore between 0 and 100
    const finalRiskScore = Math.min(99, Math.max(1, baseScore));

    return {
      riskScore: finalRiskScore,
      flaggedPatterns: Array.from(new Set(flaggedPatterns)),
      candidateAlerts,
    };
  }

  /**
   * Graph Cycle / Loop Detection using DFS with max depth
   */
  private detectCircularCycle(startNode: string, targetNode: string, maxDepth: number): string[] | null {
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (current: string, depth: number): boolean => {
      if (depth > maxDepth) return false;
      if (current === targetNode) {
        path.push(current);
        return true;
      }
      if (visited.has(current)) return false;

      visited.add(current);
      path.push(current);

      // Find outbound transactions from current node
      const outbound = this.transactions
        .filter(t => t.senderId === current)
        .map(t => t.receiverId);

      for (const nextNode of outbound) {
        if (dfs(nextNode, depth + 1)) {
          return true;
        }
      }

      path.pop();
      return false;
    };

    if (dfs(startNode, 1)) {
      return path;
    }
    return null;
  }

  private createAlert(params: {
    transactionId?: string;
    primaryAccountId: string;
    entityName: string;
    title: string;
    severity: RiskSeverity;
    riskScore: number;
    patternType: PatternType;
    triggerReason: string;
    evidence: Alert['evidence'];
  }): Alert {
    return {
      id: `ALT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      transactionId: params.transactionId,
      primaryAccountId: params.primaryAccountId,
      entityName: params.entityName,
      title: params.title,
      severity: params.severity,
      riskScore: params.riskScore,
      patternType: params.patternType,
      triggerReason: params.triggerReason,
      status: 'PENDING',
      assignedTo: 'Compliance Officer (Tier 1)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: [
        {
          author: 'AML Detection Engine',
          timestamp: new Date().toISOString(),
          text: `Automated alert triggered by rule engine: ${params.patternType} pattern identified.`
        }
      ],
      evidence: params.evidence
    };
  }

  /**
   * Updates risk score and risk tier of all registered accounts
   */
  public recalculateAccountRisks(): void {
    this.accounts.forEach(account => {
      const accountTxs = this.transactions.filter(t => t.senderId === account.id || t.receiverId === account.id);
      const accountAlerts = this.alerts.filter(a => a.primaryAccountId === account.id && a.status !== 'DISMISSED_FP');

      let risk = 15;
      if (account.jurisdictionRisk === 'HIGH') risk += 25;
      if (account.jurisdictionRisk === 'CRITICAL') risk += 45;
      if (account.isPEP) risk += 30;
      if (account.sanctionsListed) risk += 60;
      if (account.accountType === 'SHELL_CORP' || account.accountType === 'OFFSHORE_LLC') risk += 20;

      // Add alert risk
      accountAlerts.forEach(a => {
        if (a.severity === 'CRITICAL') risk += 35;
        else if (a.severity === 'HIGH') risk += 20;
        else if (a.severity === 'MEDIUM') risk += 10;
      });

      // Centrality / Degree multiplier
      const totalDegree = account.degreeIn + account.degreeOut;
      if (totalDegree > 10) risk += 10;

      const finalScore = Math.min(99, Math.max(5, risk));
      account.riskScore = finalScore;
      account.riskTier = finalScore >= 80 ? 'CRITICAL' : finalScore >= 60 ? 'HIGH' : finalScore >= 35 ? 'MEDIUM' : 'LOW';
      account.centralityScore = Math.min(1.0, totalDegree / Math.max(1, this.transactions.length * 0.1));
    });
  }

  /**
   * Builds Graph payload for interactive D3 / network graph visualizer
   */
  public getGraphData(options?: { accountId?: string; minRisk?: number; pattern?: string; maxHops?: number }): AMLGraphData {
    const minRisk = options?.minRisk || 0;
    const patternFilter = options?.pattern;
    const focusAccountId = options?.accountId;

    let relevantTxs = this.transactions;

    if (focusAccountId) {
      // Collect nodes up to maxHops (default 2)
      const allowedNodes = new Set<string>([focusAccountId]);
      const maxHops = options?.maxHops || 2;

      for (let hop = 0; hop < maxHops; hop++) {
        const currentNodes = Array.from(allowedNodes);
        this.transactions.forEach(t => {
          if (currentNodes.includes(t.senderId)) allowedNodes.add(t.receiverId);
          if (currentNodes.includes(t.receiverId)) allowedNodes.add(t.senderId);
        });
      }

      relevantTxs = this.transactions.filter(t => allowedNodes.has(t.senderId) && allowedNodes.has(t.receiverId));
    }

    if (patternFilter && patternFilter !== 'ALL') {
      relevantTxs = relevantTxs.filter(t => t.flaggedPatterns.includes(patternFilter as PatternType));
    }

    const nodeIds = new Set<string>();
    relevantTxs.forEach(t => {
      nodeIds.add(t.senderId);
      nodeIds.add(t.receiverId);
    });

    const nodes: GraphNode[] = [];
    nodeIds.forEach(id => {
      const acc = this.accounts.get(id);
      if (acc && acc.riskScore >= minRisk) {
        const activeAlerts = this.alerts.filter(a => a.primaryAccountId === id && a.status !== 'DISMISSED_FP').length;
        nodes.push({
          id: acc.id,
          label: acc.accountHolderName,
          accountNumber: acc.accountNumber,
          accountType: acc.accountType,
          riskScore: acc.riskScore,
          riskTier: acc.riskTier,
          jurisdiction: acc.jurisdiction,
          balance: acc.balance,
          isPEP: acc.isPEP,
          sanctionsListed: acc.sanctionsListed,
          isFlagged: activeAlerts > 0 || acc.riskScore >= 70,
          activeAlertCount: activeAlerts,
          totalVolume: acc.totalInflow + acc.totalOutflow,
        });
      }
    });

    const validNodeIdSet = new Set(nodes.map(n => n.id));
    const validTxs = relevantTxs.filter(t => validNodeIdSet.has(t.senderId) && validNodeIdSet.has(t.receiverId));

    // Aggregate links between identical sender/receiver
    const linkMap = new Map<string, GraphLink>();
    validTxs.forEach(t => {
      const key = `${t.senderId}->${t.receiverId}`;
      if (linkMap.has(key)) {
        const existing = linkMap.get(key)!;
        existing.amount += t.amount;
        existing.count = (existing.count || 1) + 1;
        existing.riskScore = Math.max(existing.riskScore, t.riskScore);
        if (t.riskScore >= 60) existing.isSuspicious = true;
      } else {
        linkMap.set(key, {
          id: t.id,
          source: t.senderId,
          target: t.receiverId,
          amount: t.amount,
          currency: t.currency,
          timestamp: t.timestamp,
          riskScore: t.riskScore,
          isSuspicious: t.riskScore >= 60 || t.flaggedPatterns.length > 0,
          patternType: t.flaggedPatterns[0],
          channel: t.channel,
          count: 1,
        });
      }
    });

    return {
      nodes,
      links: Array.from(linkMap.values()),
    };
  }
}
