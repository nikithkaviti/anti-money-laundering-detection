import { Router } from 'express';
import { AMLEngine } from './amlEngine.js';
import { generateInitialAMLDataset } from './mockDataGenerator.js';
import { generateSARReportWithGemini, askComplianceCopilot } from './geminiService.js';
import { SystemKPIs, RiskSeverity, PatternType, SARReport, AMLRuleConfig } from '../src/types.js';

export function createAMLRouter(): Router {
  const router = Router();

  // Initialize dataset and engine
  const initialData = generateInitialAMLDataset();
  const amlEngine = new AMLEngine(initialData.accounts, initialData.transactions, initialData.alerts);
  const sarReportsMap = new Map<string, SARReport>();

  // Helper to compute system KPIs
  const getComputedKPIs = (): SystemKPIs => {
    const txs = amlEngine.getTransactions();
    const accounts = amlEngine.getAccounts();
    const alerts = amlEngine.getAlerts();

    const totalTransactions = txs.length;
    const totalVolumeUSD = txs.reduce((s, t) => s + t.amount, 0);
    const flaggedTxs = txs.filter(t => t.riskScore >= 60 || t.status === 'FLAGGED' || t.status === 'SUSPICIOUS');
    const flaggedVolumeUSD = flaggedTxs.reduce((s, t) => s + t.amount, 0);

    const highRiskAccountsCount = accounts.filter(a => a.riskScore >= 70 || a.riskTier === 'CRITICAL' || a.riskTier === 'HIGH').length;
    const activeInvestigationsCount = alerts.filter(a => a.status === 'PENDING' || a.status === 'UNDER_REVIEW' || a.status === 'ESCALATED').length;
    const sarFiledCount = alerts.filter(a => a.status === 'SAR_FILED').length + sarReportsMap.size;
    const dismissedFPCount = alerts.filter(a => a.status === 'DISMISSED_FP').length;
    const totalClosedAlerts = dismissedFPCount + sarFiledCount;
    const falsePositiveRate = totalClosedAlerts > 0 ? Math.round((dismissedFPCount / totalClosedAlerts) * 100) : 4.2;

    const patternDistribution: Record<PatternType, number> = {
      STRUCTURING: 0,
      LAYERING_CHAIN: 0,
      CIRCULAR_ROUTING: 0,
      RAPID_DISPERSAL: 0,
      SANCTIONS_PEPS: 0,
      VELOCITY_SURGE: 0,
      ROUND_AMOUNT_ANOMALY: 0,
    };

    alerts.forEach(a => {
      if (patternDistribution[a.patternType] !== undefined) {
        patternDistribution[a.patternType] += 1;
      }
    });

    const severityDistribution: Record<RiskSeverity, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    alerts.forEach(a => {
      if (severityDistribution[a.severity] !== undefined) {
        severityDistribution[a.severity] += 1;
      }
    });

    // Hourly velocity distribution for timeline chart
    const hourlyMap = new Map<string, { normalCount: number; flaggedCount: number }>();
    const hours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
    hours.forEach(h => hourlyMap.set(h, { normalCount: 0, flaggedCount: 0 }));

    txs.forEach((t, i) => {
      const h = hours[i % hours.length];
      const entry = hourlyMap.get(h)!;
      if (t.riskScore >= 60) {
        entry.flaggedCount += 1;
      } else {
        entry.normalCount += 1;
      }
    });

    const hourlyVelocity = hours.map(h => ({
      hour: h,
      normalCount: hourlyMap.get(h)!.normalCount,
      flaggedCount: hourlyMap.get(h)!.flaggedCount,
    }));

    return {
      totalTransactions,
      totalVolumeUSD,
      flaggedVolumeUSD,
      totalVolumeINR: totalVolumeUSD,
      flaggedVolumeINR: flaggedVolumeUSD,
      flaggedTransactionsCount: flaggedTxs.length,
      highRiskAccountsCount,
      activeInvestigationsCount,
      sarFiledCount,
      falsePositiveRate,
      patternDistribution,
      severityDistribution,
      hourlyVelocity,
    };
  };

  // 1. Health
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 2. Executive KPIs & Analytics (both /kpis and /analytics/kpis)
  router.get('/kpis', (req, res) => {
    res.json(getComputedKPIs());
  });

  router.get('/analytics/kpis', (req, res) => {
    res.json(getComputedKPIs());
  });

  // 3. Transactions List & Filter
  router.get('/transactions', (req, res) => {
    let txs = amlEngine.getTransactions();
    const { search, pattern, status, minAmount, maxAmount, minRisk } = req.query;

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      txs = txs.filter(t => 
        t.referenceNumber.toLowerCase().includes(q) ||
        t.senderName.toLowerCase().includes(q) ||
        t.receiverName.toLowerCase().includes(q) ||
        t.senderJurisdiction.toLowerCase().includes(q) ||
        t.receiverJurisdiction.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    if (pattern && pattern !== 'ALL' && typeof pattern === 'string') {
      txs = txs.filter(t => t.flaggedPatterns.includes(pattern as PatternType));
    }

    if (status && status !== 'ALL' && typeof status === 'string') {
      txs = txs.filter(t => t.status === status);
    }

    if (minAmount) {
      const min = Number(minAmount);
      if (!isNaN(min)) txs = txs.filter(t => t.amount >= min);
    }

    if (maxAmount) {
      const max = Number(maxAmount);
      if (!isNaN(max)) txs = txs.filter(t => t.amount <= max);
    }

    if (minRisk) {
      const r = Number(minRisk);
      if (!isNaN(r)) txs = txs.filter(t => t.riskScore >= r);
    }

    // Sort descending by timestamp
    const sorted = [...txs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(sorted);
  });

  // 4. Ingest Single or Batch Transactions
  router.post('/transactions/ingest', (req, res) => {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ error: 'Request body required' });
    }

    if (Array.isArray(payload)) {
      const results = payload.map(tx => amlEngine.ingestTransaction({
        ...tx,
        id: tx.id || `tx-live-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`,
        referenceNumber: tx.referenceNumber || `TX-LIVE-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: tx.timestamp || new Date().toISOString(),
        currency: tx.currency || 'INR',
        channel: tx.channel || 'WIRE',
      }));
      return res.json({
        ingestedCount: results.length,
        transactions: results.map(r => r.transaction),
        alertsGenerated: results.flatMap(r => r.generatedAlerts),
      });
    } else {
      const result = amlEngine.ingestTransaction({
        ...payload,
        id: payload.id || `tx-live-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`,
        referenceNumber: payload.referenceNumber || `TX-LIVE-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: payload.timestamp || new Date().toISOString(),
        currency: payload.currency || 'INR',
        channel: payload.channel || 'WIRE',
      });
      return res.json(result);
    }
  });

  // 5. Accounts
  router.get('/accounts', (req, res) => {
    const { riskTier, search, jurisdiction } = req.query;
    let accs = amlEngine.getAccounts();

    if (riskTier && riskTier !== 'ALL' && typeof riskTier === 'string') {
      accs = accs.filter(a => a.riskTier === riskTier);
    }

    if (jurisdiction && typeof jurisdiction === 'string') {
      accs = accs.filter(a => a.jurisdiction.toLowerCase().includes(jurisdiction.toLowerCase()));
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      accs = accs.filter(a =>
        a.accountHolderName.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q) ||
        a.jurisdiction.toLowerCase().includes(q)
      );
    }

    res.json(accs.sort((a, b) => b.riskScore - a.riskScore));
  });

  router.get('/accounts/:id', (req, res) => {
    const acc = amlEngine.getAccount(req.params.id);
    if (!acc) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const txs = amlEngine.getTransactions().filter(t => t.senderId === acc.id || t.receiverId === acc.id);
    const alerts = amlEngine.getAlerts().filter(a => a.primaryAccountId === acc.id);

    res.json({
      account: acc,
      transactions: txs,
      alerts: alerts,
    });
  });

  // 6. Graph Topology
  router.get('/graph', (req, res) => {
    const { accountId, minRisk, pattern, maxHops } = req.query;
    const graphData = amlEngine.getGraphData({
      accountId: accountId as string | undefined,
      minRisk: minRisk ? Number(minRisk) : 0,
      pattern: pattern as string | undefined,
      maxHops: maxHops ? Number(maxHops) : 2,
    });
    res.json(graphData);
  });

  // 7. Alerts & Case Management
  router.get('/alerts', (req, res) => {
    const { status, severity, pattern } = req.query;
    let alerts = amlEngine.getAlerts();

    if (status && status !== 'ALL' && typeof status === 'string') {
      alerts = alerts.filter(a => a.status === status);
    }

    if (severity && severity !== 'ALL' && typeof severity === 'string') {
      alerts = alerts.filter(a => a.severity === severity);
    }

    if (pattern && pattern !== 'ALL' && typeof pattern === 'string') {
      alerts = alerts.filter(a => a.patternType === pattern);
    }

    res.json(alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  // Update alert status (support both /alerts/:id and /alerts/:id/status)
  const handleAlertStatusUpdate = (req: any, res: any) => {
    const { status, notes, assignedTo } = req.body;
    const updated = amlEngine.updateAlertStatus(req.params.id, status, notes, assignedTo);
    if (!updated) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(updated);
  };

  router.patch('/alerts/:id', handleAlertStatusUpdate);
  router.patch('/alerts/:id/status', handleAlertStatusUpdate);

  // 8. SAR Generation (AI Powered) - support both /sar/generate and /alerts/:id/generate-sar
  router.post('/sar/generate', async (req, res) => {
    try {
      const { alertId, reportingOfficer } = req.body;
      const alert = amlEngine.getAlerts().find(a => a.id === alertId);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      const account = amlEngine.getAccount(alert.primaryAccountId);
      if (!account) {
        return res.status(404).json({ error: 'Subject account not found' });
      }

      const relatedTxs = amlEngine.getTransactions().filter(t => 
        t.senderId === account.id || t.receiverId === account.id || (alert.transactionId && t.id === alert.transactionId)
      );

      const sar = await generateSARReportWithGemini({
        alert,
        account,
        relatedTransactions: relatedTxs,
        reportingOfficer: reportingOfficer || 'Lead AML Investigator',
      });

      sarReportsMap.set(sar.id, sar);
      alert.status = 'SAR_FILED';
      alert.sarReportId = sar.id;

      res.json(sar);
    } catch (err: any) {
      console.error('Error generating SAR:', err);
      res.status(500).json({ error: err.message || 'Failed to generate SAR' });
    }
  });

  router.post('/alerts/:id/generate-sar', async (req, res) => {
    try {
      const alert = amlEngine.getAlerts().find(a => a.id === req.params.id);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      const account = amlEngine.getAccount(alert.primaryAccountId);
      if (!account) {
        return res.status(404).json({ error: 'Subject account not found' });
      }

      const relatedTxs = amlEngine.getTransactions().filter(t => 
        t.senderId === account.id || t.receiverId === account.id || (alert.transactionId && t.id === alert.transactionId)
      );

      const sar = await generateSARReportWithGemini({
        alert,
        account,
        relatedTransactions: relatedTxs,
        reportingOfficer: req.body.reportingOfficer || 'Lead AML Investigator',
      });

      sarReportsMap.set(sar.id, sar);
      alert.status = 'SAR_FILED';
      alert.sarReportId = sar.id;

      res.json(sar);
    } catch (err: any) {
      console.error('Error generating SAR:', err);
      res.status(500).json({ error: err.message || 'Failed to generate SAR' });
    }
  });

  router.get('/sar/:id', (req, res) => {
    const sar = sarReportsMap.get(req.params.id);
    if (!sar) {
      return res.status(404).json({ error: 'SAR report not found' });
    }
    res.json(sar);
  });

  // 9. AML Rules & Configuration
  router.get('/rules/config', (req, res) => {
    res.json(amlEngine.getRuleConfig());
  });

  router.post('/rules/config', (req, res) => {
    const newConfig = amlEngine.setRuleConfig(req.body);
    res.json(newConfig);
  });

  router.get('/rules', (req, res) => {
    res.json(amlEngine.getRules());
  });

  router.patch('/rules/:id', (req, res) => {
    const success = amlEngine.updateRule(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.json({ success: true, rules: amlEngine.getRules() });
  });

  // 10. Scenario Simulation Injector (supports /simulate and /simulate/scenario)
  const handleSimulation = (req: any, res: any) => {
    const { scenarioType } = req.body;
    const now = Date.now();

    if (scenarioType === 'SMURFING_BURST') {
      const muleNames = ['Aarav Patel', 'Priya Sharma', 'Rahul Verma', 'Sneha Kapoor'];
      const collector = amlEngine.getAccount('acc-smurf-collector') || amlEngine.getAccounts()[0];

      const newTxs = muleNames.map((name, i) => {
        const muleId = `acc-live-mule-${i + 1}`;
        return {
          id: `tx-burst-smurf-${Date.now()}-${i}`,
          referenceNumber: `TX-BURST-NEFT-${Math.floor(1000 + Math.random() * 9000)}`,
          senderId: muleId,
          senderName: name,
          senderType: 'INDIVIDUAL' as const,
          senderJurisdiction: 'India',
          receiverId: collector.id,
          receiverName: collector.accountHolderName,
          receiverType: collector.accountType,
          receiverJurisdiction: collector.jurisdiction,
          amount: 985000 - (i * 12000), // Structured < ₹10 Lakh CTR reporting threshold
          currency: 'INR',
          timestamp: new Date(now - (i * 20 * 60 * 1000)).toISOString(),
          channel: 'NEFT' as const,
          notes: `Consulting advance payment tranche ${i + 1}`,
        };
      });

      const ingested = newTxs.map(t => amlEngine.ingestTransaction(t));
      return res.json({
        message: 'Smurfing burst scenario injected successfully',
        transactionsCount: newTxs.length,
        alerts: ingested.flatMap(r => r.generatedAlerts),
      });
    } else if (scenarioType === 'CIRCULAR_LOOP') {
      const accounts = amlEngine.getAccounts();
      const nodeA = accounts[0];
      const nodeB = accounts[1];
      const nodeC = accounts[2];

      const loopTxs = [
        {
          id: `tx-loop-1-${Date.now()}`,
          referenceNumber: `TX-LOOP-RTGS-1`,
          senderId: nodeA.id,
          senderName: nodeA.accountHolderName,
          senderType: nodeA.accountType,
          senderJurisdiction: nodeA.jurisdiction,
          receiverId: nodeB.id,
          receiverName: nodeB.accountHolderName,
          receiverType: nodeB.accountType,
          receiverJurisdiction: nodeB.jurisdiction,
          amount: 3200000,
          currency: 'INR',
          timestamp: new Date(now - 3 * 3600000).toISOString(),
          channel: 'RTGS' as const,
          notes: 'Asset purchase forward contract',
        },
        {
          id: `tx-loop-2-${Date.now()}`,
          referenceNumber: `TX-LOOP-RTGS-2`,
          senderId: nodeB.id,
          senderName: nodeB.accountHolderName,
          senderType: nodeB.accountType,
          senderJurisdiction: nodeB.jurisdiction,
          receiverId: nodeC.id,
          receiverName: nodeC.accountHolderName,
          receiverType: nodeC.accountType,
          receiverJurisdiction: nodeC.jurisdiction,
          amount: 3120000,
          currency: 'INR',
          timestamp: new Date(now - 2 * 3600000).toISOString(),
          channel: 'WIRE' as const,
          notes: 'Consulting services fee',
        },
        {
          id: `tx-loop-3-${Date.now()}`,
          referenceNumber: `TX-LOOP-RTGS-3`,
          senderId: nodeC.id,
          senderName: nodeC.accountHolderName,
          senderType: nodeC.accountType,
          senderJurisdiction: nodeC.jurisdiction,
          receiverId: nodeA.id,
          receiverName: nodeA.accountHolderName,
          receiverType: nodeA.accountType,
          receiverJurisdiction: nodeA.jurisdiction,
          amount: 3050000,
          currency: 'INR',
          timestamp: new Date(now - 1 * 3600000).toISOString(),
          channel: 'RTGS' as const,
          notes: 'Management dividend distribution (Circular return)',
        },
      ];

      const results = loopTxs.map(t => amlEngine.ingestTransaction(t));
      return res.json({
        message: 'Circular fund routing loop scenario injected successfully',
        transactionsCount: loopTxs.length,
        alerts: results.flatMap(r => r.generatedAlerts),
      });
    } else if (scenarioType === 'RESET_BASELINE') {
      const fresh = generateInitialAMLDataset();
      (amlEngine as any).accounts = new Map(fresh.accounts.map(a => [a.id, a]));
      (amlEngine as any).transactions = [...fresh.transactions];
      (amlEngine as any).alerts = [...fresh.alerts];
      return res.json({ message: 'Reset to standard benchmark AML dataset', kpis: true });
    }

    res.status(400).json({ error: 'Unknown scenario type' });
  };

  router.post('/simulate', handleSimulation);
  router.post('/simulate/scenario', handleSimulation);

  // 11. AI Compliance Copilot (supports both /copilot and /copilot/query, question or query)
  const handleCopilotQuery = async (req: any, res: any) => {
    const query = req.body.query || req.body.question;
    if (!query) return res.status(400).json({ error: 'Query required' });

    const alerts = amlEngine.getAlerts();
    const highRiskEntities = amlEngine.getAccounts()
      .filter(a => a.riskScore >= 75)
      .map(a => a.accountHolderName);

    const recentPatterns = Array.from(new Set(alerts.slice(0, 10).map(a => a.patternType)));

    const answer = await askComplianceCopilot({
      query,
      context: {
        totalAlerts: alerts.length,
        highRiskEntities,
        recentPatterns,
      },
    });

    res.json({ answer });
  };

  router.post('/copilot', handleCopilotQuery);
  router.post('/copilot/query', handleCopilotQuery);

  // 12. Fallback JSON 404 for any unhandled /api/* route so Vite doesn't serve index.html
  router.all('*', (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
  });

  return router;
}
