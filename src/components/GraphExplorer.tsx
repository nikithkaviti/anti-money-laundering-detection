import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { AMLGraphData, GraphNode, GraphLink, PatternType, RiskSeverity } from '../types';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter, 
  Search, 
  ShieldAlert, 
  Maximize2, 
  Layers, 
  Sliders, 
  Info,
  ExternalLink,
  ChevronRight,
  EyeOff,
  Zap,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  Eye
} from 'lucide-react';
import { formatINR, formatINRGraph } from '../utils/currency';

interface GraphExplorerProps {
  data: AMLGraphData;
  onSelectAccount: (accountId: string) => void;
  selectedAccountId?: string | null;
  initialPatternFilter?: string;
  onGenerateSarForAccount?: (accountId: string) => void;
}

export const GraphExplorer: React.FC<GraphExplorerProps> = ({
  data,
  onSelectAccount,
  selectedAccountId,
  initialPatternFilter,
  onGenerateSarForAccount,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Filter and view states
  const [minRisk, setMinRisk] = useState<number>(0);
  const [patternFilter, setPatternFilter] = useState<string>(initialPatternFilter || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusedNode, setFocusedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [layoutMode, setLayoutMode] = useState<'force' | 'circular' | 'layered'>('force');
  const [isolateHops, setIsolateHops] = useState<number>(2);
  const [showHelper, setShowHelper] = useState<boolean>(false);

  // Sync initialPatternFilter if changed from parent
  useEffect(() => {
    if (initialPatternFilter) {
      setPatternFilter(initialPatternFilter);
    }
  }, [initialPatternFilter]);

  // Filter nodes & links based on active filters
  const filteredData = useMemo(() => {
    let nodes = data.nodes.filter(n => n.riskScore >= minRisk);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      nodes = nodes.filter(n => 
        n.label.toLowerCase().includes(q) || 
        n.accountNumber.toLowerCase().includes(q) ||
        n.jurisdiction.toLowerCase().includes(q)
      );
    }

    const nodeIds = new Set(nodes.map(n => n.id));

    let links = data.links.filter(l => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    if (patternFilter !== 'ALL') {
      links = links.filter(l => l.patternType === patternFilter || (l.riskScore >= 70 && patternFilter === 'CIRCULAR_ROUTING'));
      const activeNodeIds = new Set<string>();
      links.forEach(l => {
        const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        activeNodeIds.add(sourceId);
        activeNodeIds.add(targetId);
      });
      nodes = nodes.filter(n => activeNodeIds.has(n.id));
    }

    // Subgraph isolation if focusedNode exists
    if (selectedAccountId || focusedNode) {
      const centerId = selectedAccountId || focusedNode?.id;
      if (centerId) {
        const neighborSet = new Set<string>([centerId]);
        
        // expand hops
        for (let h = 0; h < isolateHops; h++) {
          const currentSet = Array.from(neighborSet);
          data.links.forEach(l => {
            const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
            const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
            if (currentSet.includes(sId)) neighborSet.add(tId);
            if (currentSet.includes(tId)) neighborSet.add(sId);
          });
        }

        nodes = nodes.filter(n => neighborSet.has(n.id));
        const finalIds = new Set(nodes.map(n => n.id));
        links = links.filter(l => {
          const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
          const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
          return finalIds.has(sId) && finalIds.has(tId);
        });
      }
    }

    return { nodes, links };
  }, [data, minRisk, patternFilter, searchQuery, selectedAccountId, focusedNode, isolateHops]);

  // Set focusedNode if selectedAccountId is passed
  useEffect(() => {
    if (selectedAccountId) {
      const match = data.nodes.find(n => n.id === selectedAccountId);
      if (match) setFocusedNode(match);
    }
  }, [selectedAccountId, data.nodes]);

  // Handle Zoom controls
  const handleZoom = (delta: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomBehaviorRef.current.scaleBy, delta);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  // D3 Rendering Loop
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // clear canvas

    svg.attr('viewBox', [0, 0, width, height]);

    // Defs for arrowheads and gradients
    const defs = svg.append('defs');

    // Arrow markers
    ['normal', 'suspicious', 'loop', 'structuring'].forEach(type => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 24) // distance from node center
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', type === 'loop' ? '#f43f5e' : type === 'structuring' ? '#f59e0b' : type === 'suspicious' ? '#f59e0b' : '#64748b');
    });

    // Zoom container
    const g = svg.append('g').attr('class', 'graph-canvas');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Prepare deep clones of nodes and links for d3 simulation mutation
    const simNodes: any[] = filteredData.nodes.map(d => ({ ...d }));
    const simLinks: any[] = filteredData.links.map(d => ({
      ...d,
      source: typeof d.source === 'object' ? (d.source as any).id : d.source,
      target: typeof d.target === 'object' ? (d.target as any).id : d.target,
    }));

    // Setup Simulation based on layout mode
    let simulation: d3.Simulation<any, any>;

    if (layoutMode === 'circular') {
      const radius = Math.min(width, height) * 0.38;
      const angleStep = (2 * Math.PI) / Math.max(1, simNodes.length);
      simNodes.forEach((node, i) => {
        node.fx = width / 2 + radius * Math.cos(i * angleStep);
        node.fy = height / 2 + radius * Math.sin(i * angleStep);
      });
      simulation = d3.forceSimulation(simNodes)
        .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(100));
    } else if (layoutMode === 'layered') {
      // Stratify by risk score
      simNodes.forEach((node) => {
        const layer = node.riskScore >= 80 ? 0.2 : node.riskScore >= 50 ? 0.5 : 0.8;
        node.fy = height * layer;
      });
      simulation = d3.forceSimulation(simNodes)
        .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(120))
        .force('charge', d3.forceManyBody().strength(-350))
        .force('x', d3.forceX(width / 2).strength(0.1))
        .force('collision', d3.forceCollide().radius(40));
    } else {
      // Standard Force-directed
      simulation = d3.forceSimulation(simNodes)
        .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(140))
        .force('charge', d3.forceManyBody().strength(-450))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(40));
    }

    // Draw Links
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup.selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => d.patternType === 'CIRCULAR_ROUTING' ? '#f43f5e' : d.patternType === 'STRUCTURING' ? '#f59e0b' : d.isSuspicious ? '#fb923c' : '#334155')
      .attr('stroke-width', (d: any) => d.patternType === 'CIRCULAR_ROUTING' ? 3.5 : d.patternType === 'STRUCTURING' ? 3 : Math.min(5, Math.max(1.5, Math.log10(d.amount || 1000) - 2)))
      .attr('stroke-opacity', (d: any) => d.patternType === 'CIRCULAR_ROUTING' || d.patternType === 'STRUCTURING' ? 0.95 : 0.6)
      .attr('stroke-dasharray', (d: any) => d.patternType === 'STRUCTURING' ? '5,4' : 'none')
      .attr('marker-end', (d: any) => 
        d.patternType === 'CIRCULAR_ROUTING' ? 'url(#arrow-loop)' : d.patternType === 'STRUCTURING' ? 'url(#arrow-structuring)' : d.isSuspicious ? 'url(#arrow-suspicious)' : 'url(#arrow-normal)'
      );

    // Link Labels (Amounts)
    const linkLabel = linkGroup.selectAll('text')
      .data(simLinks)
      .enter()
      .append('text')
      .attr('fill', (d: any) => d.patternType === 'CIRCULAR_ROUTING' ? '#fda4af' : d.patternType === 'STRUCTURING' ? '#fde68a' : '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', '600')
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .text((d: any) => formatINRGraph(d.amount));

    // Draw Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup.selectAll('.node')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3.drag<any, any>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            if (layoutMode === 'force') {
              d.fx = null;
              d.fy = null;
            }
          })
      );

    // Outer Halo for High Risk / Critical Nodes
    node.filter((d: any) => d.riskScore >= 60)
      .append('circle')
      .attr('r', 25)
      .attr('fill', 'none')
      .attr('stroke', (d: any) => d.riskScore >= 80 ? '#f43f5e' : '#f59e0b')
      .attr('stroke-width', (d: any) => d.riskScore >= 80 ? 2.5 : 1.5)
      .attr('stroke-opacity', 0.8)
      .attr('stroke-dasharray', (d: any) => d.riskScore >= 80 ? '4,4' : '3,3');

    // Main Node Circle
    node.append('circle')
      .attr('r', (d: any) => Math.min(22, Math.max(14, 12 + (d.totalVolume ? Math.log10(d.totalVolume) * 1.5 : 0))))
      .attr('fill', (d: any) => {
        if (d.riskScore >= 80) return '#e11d48'; // Critical Rose
        if (d.riskScore >= 60) return '#d97706'; // High Amber
        if (d.riskScore >= 35) return '#2563eb'; // Medium Blue
        return '#475569'; // Low Slate
      })
      .attr('stroke', (d: any) => d.id === focusedNode?.id ? '#38bdf8' : '#0f172a')
      .attr('stroke-width', (d: any) => d.id === focusedNode?.id ? 3.5 : 1.5);

    // Node Type Icon Initial
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#ffffff')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text((d: any) => {
        if (d.sanctionsListed) return '⚠️';
        if (d.accountType === 'SHELL_CORP') return 'S';
        if (d.accountType === 'OFFSHORE_LLC') return 'O';
        if (d.accountType === 'CRYPTO_EXCHANGE') return '₿';
        if (d.accountType === 'INDIVIDUAL') return 'M';
        return 'A';
      });

    // Node Labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 30)
      .attr('fill', '#f1f5f9')
      .attr('font-size', '10.5px')
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .text((d: any) => d.label.length > 20 ? `${d.label.slice(0, 18)}…` : d.label);

    // Node Secondary Sub-label (Jurisdiction + Risk Score)
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 42)
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('pointer-events', 'none')
      .text((d: any) => `${d.jurisdiction} · ${d.riskScore}/100`);

    // Interactions
    node
      .on('click', (event, d: any) => {
        event.stopPropagation();
        setFocusedNode(d);
        onSelectAccount(d.id);
      })
      .on('mouseenter', (event, d: any) => {
        setHoveredNode(d);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      });

    // Ticking Simulation
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Click canvas to clear focused node
    svg.on('click', () => {
      setFocusedNode(null);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredData, layoutMode, onSelectAccount, focusedNode]);

  return (
    <div className="relative flex flex-col h-[calc(100vh-140px)] min-h-[650px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      
      {/* Top Filter & Control Header */}
      <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-10">
        {/* Left: Filters & Quick Typology Selection */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Search Box */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search entity, account, country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Quick Typology Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setPatternFilter('ALL')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                patternFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Network
            </button>
            <button
              onClick={() => setPatternFilter('CIRCULAR_ROUTING')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                patternFilter === 'CIRCULAR_ROUTING' ? 'bg-rose-600 text-white' : 'text-rose-400 hover:bg-rose-950/40'
              }`}
              title="Highlight multi-hop circular funds laundering cycle"
            >
              <RefreshCw className="w-3 h-3" />
              Circular Loop
            </button>
            <button
              onClick={() => setPatternFilter('STRUCTURING')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                patternFilter === 'STRUCTURING' ? 'bg-amber-500 text-slate-950' : 'text-amber-400 hover:bg-amber-950/40'
              }`}
              title="Highlight sub-₹10 Lakh structuring money mules"
            >
              <Zap className="w-3 h-3" />
              Smurfing (Sub-₹10L)
            </button>
            <button
              onClick={() => setPatternFilter('RAPID_DISPERSAL')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                patternFilter === 'RAPID_DISPERSAL' ? 'bg-orange-600 text-white' : 'text-orange-400 hover:bg-orange-950/40'
              }`}
              title="Highlight rapid fan-out dispersal"
            >
              <Layers className="w-3 h-3" />
              Dispersal
            </button>
          </div>

          {/* Min Risk Slider */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
            <span className="text-[11px] text-slate-400">Min Risk:</span>
            <input
              type="range"
              min="0"
              max="80"
              step="10"
              value={minRisk}
              onChange={(e) => setMinRisk(Number(e.target.value))}
              className="w-14 accent-blue-500 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-blue-400 w-6">{minRisk}+</span>
          </div>

          {/* Hop Isolator if focused */}
          {focusedNode && (
            <div className="flex items-center gap-1.5 bg-indigo-950/80 border border-indigo-500/40 px-2 py-1 rounded-lg">
              <span className="text-[11px] text-indigo-200">Ego Hops:</span>
              <select
                value={isolateHops}
                onChange={(e) => setIsolateHops(Number(e.target.value))}
                className="bg-indigo-900 border-none text-[11px] text-white rounded px-1.5 py-0.5 focus:outline-none"
              >
                <option value={1}>1 Hop</option>
                <option value={2}>2 Hops</option>
                <option value={3}>3 Hops</option>
              </select>
              <button
                onClick={() => setFocusedNode(null)}
                className="text-slate-400 hover:text-white ml-1"
                title="Clear Focus"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Layout Switcher & Canvas Controls */}
        <div className="flex items-center gap-2">
          {/* Layout buttons */}
          <div className="hidden md:flex items-center bg-slate-950 border border-slate-700/80 rounded-lg p-0.5">
            <button
              onClick={() => setLayoutMode('force')}
              className={`px-2 py-1 text-[11px] font-medium rounded ${layoutMode === 'force' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Force
            </button>
            <button
              onClick={() => setLayoutMode('circular')}
              className={`px-2 py-1 text-[11px] font-medium rounded ${layoutMode === 'circular' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Ring
            </button>
            <button
              onClick={() => setLayoutMode('layered')}
              className={`px-2 py-1 text-[11px] font-medium rounded ${layoutMode === 'layered' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Risk Layers
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-lg p-0.5">
            <button
              onClick={() => handleZoom(1.25)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(0.8)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Help Toggle */}
          <button
            onClick={() => setShowHelper(!showHelper)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showHelper ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-950 text-slate-400 hover:text-white border-slate-700'
            }`}
            title="Graph Detection Guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Network Canvas */}
      <div ref={containerRef} className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
        <svg ref={svgRef} className="w-full h-full block" />

        {/* Floating Quick Helper Banner if toggled */}
        {showHelper && (
          <div className="absolute top-4 left-4 bg-slate-900/95 border border-indigo-500/40 rounded-xl p-4 shadow-2xl max-w-sm text-xs z-20 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-400" />
                How to Detect AML on This Graph
              </span>
              <button onClick={() => setShowHelper(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
              <p>
                <strong>1. Follow the Red Arrows:</strong> Solid red lines represent circular fund routing loops where capital returns to the originator.
              </p>
              <p>
                <strong>2. Spot Dashed Amber Lines:</strong> Dashed lines indicate structuring / smurfing fan-in deposits under ₹10 Lakhs.
              </p>
              <p>
                <strong>3. Click any node</strong> to lock focus, view 360° risk metrics, and trace connected counterparty flows.
              </p>
            </div>
          </div>
        )}

        {/* Floating Active Typology Explainer Banner */}
        {patternFilter === 'CIRCULAR_ROUTING' && (
          <div className="absolute top-4 left-4 bg-rose-950/90 border border-rose-500/50 rounded-xl p-3 shadow-2xl max-w-md text-xs z-10 animate-in fade-in">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-4 h-4 text-rose-400 animate-spin" />
              <span className="font-bold text-rose-200">Active Anomaly: 4-Hop Circular Layering Loop</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Funds originate from <strong>Nautilus Capital FZE</strong> ➔ layered via <strong>Apex Logistics (Panama)</strong> ➔ <strong>Cyprus Trade</strong> ➔ returned to <strong>Vanguard Holdings (Cayman)</strong>. Minimal balance retained.
            </p>
          </div>
        )}

        {patternFilter === 'STRUCTURING' && (
          <div className="absolute top-4 left-4 bg-amber-950/90 border border-amber-500/50 rounded-xl p-3 shadow-2xl max-w-md text-xs z-10 animate-in fade-in">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-amber-200">Active Anomaly: Sub-₹10L Structuring / Smurfing</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Multiple individual mules depositing repetitive tranches (₹9.65L, ₹9.80L, ₹9.85L, ₹9.90L) into <strong>BlueSky Realty & Advisory Pvt Ltd</strong> within 72 hours to evade statutory CTR reporting.
            </p>
          </div>
        )}

        {/* Floating Quick Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-3 shadow-lg pointer-events-none text-[11px] space-y-1.5 z-10">
          <div className="font-semibold text-slate-300 mb-1">Topology Legend</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600"></span>
            <span className="text-slate-300">Critical Risk (80-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-slate-300">High Risk (60-79)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            <span className="text-slate-300">Medium Risk (35-59)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 bg-rose-500"></span>
            <span className="text-slate-300">Circular Routing Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-t border-dashed border-amber-400"></span>
            <span className="text-slate-300">Structuring Fan-In (&lt;₹10L)</span>
          </div>
        </div>

        {/* Hover Tooltip if hovering over node */}
        {hoveredNode && !focusedNode && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl pointer-events-none w-64 text-xs z-20">
            <div className="font-bold text-white mb-1">{hoveredNode.label}</div>
            <div className="text-slate-400 font-mono text-[10px] mb-2">{hoveredNode.accountNumber}</div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <span className="text-slate-400">Jurisdiction:</span>
              <span className="text-slate-200 text-right">{hoveredNode.jurisdiction}</span>
              <span className="text-slate-400">Risk Score:</span>
              <span className={`text-right font-bold ${hoveredNode.riskScore >= 80 ? 'text-rose-400' : 'text-amber-400'}`}>
                {hoveredNode.riskScore}/100
              </span>
              <span className="text-slate-400">Entity Type:</span>
              <span className="text-slate-200 text-right">{hoveredNode.accountType}</span>
            </div>
          </div>
        )}

        {/* Focused Node Side Card / Detail Inspector */}
        {focusedNode && (
          <div className="absolute top-4 right-4 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl w-80 text-xs z-20 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  focusedNode.riskScore >= 80 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {focusedNode.riskTier} Risk ({focusedNode.riskScore}/100)
                </span>
                <h4 className="font-bold text-white text-sm mt-1.5">{focusedNode.label}</h4>
                <p className="font-mono text-[11px] text-slate-400">{focusedNode.accountNumber}</p>
              </div>
              <button
                onClick={() => setFocusedNode(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-3 space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Account Type:</span>
                <span className="font-medium text-slate-200">{focusedNode.accountType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jurisdiction:</span>
                <span className="font-medium text-slate-200">{focusedNode.jurisdiction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Network Volume:</span>
                <span className="font-mono font-medium text-emerald-400">{formatINR(focusedNode.totalVolume || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PEP / Sanction Status:</span>
                <span className="font-semibold text-rose-400">
                  {focusedNode.isPEP ? 'PEP Match' : focusedNode.sanctionsListed ? 'Sanction Listed' : 'Clean'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Alert Triggers:</span>
                <span className="font-mono font-bold text-amber-400">{focusedNode.activeAlertCount}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              {onGenerateSarForAccount && (
                <button
                  onClick={() => onGenerateSarForAccount(focusedNode.id)}
                  className="w-full py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Generate AI SAR Report
                </button>
              )}
              <button
                onClick={() => onSelectAccount(focusedNode.id)}
                className="w-full py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                View 360° Account Profile
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

