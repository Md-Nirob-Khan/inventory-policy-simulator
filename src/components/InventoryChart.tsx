import React, { useState, useMemo, useRef } from 'react';
import { PolicyResult } from '../types/inventory';
import { Eye, EyeOff, ZoomIn, AlertTriangle, ArrowUpDown } from 'lucide-react';

interface InventoryChartProps {
  results: PolicyResult[];
  simulationDays: number;
}

export const InventoryChart: React.FC<InventoryChartProps> = ({ results, simulationDays }) => {
  const [visiblePolicies, setVisiblePolicies] = useState<Record<string, boolean>>({
    eoq: true,
    reorder_point: true,
    periodic_review: true,
  });

  const [hoverDay, setHoverDay] = useState<number | null>(null);
  const [zoomRange, setZoomRange] = useState<[number, number]>([1, simulationDays]);
  const [showStockoutMarkers, setShowStockoutMarkers] = useState(true);
  const [showReferenceLines, setShowReferenceLines] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Quick zoom filters
  const handleZoomPreset = (days: number) => {
    if (days >= simulationDays) {
      setZoomRange([1, simulationDays]);
    } else {
      setZoomRange([1, Math.min(days, simulationDays)]);
    }
  };

  const togglePolicy = (id: string) => {
    setVisiblePolicies((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Color mappings
  const policyColors: Record<string, { stroke: string; fill: string; bg: string; text: string }> = {
    eoq: {
      stroke: '#f59e0b', // amber-500
      fill: 'rgba(245, 158, 11, 0.12)',
      bg: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
    },
    reorder_point: {
      stroke: '#10b981', // emerald-500
      fill: 'rgba(16, 185, 129, 0.12)',
      bg: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    periodic_review: {
      stroke: '#3b82f6', // blue-500
      fill: 'rgba(59, 130, 246, 0.12)',
      bg: 'bg-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
    },
  };

  // Filter daily records according to zoom range
  const filteredDays = useMemo(() => {
    const [start, end] = zoomRange;
    const count = end - start + 1;
    return Array.from({ length: count }, (_, i) => start + i);
  }, [zoomRange]);

  // Find max inventory across all visible policies to scale Y-axis
  const maxY = useMemo(() => {
    let max = 50;
    results.forEach((res) => {
      if (visiblePolicies[res.id]) {
        res.dailyRecords.forEach((rec) => {
          if (rec.day >= zoomRange[0] && rec.day <= zoomRange[1]) {
            if (rec.endingInventory > max) max = rec.endingInventory;
            if (rec.availableStock > max) max = rec.availableStock;
          }
        });
      }
    });
    return Math.ceil(max * 1.15); // 15% breathing room
  }, [results, visiblePolicies, zoomRange]);

  // Chart Dimensions
  const svgWidth = 1000;
  const svgHeight = 420;
  const padding = { top: 30, right: 30, bottom: 50, left: 65 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const minDay = zoomRange[0];
  const maxDay = zoomRange[1];

  const getX = (day: number) => {
    if (maxDay === minDay) return padding.left;
    return padding.left + ((day - minDay) / (maxDay - minDay)) * plotWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(maxY, val));
    return padding.top + plotHeight - (clamped / maxY) * plotHeight;
  };

  // Generate SVG path for a policy's ending inventory
  const generatePath = (records: PolicyResult['dailyRecords']) => {
    const filtered = records.filter((r) => r.day >= minDay && r.day <= maxDay);
    if (filtered.length === 0) return '';

    return filtered.reduce((acc, curr, idx) => {
      const x = getX(curr.day);
      const y = getY(curr.endingInventory);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  // Generate fill area
  const generateArea = (records: PolicyResult['dailyRecords']) => {
    const filtered = records.filter((r) => r.day >= minDay && r.day <= maxDay);
    if (filtered.length === 0) return '';

    const firstX = getX(filtered[0].day);
    const lastX = getX(filtered[filtered.length - 1].day);
    const baseY = getY(0);

    const linePath = filtered.reduce((acc, curr, idx) => {
      const x = getX(curr.day);
      const y = getY(curr.endingInventory);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');

    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  // Y-axis tick intervals
  const yTicks = useMemo(() => {
    const tickCount = 6;
    const step = Math.ceil(maxY / tickCount);
    const ticks = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(i * step);
    }
    return ticks;
  }, [maxY]);

  // X-axis tick intervals
  const xTicks = useMemo(() => {
    const range = maxDay - minDay;
    const step = range <= 30 ? 5 : range <= 60 ? 10 : range <= 120 ? 15 : 30;
    const ticks: number[] = [];
    let cur = Math.ceil(minDay / step) * step;
    if (cur < minDay) cur = minDay;
    while (cur <= maxDay) {
      ticks.push(cur);
      cur += step;
    }
    if (ticks[0] !== minDay && minDay + 3 < ticks[0]) ticks.unshift(minDay);
    if (ticks[ticks.length - 1] !== maxDay && maxDay - ticks[ticks.length - 1] > 3) ticks.push(maxDay);
    return ticks;
  }, [minDay, maxDay]);

  // Handle mouse move on SVG
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relativeX = (clientX / rect.width) * svgWidth;

    if (relativeX < padding.left || relativeX > svgWidth - padding.right) {
      setHoverDay(null);
      return;
    }

    const ratio = (relativeX - padding.left) / plotWidth;
    const day = Math.round(minDay + ratio * (maxDay - minDay));
    setHoverDay(Math.max(minDay, Math.min(maxDay, day)));
  };

  const handleMouseLeave = () => {
    setHoverDay(null);
  };

  // Hover data lookup
  const hoverData = useMemo(() => {
    if (!hoverDay) return null;
    const dayData: Record<string, any> = { day: hoverDay };
    results.forEach((res) => {
      const rec = res.dailyRecords.find((r) => r.day === hoverDay);
      if (rec) {
        dayData[res.id] = rec;
      }
    });
    return dayData;
  }, [hoverDay, results]);

  // Reference lines for (s, Q) safety stock & ROP
  const ropPolicy = results.find((r) => r.id === 'reorder_point');
  const safetyStockVal = ropPolicy?.parameters.safetyStock || 0;
  const reorderPointVal = ropPolicy?.parameters.reorderPoint || 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Inventory Trajectory Over Time
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
              Daily On-Hand Stock
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare inventory buffer depletion, order arrivals, and stockout occurrences across policies
          </p>
        </div>

        {/* Zoom Window Presets */}
        <div className="flex flex-wrap items-center gap-1.5 self-stretch md:self-auto">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <ZoomIn className="w-3.5 h-3.5" /> View:
          </span>
          {[
            { label: 'All Days', days: simulationDays },
            { label: 'First 30d', days: 30 },
            { label: 'First 60d', days: 60 },
            { label: 'First 90d', days: 90 },
          ].map((preset) => {
            const isSelected =
              zoomRange[0] === 1 &&
              (preset.days >= simulationDays
                ? zoomRange[1] === simulationDays
                : zoomRange[1] === preset.days);
            return (
              <button
                key={preset.label}
                onClick={() => handleZoomPreset(preset.days)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Policy Visibility Toggles & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-600 dark:text-slate-300">Policies:</span>
          {results.map((res) => {
            const colors = policyColors[res.id];
            const isVisible = visiblePolicies[res.id];
            return (
              <button
                key={res.id}
                onClick={() => togglePolicy(res.id)}
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all ${
                  isVisible
                    ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'bg-transparent border-dashed border-slate-300 dark:border-slate-700 text-slate-400 opacity-60'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: colors.stroke }}
                />
                <span className="font-medium">{res.shortName}</span>
                {isVisible ? (
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={showStockoutMarkers}
              onChange={(e) => setShowStockoutMarkers(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Stockout markers
            </span>
          </label>

          <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={showReferenceLines}
              onChange={(e) => setShowReferenceLines(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span>Safety Stock threshold</span>
          </label>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative w-full overflow-hidden select-none" ref={containerRef}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Gradients for area fills */}
            {results.map((res) => (
              <linearGradient
                key={`grad-${res.id}`}
                id={`grad-${res.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={policyColors[res.id].stroke} stopOpacity="0.22" />
                <stop offset="100%" stopColor={policyColors[res.id].stroke} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Background horizontal grid lines */}
          {yTicks.map((val) => {
            const y = getY(val);
            return (
              <g key={`y-grid-${val}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800/80"
                  strokeWidth="1"
                  strokeDasharray={val === 0 ? undefined : '3 3'}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] fill-slate-400 font-mono"
                >
                  {val.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Zero baseline */}
          <line
            x1={padding.left}
            y1={getY(0)}
            x2={svgWidth - padding.right}
            y2={getY(0)}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeWidth="1.5"
          />

          {/* Vertical grid lines (X axis ticks) */}
          {xTicks.map((day) => {
            const x = getX(day);
            return (
              <g key={`x-grid-${day}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + plotHeight}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800/60"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + plotHeight + 20}
                  textAnchor="middle"
                  className="text-[11px] fill-slate-400 font-mono"
                >
                  Day {day}
                </text>
              </g>
            );
          })}

          {/* Y Axis Label */}
          <text
            x={-svgHeight / 2}
            y={18}
            transform="rotate(-90)"
            textAnchor="middle"
            className="text-[11px] fill-slate-400 font-medium tracking-wide"
          >
            Ending Inventory (Units)
          </text>

          {/* Reference Line: Safety Stock */}
          {showReferenceLines && safetyStockVal > 0 && safetyStockVal <= maxY && (
            <g>
              <line
                x1={padding.left}
                y1={getY(safetyStockVal)}
                x2={svgWidth - padding.right}
                y2={getY(safetyStockVal)}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.85"
              />
              <text
                x={svgWidth - padding.right - 5}
                y={getY(safetyStockVal) - 6}
                textAnchor="end"
                className="text-[10px] fill-emerald-600 dark:fill-emerald-400 font-semibold"
              >
                Safety Stock Buffer: {safetyStockVal} units
              </text>
            </g>
          )}

          {/* Reference Line: Reorder Point (s) */}
          {showReferenceLines && reorderPointVal > 0 && reorderPointVal <= maxY && (
            <g>
              <line
                x1={padding.left}
                y1={getY(reorderPointVal)}
                x2={svgWidth - padding.right}
                y2={getY(reorderPointVal)}
                stroke="#6366f1"
                strokeWidth="1"
                strokeDasharray="2 3"
                opacity="0.6"
              />
              <text
                x={padding.left + 8}
                y={getY(reorderPointVal) - 5}
                className="text-[9px] fill-indigo-500 dark:fill-indigo-400 font-medium"
              >
                ROP threshold (s={reorderPointVal})
              </text>
            </g>
          )}

          {/* Policy Area and Lines */}
          {results.map((res) => {
            if (!visiblePolicies[res.id]) return null;
            const colors = policyColors[res.id];
            const linePath = generatePath(res.dailyRecords);
            const areaPath = generateArea(res.dailyRecords);

            return (
              <g key={`policy-graph-${res.id}`}>
                {/* Area Gradient */}
                <path d={areaPath} fill={`url(#grad-${res.id})`} />
                {/* Main Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={colors.stroke}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Stockout Event Markers */}
          {showStockoutMarkers &&
            results.map((res) => {
              if (!visiblePolicies[res.id]) return null;
              const stockoutRecs = res.dailyRecords.filter(
                (r) => r.day >= minDay && r.day <= maxDay && r.stockoutUnits > 0
              );

              return stockoutRecs.map((rec) => {
                const cx = getX(rec.day);
                const cy = getY(0);
                return (
                  <g key={`stockout-${res.id}-${rec.day}`}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="4"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="animate-pulse"
                    />
                  </g>
                );
              });
            })}

          {/* Hover crosshair and data points */}
          {hoverDay && (
            <g>
              {/* Vertical Guide Line */}
              <line
                x1={getX(hoverDay)}
                y1={padding.top}
                x2={getX(hoverDay)}
                y2={padding.top + plotHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Data circles on the line for visible policies */}
              {results.map((res) => {
                if (!visiblePolicies[res.id]) return null;
                const rec = res.dailyRecords.find((r) => r.day === hoverDay);
                if (!rec) return null;
                const cx = getX(hoverDay);
                const cy = getY(rec.endingInventory);

                return (
                  <circle
                    key={`point-${res.id}`}
                    cx={cx}
                    cy={cy}
                    r="5"
                    fill={policyColors[res.id].stroke}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="shadow-sm"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverDay && hoverData && (
          <div
            className="absolute top-3 right-4 z-20 bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md px-3.5 py-3 rounded-xl shadow-xl border border-slate-700/60 pointer-events-none text-xs min-w-[210px]"
          >
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
              <span className="font-bold text-slate-200">Day {hoverDay}</span>
              <span className="text-[11px] text-slate-400 font-mono">
                Demand: {hoverData.eoq?.demand ?? hoverData.reorder_point?.demand ?? 0} units
              </span>
            </div>

            <div className="space-y-1.5">
              {results.map((res) => {
                if (!visiblePolicies[res.id]) return null;
                const rec = hoverData[res.id];
                if (!rec) return null;
                const color = policyColors[res.id];

                return (
                  <div key={res.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color.stroke }}
                      />
                      <span className="text-slate-300 font-medium">{res.shortName}:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-100">
                        {rec.endingInventory} units
                      </span>
                      {rec.stockoutUnits > 0 && (
                        <span className="text-[10px] text-rose-400 font-bold bg-rose-950/80 px-1 py-0.2 rounded">
                          -{rec.stockoutUnits}
                        </span>
                      )}
                      {rec.orderPlaced && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1 py-0.2 rounded font-medium">
                          +Ord {rec.orderQuantity}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Notes */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
          <span>Red pulses indicate stockout incidents (unmet customer demand).</span>
        </div>
        <div>
          <span>Hover over chart to inspect daily inventory level, demand, and reorder events.</span>
        </div>
      </div>
    </div>
  );
};
