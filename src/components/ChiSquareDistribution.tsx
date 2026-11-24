import React, { useState, useMemo } from 'react';
import { jStat, round, PRECISION } from '../lib/stats';
import { Copy, Check } from 'lucide-react';

export const ChiSquareDistribution: React.FC = () => {
  const [df, setDf] = useState<number>(6);
  const [tail, setTail] = useState<'BETWEEN' | 'LEFT' | 'RIGHT'>('BETWEEN');
  const [mode, setMode] = useState<'PROBABILITY' | 'INVERSE'>('PROBABILITY');

  const [x1, setX1] = useState<number>(2);
  const [x2, setX2] = useState<number>(10);
  const [probInput, setProbInput] = useState<number>(0.795);
  const [copied, setCopied] = useState(false);

  const mean = df;
  const stdev = Math.sqrt(2 * df);

  const currentProb = useMemo(() => {
    if (mode === 'INVERSE') return probInput;
    const p1 = jStat.chisquare.cdf(Math.max(0, x1), df);
    const p2 = jStat.chisquare.cdf(Math.max(0, x2), df);

    if (tail === 'BETWEEN') {
      return round(Math.abs(p2 - p1), PRECISION);
    } else if (tail === 'LEFT') {
      return round(p2, PRECISION);
    } else {
      return round(1 - p1, PRECISION);
    }
  }, [mode, tail, x1, x2, df, probInput]);

  const handleInverseCalc = (newP: number) => {
    const p = Math.max(0.000001, Math.min(0.999999, newP));
    setProbInput(p);
    if (tail === 'LEFT') {
      const val = jStat.chisquare.inv(p, df);
      setX2(round(val, PRECISION));
    } else if (tail === 'RIGHT') {
      const val = jStat.chisquare.inv(1 - p, df);
      setX1(round(val, PRECISION));
    } else if (tail === 'BETWEEN') {
      const val1 = jStat.chisquare.inv((1 - p) / 2, df);
      const val2 = jStat.chisquare.inv((1 + p) / 2, df);
      setX1(round(val1, PRECISION));
      setX2(round(val2, PRECISION));
    }
  };

  const makeFunctionString = () => {
    if (mode === 'PROBABILITY') {
      if (tail === 'BETWEEN') {
        return `χ²cdf(${x1}, ${x2}, ${df})`;
      } else if (tail === 'LEFT') {
        return `χ²cdf(0, ${x2}, ${df})`;
      } else {
        return `χ²cdf(${x1}, 1E99, ${df})`;
      }
    } else {
      return `invChi2(${currentProb}, ${df})`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(makeFunctionString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // SVG dimensions
  const svgWidth = 640;
  const svgHeight = 260;
  const padding = { top: 25, bottom: 40, left: 35, right: 35 };

  const xMin = 0;
  const xMax = Math.max(16, 4 * df);
  const peakX = df > 2 ? df - 2 : 0.5;
  const yPeak = jStat.chisquare.pdf(peakX, df);
  const yMax = Math.min(0.6, Math.max(0.15, yPeak * 1.25));

  const toSvgX = (x: number) => {
    const ratio = (x - xMin) / (xMax - xMin);
    return padding.left + ratio * (svgWidth - padding.left - padding.right);
  };

  const toSvgY = (y: number) => {
    const ratio = Math.min(1, y / yMax);
    return svgHeight - padding.bottom - ratio * (svgHeight - padding.top - padding.bottom);
  };

  const numPoints = 140;
  const curvePoints: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const x = xMin + 0.05 + (i / numPoints) * (xMax - xMin);
    const y = jStat.chisquare.pdf(x, df);
    if (isFinite(y)) {
      curvePoints.push([toSvgX(x), toSvgY(y)]);
    }
  }

  const curvePathD = curvePoints.reduce(
    (acc, [x, y], i) => (i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`),
    ''
  );

  const shadePathD = useMemo(() => {
    let lowerBound = 0.05;
    let upperBound = xMax;

    if (tail === 'BETWEEN') {
      lowerBound = Math.max(0.05, Math.min(x1, x2));
      upperBound = Math.min(xMax, Math.max(x1, x2));
    } else if (tail === 'LEFT') {
      lowerBound = 0.05;
      upperBound = Math.min(xMax, x2);
    } else if (tail === 'RIGHT') {
      lowerBound = Math.max(0.05, x1);
      upperBound = xMax;
    }

    if (lowerBound >= upperBound) return '';

    const pts: [number, number][] = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const currX = lowerBound + (i / steps) * (upperBound - lowerBound);
      const currY = jStat.chisquare.pdf(currX, df);
      if (isFinite(currY)) {
        pts.push([toSvgX(currX), toSvgY(currY)]);
      }
    }

    const baselineY = toSvgY(0);
    let d = `M ${toSvgX(lowerBound)},${baselineY} `;
    pts.forEach(([px, py]) => {
      d += `L ${px},${py} `;
    });
    d += `L ${toSvgX(upperBound)},${baselineY} Z`;
    return d;
  }, [tail, x1, x2, xMax, df]);

  // Ticks
  const tickStep = Math.max(1, Math.round(xMax / 8));
  const tickValues: number[] = [];
  for (let v = 0; v <= xMax; v += tickStep) {
    tickValues.push(v);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-lg text-slate-900">Chi-Square Distribution (χ²) Visualizer</h2>
            <p className="text-xs text-slate-500">Right-skewed continuous distribution, goodness-of-fit and independence tests</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-5 text-sm font-mono">
          <div>
            <label className="block text-xs font-sans text-slate-600 mb-1">Degrees of Freedom (df)</label>
            <input
              type="number"
              min="1"
              max="200"
              value={df}
              onChange={(e) => setDf(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-slate-600 mb-1">Mean (μ = df)</label>
            <div className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-emerald-700 font-bold">
              {mean}
            </div>
          </div>
          <div>
            <label className="block text-xs font-sans text-slate-600 mb-1">StDev (σ = √(2·df))</label>
            <div className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-sky-700 font-bold">
              {round(stdev, 4)}
            </div>
          </div>
        </div>

        {/* SVG Plot */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 overflow-hidden mb-5">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto max-h-72 select-none">
            {shadePathD && (
              <path d={shadePathD} fill="url(#chiGradient)" opacity="0.85" />
            )}

            <path d={curvePathD} fill="none" stroke="#d97706" strokeWidth="2.5" />

            {/* X-Axis */}
            <line
              x1={padding.left}
              y1={toSvgY(0)}
              x2={svgWidth - padding.right}
              y2={toSvgY(0)}
              stroke="#94a3b8"
              strokeWidth="1.5"
            />

            {/* Ticks and Labels */}
            {tickValues.map((val, i) => {
              const sx = toSvgX(val);
              const sy = toSvgY(0);
              return (
                <g key={i}>
                  <line x1={sx} y1={sy} x2={sx} y2={sy + 6} stroke="#94a3b8" strokeWidth="1" />
                  <text
                    x={sx}
                    y={sy + 18}
                    fill="#475569"
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Markers */}
            {(tail === 'BETWEEN' || tail === 'RIGHT') && (
              <g>
                <line
                  x1={toSvgX(x1)}
                  y1={toSvgY(0)}
                  x2={toSvgX(x1)}
                  y2={toSvgY(jStat.chisquare.pdf(x1, df))}
                  stroke="#e11d48"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
                <circle cx={toSvgX(x1)} cy={toSvgY(0)} r="5" fill="#e11d48" />
                <text
                  x={toSvgX(x1)}
                  y={toSvgY(0) - 8}
                  fill="#e11d48"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  a = {x1}
                </text>
              </g>
            )}

            {(tail === 'BETWEEN' || tail === 'LEFT') && (
              <g>
                <line
                  x1={toSvgX(x2)}
                  y1={toSvgY(0)}
                  x2={toSvgX(x2)}
                  y2={toSvgY(jStat.chisquare.pdf(x2, df))}
                  stroke="#059669"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
                <circle cx={toSvgX(x2)} cy={toSvgY(0)} r="5" fill="#059669" />
                <text
                  x={toSvgX(x2)}
                  y={toSvgY(0) - 8}
                  fill="#059669"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  b = {x2}
                </text>
              </g>
            )}

            <defs>
              <linearGradient id="chiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Tail & Mode Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs tracking-wide text-slate-600 font-semibold block mb-2.5">
              Region / Tail Type
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => setTail('BETWEEN')}
                className={`px-3 py-2 rounded-md font-mono transition-all ${
                  tail === 'BETWEEN'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                P(a &lt; X &lt; b) [Between]
              </button>
              <button
                onClick={() => setTail('LEFT')}
                className={`px-3 py-2 rounded-md font-mono transition-all ${
                  tail === 'LEFT'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                P(X &lt; b) [Left Tail]
              </button>
              <button
                onClick={() => setTail('RIGHT')}
                className={`px-3 py-2 rounded-md font-mono transition-all ${
                  tail === 'RIGHT'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                P(X &gt; a) [Right Tail]
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs tracking-wide text-slate-600 font-semibold block mb-2.5">
              Calculation Mode
            </span>
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setMode('PROBABILITY')}
                className={`flex-1 px-3 py-2 rounded-md font-mono transition-all ${
                  mode === 'PROBABILITY'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Calculate Area (Prob)
              </button>
              <button
                onClick={() => {
                  setMode('INVERSE');
                  handleInverseCalc(currentProb);
                }}
                className={`flex-1 px-3 py-2 rounded-md font-mono transition-all ${
                  mode === 'INVERSE'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Calculate Critical X (invChi2)
              </button>
            </div>
          </div>
        </div>

        {/* Inputs & Values */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {(tail === 'BETWEEN' || tail === 'RIGHT') && (
              <div className="flex-1 w-full">
                <div className="flex justify-between text-xs mb-1 text-slate-600">
                  <span>Lower Bound (a)</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  disabled={mode === 'INVERSE'}
                  value={x1}
                  onChange={(e) => setX1(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {(tail === 'BETWEEN' || tail === 'LEFT') && (
              <div className="flex-1 w-full">
                <div className="flex justify-between text-xs mb-1 text-slate-600">
                  <span>Upper Bound (b)</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  disabled={mode === 'INVERSE'}
                  value={x2}
                  onChange={(e) => setX2(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            )}

            <div className="flex-1 w-full">
              <div className="flex justify-between text-xs mb-1 text-slate-600">
                <span>Probability (Area)</span>
                <span>{(currentProb * 100).toFixed(2)}%</span>
              </div>
              <input
                type="number"
                step="0.0001"
                min="0"
                max="1"
                disabled={mode === 'PROBABILITY'}
                value={mode === 'INVERSE' ? probInput : currentProb}
                onChange={(e) => handleInverseCalc(parseFloat(e.target.value) || 0)}
                className={`w-full bg-white border rounded px-3 py-2 font-bold ${
                  mode === 'PROBABILITY'
                    ? 'border-emerald-500 text-emerald-700 cursor-default'
                    : 'border-indigo-500 text-indigo-700'
                }`}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-sans">Function Representation:</span>
            <code className="text-amber-700 bg-white border border-slate-200 px-2 py-0.5 rounded">{makeFunctionString()}</code>
          </div>
        </div>
      </div>
    </div>
  );
};
