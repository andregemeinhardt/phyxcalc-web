/**
 * Plot Dialog / Panel Component.
 * Interactive charting and accessible data exploration for datasets.
 * Features:
 * - Line and spline curves, point marker toggles
 * - Linear and logarithmic axes
 * - Zoom in, zoom out, and reset zoom controls
 * - Toggleable accessible Data Table alternative for touch/screen-readers
 * - CSV and Print Chart export
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DatasetInfo } from '../engine/api';
import { ErrorBoundary } from './ErrorBoundary';
import {
  X,
  FileSpreadsheet,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Table as TableIcon,
  LineChart as ChartIcon,
  Dot,
  MoveHorizontal,
} from 'lucide-react';

ChartJS.register(...registerables);

interface PlotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  datasets: DatasetInfo[];
}

export const PlotDialog: React.FC<PlotDialogProps> = ({
  isOpen,
  onClose,
  datasets,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeView, setActiveView] = useState<'chart' | 'table'>('chart');
  const [xScaleType, setXScaleType] = useState<'linear' | 'logarithmic'>('linear');
  const [yScaleType, setYScaleType] = useState<'linear' | 'logarithmic'>('linear');
  const [showMarkers, setShowMarkers] = useState(true);
  const [smoothCurves, setSmoothCurves] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [tableFilter, setTableFilter] = useState('');

  const dragStartRef = useRef<{ x: number; pan: number } | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const activeDataset = datasets[selectedIdx] || datasets[0];
  const points = activeDataset?.points || [];

  // Reset zoom & pan when dataset or view changes
  useEffect(() => {
    setZoomLevel(1);
    setPanOffset(0);
    setIsDragging(false);
    dragStartRef.current = null;
  }, [selectedIdx, isOpen]);

  // Computed visible points under zoom level and pan offset
  const visiblePoints = useMemo(() => {
    if (points.length === 0) return points;
    if (zoomLevel === 1) return points;

    const count = Math.max(2, Math.floor(points.length / zoomLevel));
    const maxStart = Math.max(0, points.length - count);
    const centerStart = Math.floor(maxStart / 2);
    const clampedStart = Math.max(0, Math.min(maxStart, centerStart + panOffset));
    return points.slice(clampedStart, clampedStart + count);
  }, [points, zoomLevel, panOffset]);

  const chartData = useMemo(
    () => ({
      datasets: [
        {
          label: `${activeDataset?.name || 'Dataset'} (Real)`,
          data: visiblePoints.map((p) => ({ x: p.x, y: p.yReal })),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.4)',
          tension: smoothCurves ? 0.3 : 0,
          pointRadius: showMarkers ? (visiblePoints.length > 100 ? 2 : 4) : 0,
          pointHoverRadius: 6,
        },
        ...(visiblePoints.some((p) => Math.abs(p.yImag) > 1e-12)
          ? [
              {
                label: `${activeDataset?.name || 'Dataset'} (Imaginary)`,
                data: visiblePoints.map((p) => ({ x: p.x, y: p.yImag })),
                borderColor: 'rgb(244, 63, 94)',
                backgroundColor: 'rgba(244, 63, 94, 0.4)',
                borderDash: [5, 5],
                tension: smoothCurves ? 0.3 : 0,
                pointRadius: showMarkers ? 3 : 0,
              },
            ]
          : []),
      ],
    }),
    [activeDataset?.name, visiblePoints, smoothCurves, showMarkers]
  );

  const chartOptions: any = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            boxWidth: 12,
            font: { size: 11 },
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const raw = context.raw as { x: number; y: number } | undefined;
              const pt = visiblePoints[context.dataIndex];
              if (pt && Math.abs(pt.yImag) > 1e-12) {
                return `(X: ${pt.x}) Y: ${pt.yReal.toFixed(6)} + ${pt.yImag.toFixed(6)}j`;
              }
              return raw ? `(X: ${raw.x}) Y: ${raw.y}` : `Y: ${context.parsed.y}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: xScaleType,
          title: { display: true, text: 'X Parameter', font: { size: 11, weight: 'bold' } },
          grid: { color: 'rgba(148, 163, 184, 0.15)' },
        },
        y: {
          type: yScaleType,
          title: { display: true, text: 'Value (Y)', font: { size: 11, weight: 'bold' } },
          grid: { color: 'rgba(148, 163, 184, 0.15)' },
        },
      },
    }),
    [xScaleType, yScaleType, visiblePoints]
  );

  const exportCSV = () => {
    if (!activeDataset) return;
    const rows = ['x,y_real,y_imag', ...points.map((p) => `${p.x},${p.yReal},${p.yImag}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDataset.name || 'dataset'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printChart = () => {
    window.print();
  };

  const handleZoomIn = () => {
    setZoomLevel((z) => Math.min(z * 1.5, 10));
  };

  const handleZoomOut = () => {
    setZoomLevel((z) => {
      const next = Math.max(z / 1.5, 1);
      if (next === 1) setPanOffset(0);
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset(0);
  };

  // Mouse pan handlers for dragging when zoomed in
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1 || activeView !== 'chart' || points.length === 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, pan: panOffset };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || zoomLevel <= 1) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const containerWidth = chartContainerRef.current?.clientWidth || 800;
    const count = Math.max(2, Math.floor(points.length / zoomLevel));
    const pointsShift = (deltaX / containerWidth) * count;
    const maxStart = Math.max(0, points.length - count);
    const centerStart = Math.floor(maxStart / 2);
    const targetPan = Math.round(dragStartRef.current.pan - pointsShift);
    const clampedPan = Math.max(-centerStart, Math.min(maxStart - centerStart, targetPan));
    setPanOffset(clampedPan);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const filteredPoints = useMemo(() => {
    if (!tableFilter.trim()) return points;
    const q = tableFilter.toLowerCase();
    return points.filter(
      (p) =>
        p.x.toString().includes(q) ||
        p.yReal.toString().includes(q) ||
        p.yImag.toString().includes(q)
    );
  }, [points, tableFilter]);

  // Early return ONLY after ALL hooks have been invoked
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-5xl h-[640px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              Plot & Dataset Viewer
            </span>
            {activeDataset && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono">
                {activeDataset.name} ({points.length} pts)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded text-xs">
              <button
                type="button"
                onClick={() => setActiveView('chart')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                  activeView === 'chart'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ChartIcon size={13} /> Chart
              </button>
              <button
                type="button"
                onClick={() => setActiveView('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                  activeView === 'table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <TableIcon size={13} /> Data Table
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 flex-wrap">
            {datasets.length > 1 && (
              <select
                value={selectedIdx}
                onChange={(e) => {
                  setSelectedIdx(Number(e.target.value));
                  setZoomLevel(1);
                  setPanOffset(0);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 outline-none font-medium"
              >
                {datasets.map((d, i) => (
                  <option key={i} value={i}>
                    {d.name} ({d.count} pts)
                  </option>
                ))}
              </select>
            )}

            {activeView === 'chart' && (
              <>
                {/* Scales */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded">
                  <span className="text-[11px] text-slate-500 px-1">X:</span>
                  <button
                    className={`px-1.5 py-0.5 rounded text-[11px] ${
                      xScaleType === 'linear'
                        ? 'bg-white dark:bg-slate-700 font-semibold text-blue-600 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                    onClick={() => setXScaleType('linear')}
                  >
                    Lin
                  </button>
                  <button
                    className={`px-1.5 py-0.5 rounded text-[11px] ${
                      xScaleType === 'logarithmic'
                        ? 'bg-white dark:bg-slate-700 font-semibold text-blue-600 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                    onClick={() => setXScaleType('logarithmic')}
                  >
                    Log
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded">
                  <span className="text-[11px] text-slate-500 px-1">Y:</span>
                  <button
                    className={`px-1.5 py-0.5 rounded text-[11px] ${
                      yScaleType === 'linear'
                        ? 'bg-white dark:bg-slate-700 font-semibold text-blue-600 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                    onClick={() => setYScaleType('linear')}
                  >
                    Lin
                  </button>
                  <button
                    className={`px-1.5 py-0.5 rounded text-[11px] ${
                      yScaleType === 'logarithmic'
                        ? 'bg-white dark:bg-slate-700 font-semibold text-blue-600 dark:text-blue-400 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                    onClick={() => setYScaleType('logarithmic')}
                  >
                    Log
                  </button>
                </div>

                {/* Markers & Curve */}
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={() => setShowMarkers(!showMarkers)}
                  className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 ${
                    showMarkers
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 text-blue-700 dark:text-blue-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                  title="Toggle data point markers"
                >
                  <Dot size={14} className="-mr-1 -ml-1" /> Markers
                </button>

                <button
                  type="button"
                  onClick={() => setSmoothCurves(!smoothCurves)}
                  className={`px-2 py-1 rounded border text-[11px] ${
                    smoothCurves
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 text-blue-700 dark:text-blue-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                  title="Toggle smoothed spline vs straight lines"
                >
                  Smooth
                </button>

                {/* Zoom controls */}
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 10}
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 disabled:opacity-40"
                    title="Zoom in"
                  >
                    <ZoomIn size={13} />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 disabled:opacity-40"
                    title="Zoom out"
                  >
                    <ZoomOut size={13} />
                  </button>
                  {zoomLevel > 1 && (
                    <>
                      <button
                        onClick={handleResetZoom}
                        className="flex items-center gap-1 px-1.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px]"
                        title="Reset Zoom"
                      >
                        <RotateCcw size={11} /> Reset ({zoomLevel.toFixed(1)}x)
                      </button>
                      <span className="flex items-center gap-1 text-[11px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        <MoveHorizontal size={11} /> Drag to pan
                      </span>
                    </>
                  )}
                </div>
              </>
            )}

            {activeView === 'table' && (
              <input
                type="text"
                placeholder="Filter data points..."
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs outline-none w-48"
              >
              </input>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={printChart}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs"
              title="Print chart or table"
            >
              <Printer size={13} /> Print
            </button>
            <button
              onClick={exportCSV}
              disabled={points.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs disabled:opacity-50"
              title="Export points to CSV"
            >
              <FileSpreadsheet size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 p-4 relative overflow-hidden flex flex-col">
          {points.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <p className="text-sm font-medium">No dataset data available</p>
              <p className="text-xs mt-1">
                Create a dataset in your worksheet, for example:
              </p>
              <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded mt-2 text-blue-600 dark:text-blue-400">
                d = data(0, 10, 0.2, sin(x))
              </code>
            </div>
          ) : activeView === 'chart' ? (
            <div
              ref={chartContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`flex-1 w-full h-full relative select-none ${
                zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
              }`}
            >
              <ErrorBoundary>
                <Line data={chartData} options={chartOptions} />
              </ErrorBoundary>
            </div>
          ) : (
            <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 rounded">
              <table
                className="w-full text-left font-mono text-xs border-collapse"
                aria-label="Dataset Samples Table"
              >
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-1.5 px-3 w-12 text-slate-400 font-medium">#</th>
                    <th className="py-1.5 px-3 font-semibold text-slate-700 dark:text-slate-300">X (Parameter)</th>
                    <th className="py-1.5 px-3 font-semibold text-blue-600 dark:text-blue-400">Y (Real Value)</th>
                    <th className="py-1.5 px-3 font-semibold text-rose-600 dark:text-rose-400">Y (Imaginary Value)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPoints.map((pt, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-1 px-3 text-slate-400 text-[11px]">{i + 1}</td>
                      <td className="py-1 px-3 text-slate-800 dark:text-slate-200">{pt.x}</td>
                      <td className="py-1 px-3 font-medium text-blue-700 dark:text-blue-300">{pt.yReal}</td>
                      <td className="py-1 px-3 text-rose-600 dark:text-rose-400">{pt.yImag}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
