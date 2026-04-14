import { useEffect, useMemo, useRef, useState } from "react";
import * as LightweightCharts from "lightweight-charts";
import { useTerminal } from "../../../store/terminalStore";
import useMarketCandles from "../../../hooks/useMarketCandles";
import DecisionOverlay from "../overlays/DecisionOverlay";
import ExecutionReplayOverlay from "../overlays/ExecutionReplayOverlay";
import PositionPnlOverlay from "../overlays/PositionPnlOverlay";
import LiquidityHeatmapOverlay from "../overlays/LiquidityHeatmapOverlay";
import useExecutionHeatmap from "../../../hooks/useExecutionHeatmap";

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const timeframes = ["1h", "4h", "1d"];

export default function SmartChartPanel({ hideNoTradeOverlay = false }) {
  const { state } = useTerminal();
  const [timeframe, setTimeframe] = useState("4h");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fills, setFills] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const priceLinesRef = useRef([]);
  const markLineRef = useRef(null);

  const { candles, loading } = useMarketCandles(state.selectedSymbol, timeframe);
  const heatmap = useExecutionHeatmap(state.selectedSymbol);

  // Fetch fills for selected symbol
  useEffect(() => {
    async function fetchFills() {
      try {
        const res = await fetch(`${API_URL}/api/exchange/fills`);
        const data = await res.json();
        if (data.ok) {
          const symbolFills = (data.fills || []).filter(
            f => f.symbol === state.selectedSymbol
          );
          setFills(symbolFills);
        }
      } catch (e) {
        console.error('Fills fetch error:', e);
      }
    }

    fetchFills();
    const interval = setInterval(fetchFills, 5000);
    return () => clearInterval(interval);
  }, [state.selectedSymbol]);

  const selectedDecision = useMemo(() => {
    const realDecision = state.allocator?.decisions?.find(
      (d) => d.symbol === state.selectedSymbol
    );
    
    // ONLY use real decisions from backend
    // Mock removed - no fake overlays in normal mode
    return realDecision || null;
  }, [state.allocator, state.selectedSymbol]);

  const selectedPosition = useMemo(() => {
    return (
      state.positions?.find((p) => p.symbol === state.selectedSymbol && p.status === "OPEN") || null
    );
  }, [state.positions, state.selectedSymbol]);

  const currentPrice = useMemo(() => {
    return candles?.length ? Number(candles[candles.length - 1]?.close || 0) : null;
  }, [candles]);

  // Create chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = LightweightCharts.createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#ffffff" },
        textColor: "#111111",
      },
      grid: {
        vertLines: { color: "#f5f5f5" },
        horzLines: { color: "#f5f5f5" },
      },
      rightPriceScale: {
        borderColor: "#e5e5e5",
      },
      timeScale: {
        borderColor: "#e5e5e5",
        timeVisible: true,
      },
      crosshair: {
        mode: 0,
      },
    });

    const candleSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
      upColor: "#111111",
      downColor: "#c44",
      borderDownColor: "#c44",
      borderUpColor: "#111111",
      wickDownColor: "#c44",
      wickUpColor: "#111111",
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const resizeObserver = new ResizeObserver(() => {
      if (!chartContainerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // Update candles
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    const mapped = (candles || []).map((c) => ({
      time: Math.floor((c.timestamp || c.time || Date.now()) / 1000),
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
    }));

    candleSeriesRef.current.setData(mapped);

    if (chartRef.current && mapped.length > 0) {
      chartRef.current.timeScale().fitContent();
    }
  }, [candles]);

  // Update chart markers and lines when case changes
  useEffect(() => {
    if (!candleSeriesRef.current || !state.selectedCase || !candles?.length) return;

    const caseData = state.selectedCase;
    const markers = [];

    // Entry markers
    if (caseData.entries) {
      caseData.entries.forEach((entry) => {
        markers.push({
          time: entry.time,
          position: 'belowBar',
          color: '#16a34a',
          shape: 'arrowUp',
          text: 'ENTRY'
        });
      });
    }

    // Add markers
    if (caseData.adds) {
      caseData.adds.forEach((add) => {
        markers.push({
          time: add.time,
          position: 'belowBar',
          color: '#2563eb',
          shape: 'circle',
          text: 'ADD'
        });
      });
    }

    // Partial exit markers
    if (caseData.partial_exits) {
      caseData.partial_exits.forEach((exit) => {
        markers.push({
          time: exit.time,
          position: 'aboveBar',
          color: '#f59e0b',
          shape: 'circle',
          text: 'PARTIAL'
        });
      });
    }

    // Full exit markers
    if (caseData.exits) {
      caseData.exits.forEach((exit) => {
        markers.push({
          time: exit.time,
          position: 'aboveBar',
          color: '#dc2626',
          shape: 'arrowDown',
          text: 'EXIT'
        });
      });
    }

    // Thesis change markers (⚡ → FLIP)
    if (caseData.switched_from) {
      // Add flip marker at first entry time
      const flipTime = caseData.entries?.[0]?.time || (Math.floor(Date.now() / 1000) - 86400 * 3);
      markers.push({
        time: flipTime - 3600, // 1 hour before entry
        position: 'belowBar', // Below bar чтобы не терялся
        color: '#a855f7', // Ярче purple
        shape: 'circle',
        text: 'FLIP'
      });
    }

    console.log('[Chart Intelligence] Setting markers:', markers);
    
    // Set markers
    if (typeof candleSeriesRef.current.setMarkers === 'function') {
      try {
        candleSeriesRef.current.setMarkers(markers);
      } catch (e) {
        console.error('[Chart Intelligence] Failed to set markers:', e);
      }
    }

    // Clear existing price lines
    priceLinesRef.current.forEach(line => {
      try {
        candleSeriesRef.current?.removePriceLine(line);
      } catch (e) {}
    });
    priceLinesRef.current = [];

    // Add Stop line (thinner, more transparent)
    if (caseData.stop && typeof candleSeriesRef.current.createPriceLine === 'function') {
      try {
        const stopPrice = parseFloat(caseData.stop.replace(/,/g, ''));
        priceLinesRef.current.push(
          candleSeriesRef.current.createPriceLine({
            price: stopPrice,
            color: 'rgba(220, 38, 38, 0.7)',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: 'STOP'
          })
        );
      } catch (e) {
        console.error('[Chart Intelligence] Failed to create stop line:', e);
      }
    }

    // Add Target line (thinner)
    if (caseData.target && typeof candleSeriesRef.current.createPriceLine === 'function') {
      try {
        priceLinesRef.current.push(
          candleSeriesRef.current.createPriceLine({
            price: caseData.target,
            color: '#16a34a',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: 'TARGET'
          })
        );
      } catch (e) {
        console.error('[Chart Intelligence] Failed to create target line:', e);
      }
    }

    // Add Position Zone (area series) - ENHANCED VISIBILITY
    if (caseData.avg_entry && caseData.status === 'ACTIVE' && chartRef.current && candles?.length > 0) {
      try {
        // Get current price from last candle
        const lastCandle = candles[candles.length - 1];
        const currentPrice = lastCandle?.close || lastCandle?.c || caseData.avg_entry;
        
        const isLong = caseData.direction === 'LONG';
        
        // Enhanced colors - MORE VISIBLE
        const zoneColor = isLong ? 
          { 
            top: 'rgba(34,197,94,0.22)',     // Increased from 0.12
            bottom: 'rgba(34,197,94,0.08)',  // Increased from 0.02
            line: 'rgba(34,197,94,0.6)',     // Increased from 0.3
            lineWidth: 2                     // Increased from 1
          } :
          { 
            top: 'rgba(239,68,68,0.22)', 
            bottom: 'rgba(239,68,68,0.08)', 
            line: 'rgba(239,68,68,0.6)',
            lineWidth: 2
          };

        const zoneSeries = chartRef.current.addAreaSeries({
          topColor: zoneColor.top,
          bottomColor: zoneColor.bottom,
          lineColor: zoneColor.line,
          lineWidth: zoneColor.lineWidth,
          priceLineVisible: false,
          lastValueVisible: false
        });

        const firstEntryTime = caseData.entries?.[0]?.time || (Math.floor(Date.now() / 1000) - 86400 * 3);
        const now = Math.floor(Date.now() / 1000);

        // Create REAL ZONE between entry and current price
        const zoneData = [];
        
        // Start from entry time with entry price
        zoneData.push({ time: firstEntryTime, value: caseData.avg_entry });
        
        // Add middle points to create smooth zone
        const midTime = firstEntryTime + Math.floor((now - firstEntryTime) / 2);
        zoneData.push({ time: midTime, value: currentPrice });
        
        // End at now with current price
        zoneData.push({ time: now, value: currentPrice });

        zoneSeries.setData(zoneData);

        // Store for cleanup
        if (!priceLinesRef.current.zoneSeries) {
          priceLinesRef.current.zoneSeries = zoneSeries;
        }
      } catch (e) {
        console.error('[Chart Intelligence] Failed to create position zone:', e);
      }
    }

    return () => {
      // Cleanup price lines on unmount
      priceLinesRef.current.forEach(line => {
        try {
          candleSeriesRef.current?.removePriceLine(line);
        } catch (e) {}
      });
      
      // Cleanup zone series
      if (priceLinesRef.current.zoneSeries && chartRef.current) {
        try {
          chartRef.current.removeSeries(priceLinesRef.current.zoneSeries);
        } catch (e) {}
      }
      
      priceLinesRef.current = [];
    };
  }, [state.selectedCase, candles]);

  // Update MARK line
  useEffect(() => {
    if (!candleSeriesRef.current || !currentPrice) return;

    if (markLineRef.current) {
      candleSeriesRef.current.removePriceLine(markLineRef.current);
      markLineRef.current = null;
    }

    markLineRef.current = candleSeriesRef.current.createPriceLine({
      price: Number(currentPrice),
      color: "#111111",
      lineWidth: 1,
      lineStyle: 1,
      axisLabelVisible: true,
      title: "MARK",
    });
  }, [currentPrice]);

  // Update price lines (entry/stop/target)
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    // Clear old lines
    priceLinesRef.current.forEach(line => {
      candleSeriesRef.current.removePriceLine(line);
    });
    priceLinesRef.current = [];

    // Use decision for overlays (real or mock)
    const decision = selectedDecision;
    if (!decision) return;

    const entry = selectedPosition?.entry_price || decision.entry;
    const stop = selectedPosition?.stop_loss || decision.stop;
    const target = selectedPosition?.take_profit || decision.target;

    if (entry) {
      const line = candleSeriesRef.current.createPriceLine({
        price: Number(entry),
        color: '#2962FF',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'ENTRY'
      });
      priceLinesRef.current.push(line);
    }

    if (stop) {
      const line = candleSeriesRef.current.createPriceLine({
        price: Number(stop),
        color: '#FF4D4F',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'STOP'
      });
      priceLinesRef.current.push(line);
    }

    if (target) {
      const line = candleSeriesRef.current.createPriceLine({
        price: Number(target),
        color: '#00C853',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TARGET'
      });
      priceLinesRef.current.push(line);
    }
  }, [selectedDecision, selectedPosition]);

  // Calculate RR ratio
  const rrRatio = useMemo(() => {
    const decision = selectedDecision;
    if (!decision) return null;

    const entry = selectedPosition?.entry_price || decision.entry;
    const stop = selectedPosition?.stop_loss || decision.stop;
    const target = selectedPosition?.take_profit || decision.target;

    if (!entry || !stop || !target) return null;

    const risk = Math.abs(Number(entry) - Number(stop));
    const reward = Math.abs(Number(target) - Number(entry));

    return risk > 0 ? (reward / risk).toFixed(2) : null;
  }, [selectedDecision, selectedPosition]);

  // Calculate Y coordinates for risk/reward zones
  const zoneCoordinates = useMemo(() => {
    if (!chartRef.current) return null;

    const decision = selectedDecision;
    if (!decision) return null;

    const entry = selectedPosition?.entry_price || decision.entry;
    const stop = selectedPosition?.stop_loss || decision.stop;
    const target = selectedPosition?.take_profit || decision.target;

    if (!entry || !stop || !target) return null;

    try {
      const priceScale = chartRef.current.priceScale('right');
      const entryY = priceScale.priceToCoordinate(Number(entry));
      const stopY = priceScale.priceToCoordinate(Number(stop));
      const targetY = priceScale.priceToCoordinate(Number(target));

      return { entryY, stopY, targetY };
    } catch (e) {
      return null;
    }
  }, [selectedDecision, selectedPosition, candles]);

  return (
    <div className="h-full flex flex-col p-4 gap-3 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold">{state.selectedSymbol}</div>
          <div className="text-xs text-neutral-500">
            {selectedPosition ? "POSITION ACTIVE" : selectedDecision ? "DECISION READY" : "NO POSITION"}
          </div>
          {rrRatio && (
            <div className="text-xs font-semibold text-neutral-700 px-2 py-0.5 rounded bg-neutral-100">
              RR: {rrRatio}
            </div>
          )}
          
          {heatmap?.summary && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="rounded-full bg-neutral-100 px-2 py-1">
                Bid wall: {heatmap.summary.top_bid_wall?.toFixed(0) ?? "n/a"}
              </span>
              <span className="rounded-full bg-neutral-100 px-2 py-1">
                Ask wall: {heatmap.summary.top_ask_wall?.toFixed(0) ?? "n/a"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHeatmap((v) => !v)}
            className="rounded-md bg-neutral-100 px-2 py-1 text-xs hover:bg-neutral-200"
            data-testid="toggle-heatmap-btn"
          >
            {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
          </button>
          
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                timeframe === tf
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
              data-testid={`timeframe-${tf}`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container with Overlays */}
      <div className="flex-1 relative min-h-0">
        <div ref={chartContainerRef} className="absolute inset-0" />
        
        {/* Risk/Reward Zones Overlay */}
        {zoneCoordinates && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Reward Zone (entry to target) */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 60,
                top: `${zoneCoordinates.targetY}px`,
                height: `${Math.abs(zoneCoordinates.entryY - zoneCoordinates.targetY)}px`,
                background: 'rgba(0, 200, 83, 0.12)',
                borderTop: '1px dashed rgba(0, 200, 83, 0.4)',
                borderBottom: '1px dashed rgba(0, 200, 83, 0.4)',
              }}
            />
            
            {/* Risk Zone (entry to stop) */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 60,
                top: `${zoneCoordinates.entryY}px`,
                height: `${Math.abs(zoneCoordinates.stopY - zoneCoordinates.entryY)}px`,
                background: 'rgba(255, 77, 79, 0.12)',
                borderTop: '1px dashed rgba(255, 77, 79, 0.4)',
                borderBottom: '1px dashed rgba(255, 77, 79, 0.4)',
              }}
            />
          </div>
        )}
        
        {/* Liquidity Heatmap Overlay */}
        {showHeatmap && chartRef.current && heatmap && (
          <LiquidityHeatmapOverlay chart={chartRef.current} heatmap={heatmap} />
        )}
        
        {/* Position PnL Overlay */}
        {chartRef.current && selectedPosition && (
          <PositionPnlOverlay
            chart={chartRef.current}
            position={selectedPosition}
            currentPrice={currentPrice}
          />
        )}
        
        {/* Decision Overlay */}
        {selectedDecision && chartRef.current && (
          <DecisionOverlay decision={selectedDecision} chart={chartRef.current} />
        )}
        
        {/* Execution Replay Overlay */}
        {fills.length > 0 && chartRef.current && (
          <ExecutionReplayOverlay fills={fills} chart={chartRef.current} />
        )}
        
        {/* Chart Empty State Overlay - with fade animation */}
        {!hideNoTradeOverlay && !selectedDecision && !loading && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-fade-in"
            style={{ animation: 'fadeIn 300ms ease-out' }}
          >
            <div className="bg-white/80 backdrop-blur-md px-8 py-6 rounded-2xl border border-neutral-300 shadow-lg text-center max-w-md">
              <div className="text-xl font-bold text-neutral-900 mb-2">
                NO TRADE
              </div>
              <div className="text-sm text-neutral-700 mb-1">
                Market has no edge.
              </div>
              <div className="text-sm text-neutral-600">
                Wait for breakout or imbalance.
              </div>
              <div className="text-sm text-neutral-500 mt-3 font-medium">
                → Stay flat
              </div>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500 bg-white bg-opacity-80">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
              <span>Loading chart...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
