import React, { useState, useMemo } from 'react';
import { jStat, round, PRECISION } from '../lib/stats';
import { Copy, Check } from 'lucide-react';

export const BinomialDistribution: React.FC = () => {
  const [n, setN] = useState<number>(8);
  const [p, setP] = useState<number>(0.75);
  const [pType, setPType] = useState<'BETWEEN' | 'LEFT' | 'RIGHT' | 'EQUAL'>('BETWEEN');
  const [x1, setX1] = useState<number>(3);
  const [x2, setX2] = useState<number>(6);
  const [copied, setCopied] = useState(false);

  const mean = useMemo(() => n * p, [n, p]);
  const stdev = useMemo(() => Math.sqrt(Math.max(0, n * p * (1 - p))), [n, p]);

  // Bar heights (PDF for each x = 0 ... n)
  const barData = useMemo(() => {
    const bars: { x: number; prob: number; isSelected: boolean }[] = [];
    const validN = Math.min(Math.max(1, n), 80);

    for (let i = 0; i <= validN; i++) {
      const prob = jStat.binomial.pdf(i, validN, p);
      let isSelected = false;

      if (pType === 'EQUAL') {
        isSelected = i === x1;
      } else if (pType === 'LEFT') {
        isSelected = i <= x2;
      } else if (pType === 'RIGHT') {
        isSelected = i >= x1;
      } else if (pType === 'BETWEEN') {
        const lower = Math.min(x1, x2);
        const upper = Math.max(x1, x2);
        isSelected = i >= lower && i <= upper;
      }

      bars.push({ x: i, prob, isSelected });
    }
    return bars;
  }, [n, p, pType, x1, x2]);

  // Total probability for current selection
  const totalProb = useMemo(() => {
    let sum = 0;
    barData.forEach((b) => {
      if (b.isSelected) sum += b.prob;
    });
    return round(sum, PRECISION);
  }, [barData]);

  const makeFunctionString = () => {
    if (pType === 'BETWEEN') {
      const lower = Math.min(x1, x2);
      const upper = Math.max(x1, x2);
      return `binomcdf(${n}, ${p}, ${upper}) - binomcdf(${n}, ${p}, ${lower - 1})`;
    } else if (pType === 'LEFT') {
      return `binomcdf(${n}, ${p}, ${x2})`;
    } else if (pType === 'RIGHT') {
      return `1 - binomcdf(${n}, ${p}, ${x1 - 1})`;
    } else {
      return `binompdf(${n}, ${p}, ${x1})`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(makeFunctionString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // SVG dimensions for histogram
  const svgWidth = 640;
  const svgHeight = 260;
  const padding = { top: 25, bottom: 40, left: 40, right: 25 };

  const maxProb = Math.max(...barData.map((b) => b.prob), 0.1) * 1.15;

  const toSvgX = (index: number, total: number) => {
    const plotWidth = svgWidth - padding.left - padding.right;
    const barSpacing = plotWidth / total;
    return padding.left + index * barSpacing;
  };

  const toSvgY = (prob: number) => {
    const ratio = prob / maxProb;
    return svgHeight - padding.bottom - ratio * (svgHeight - padding.top - padding.bottom);
  };

  const barWidth = Math.max(2, (svgWidth - padding.left - padding.right) / barData.length - 3);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-lg text-slate-900">Binomial Distribution Visualizer & Histogram</h2>
            <p className="text-xs text-slate-500">Discrete probability mass function (PMF), interactive range selection, mean, and standard deviation</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 self-start sm:self-auto text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-colors font-mono"
            title="Copy calculator syntax"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Function'}</span>
          </button>
        </div>

        {/* Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-5 text-sm font-mono">
          <div>
            <label className="block text-xs font-sans text-slate-600 mb-1">Trials (n)</label>
            <input
              type="number"
              min="1"
              max="80"
              value={n}
              onChange={(e) => {
                const newN = Math.max(1, Math.min(80, parseInt(e.target.value) || 1));
                setN(newN);
                if (x1 > newN) setX1(newN);
                if (x2 > newN) setX2(newN);
              }}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-slate-600 mb-1">Probability (p)</label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={p}
              onChange={(e) => setP(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-slate-600 mb-1">Mean (μ = n·p)</label>
            <div className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-emerald-700 font-bold">
              {round(mean, 4)}
            </div>
          </div>
          <div>
            <label className="block text-xs font-sans text-slate-600 mb-1">StDev (σ = √npq)</label>
            <div className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-sky-700 font-bold">
              {round(stdev, 4)}
            </div>
          </div>
        </div>

        {/* SVG Histogram */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 overflow-hidden mb-5">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto max-h-72 select-none">
            {/* Horizontal Grid lines */}
            {[0.25, 0.5, 0.75, 1.0].map((frac, i) => {
              const val = frac * maxProb;
              const y = toSvgY(val);
              return (
                <g key={i}>
                  <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <text x={padding.left - 6} y={y + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                    {round(val, 2)}
                  </text>
                </g>
              );
            })}

            {/* Baseline */}
            <line
              x1={padding.left}
              y1={toSvgY(0)}
              x2={svgWidth - padding.right}
              y2={toSvgY(0)}
              stroke="#94a3b8"
              strokeWidth="1.5"
            />

            {/* Histogram Bars */}
            {barData.map((bar, i) => {
              const x = toSvgX(i, barData.length);
              const y = toSvgY(bar.prob);
              const height = toSvgY(0) - y;
              const step = barData.length > 30 ? 5 : barData.length > 15 ? 2 : 1;

              return (
                <g key={i} className="cursor-pointer" onClick={() => {
                  if (pType === 'EQUAL') setX1(bar.x);
                  else if (pType === 'LEFT') setX2(bar.x);
                  else if (pType === 'RIGHT') setX1(bar.x);
                }}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(1, height)}
                    rx="2"
                    fill={bar.isSelected ? '#2563eb' : '#e2e8f0'}
                    stroke={bar.isSelected ? '#1d4ed8' : '#cbd5e1'}
                    strokeWidth="1"
                    className="transition-colors hover:opacity-90"
                  >
                    <title>X = {bar.x}: P(X = {bar.x}) = {round(bar.prob, 5)}</title>
                  </rect>

                  {/* Tick label */}
                  {i % step === 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={toSvgY(0) + 16}
                      fill={bar.isSelected ? '#1d4ed8' : '#64748b'}
                      fontSize="10"
                      textAnchor="middle"
                      fontFamily="monospace"
                      fontWeight={bar.isSelected ? 'bold' : 'normal'}
                    >
                      {bar.x}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Region Selector */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-5">
          <span className="text-xs tracking-wide text-slate-600 font-semibold block mb-2.5">
            Probability Type
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => setPType('BETWEEN')}
              className={`px-3 py-2 rounded-md font-mono transition-all ${
                pType === 'BETWEEN' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              P(a ≤ X ≤ b)
            </button>
            <button
              onClick={() => setPType('LEFT')}
              className={`px-3 py-2 rounded-md font-mono transition-all ${
                pType === 'LEFT' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              P(X ≤ b)
            </button>
            <button
              onClick={() => setPType('RIGHT')}
              className={`px-3 py-2 rounded-md font-mono transition-all ${
                pType === 'RIGHT' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              P(X ≥ a)
            </button>
            <button
              onClick={() => setPType('EQUAL')}
              className={`px-3 py-2 rounded-md font-mono transition-all ${
                pType === 'EQUAL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              P(X = a)
            </button>
          </div>
        </div>

        {/* Values Input */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {(pType === 'BETWEEN' || pType === 'RIGHT' || pType === 'EQUAL') && (
              <div className="flex-1 w-full">
                <div className="flex justify-between text-xs mb-1 text-slate-600">
                  <span>{pType === 'EQUAL' ? 'Value (a)' : 'Lower Bound (a)'}</span>
                  <span>Max: {n}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={n}
                  value={x1}
                  onChange={(e) => setX1(Math.max(0, Math.min(n, parseInt(e.target.value) || 0)))}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900"
                />
              </div>
            )}

            {(pType === 'BETWEEN' || pType === 'LEFT') && (
              <div className="flex-1 w-full">
                <div className="flex justify-between text-xs mb-1 text-slate-600">
                  <span>Upper Bound (b)</span>
                  <span>Max: {n}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={n}
                  value={x2}
                  onChange={(e) => setX2(Math.max(0, Math.min(n, parseInt(e.target.value) || 0)))}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900"
                />
              </div>
            )}

            <div className="flex-1 w-full">
              <div className="flex justify-between text-xs mb-1 text-slate-600">
                <span>Total Probability</span>
                <span>{(totalProb * 100).toFixed(2)}%</span>
              </div>
              <div className="w-full bg-white border border-emerald-500 text-emerald-700 font-bold rounded px-3 py-2 text-lg">
                = {totalProb}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-sans">Function Representation:</span>
            <code className="text-blue-700 bg-white border border-slate-200 px-2 py-0.5 rounded">{makeFunctionString()}</code>
          </div>
        </div>
      </div>
    </div>
  );
};
