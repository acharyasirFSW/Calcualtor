import React, { useState, useMemo } from 'react';
import { jStat, round, PRECISION } from '../lib/stats';
import { Copy, Check, Info } from 'lucide-react';

export const NormalDistribution: React.FC = () => {
  const [mean, setMean] = useState<number>(0);
  const [stdev, setStdev] = useState<number>(1);
  const [n, setN] = useState<number>(1);
  const [probType, setProbType] = useState<'BETWEEN' | 'LEFT' | 'RIGHT'>('BETWEEN');
  const [funcType, setFuncType] = useState<'PROBABILITY' | 'INVERSE'>('PROBABILITY');

  const [x1, setX1] = useState<number>(-2);
  const [x2, setX2] = useState<number>(2);
  const [probInput, setProbInput] = useState<number>(0.9545);
  const [copied, setCopied] = useState(false);

  const se = useMemo(() => {
    const s = stdev > 0 ? stdev : 1;
    const count = n > 0 ? n : 1;
    return s / Math.sqrt(count);
  }, [stdev, n]);

  // Compute calculated probability or inverse values
  const currentProb = useMemo(() => {
    if (funcType === 'INVERSE') {
      return probInput;
    }
    const p1 = jStat.normal.cdf(x1, mean, se);
    const p2 = jStat.normal.cdf(x2, mean, se);

    if (probType === 'BETWEEN') {
      return round(Math.abs(p2 - p1), PRECISION);
    } else if (probType === 'LEFT') {
      return round(p2, PRECISION);
    } else {
      return round(1 - p1, PRECISION);
    }
  }, [funcType, probType, x1, x2, mean, se, probInput]);

  // Handle inverse calculations
  const handleInverseCalc = (newProb: number) => {
    const p = Math.max(0.000001, Math.min(0.999999, newProb));
    setProbInput(p);
    if (probType === 'LEFT') {
      const computedX2 = jStat.normal.inv(p, mean, se);
      setX2(round(computedX2, PRECISION));
    } else if (probType === 'RIGHT') {
      const computedX1 = jStat.normal.inv(1 - p, mean, se);
      setX1(round(computedX1, PRECISION));
    } else if (probType === 'BETWEEN') {
      const computedX1 = jStat.normal.inv((1 - p) / 2, mean, se);
      const computedX2 = jStat.normal.inv((1 + p) / 2, mean, se);
      setX1(round(computedX1, PRECISION));
      setX2(round(computedX2, PRECISION));
    }
  };

  const makeFunctionString = () => {
    if (funcType === 'PROBABILITY') {
      if (probType === 'BETWEEN') {
        return `normalcdf(${x1}, ${x2}, ${mean}, ${stdev})`;
      } else if (probType === 'LEFT') {
        return `normalcdf(-1E99, ${x2}, ${mean}, ${stdev})`;
      } else {
        return `normalcdf(${x1}, 1E99, ${mean}, ${stdev})`;
      }
    } else {
      const tailStr = probType === 'BETWEEN' ? 'CENTER' : probType === 'LEFT' ? 'LEFT' : 'RIGHT';
      return `invNorm(${currentProb}, ${mean}, ${stdev}, ${tailStr})`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(makeFunctionString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate SVG curve points
  const svgWidth = 640;
  const svgHeight = 260;
  const padding = { top: 25, bottom: 40, left: 35, right: 35 };

  const xMin = mean - 4 * se;
  const xMax = mean + 4 * se;
  const yMax = (1 / (se * Math.sqrt(2 * Math.PI))) * 1.15;

  const toSvgX = (x: number) => {
    const ratio = (x - xMin) / (xMax - xMin);
    return padding.left + ratio * (svgWidth - padding.left - padding.right);
  };

  const toSvgY = (y: number) => {
    const ratio = y / yMax;
    return svgHeight - padding.bottom - ratio * (svgHeight - padding.top - padding.bottom);
  };

  const numPoints = 120;
  const curvePoints: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const x = xMin + (i / numPoints) * (xMax - xMin);
    const y = jStat.normal.pdf(x, mean, se);
    curvePoints.push([toSvgX(x), toSvgY(y)]);
  }

  const curvePathD = curvePoints.reduce(
    (acc, [x, y], i) => (i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`),
    ''
  );

  // Calculate shaded region polygon
  const shadePathD = useMemo(() => {
    let lowerBound = xMin;
    let upperBound = xMax;

    if (probType === 'BETWEEN') {
      lowerBound = Math.max(xMin, Math.min(x1, x2));
      upperBound = Math.min(xMax, Math.max(x1, x2));
    } else if (probType === 'LEFT') {
      lowerBound = xMin;
      upperBound = Math.min(xMax, x2);
    } else if (probType === 'RIGHT') {
      lowerBound = Math.max(xMin, x1);
      upperBound = xMax;
    }

    if (lowerBound >= upperBound) return '';

    const pts: [number, number][] = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const currX = lowerBound + (i / steps) * (upperBound - lowerBound);
      const currY = jStat.normal.pdf(currX, mean, se);
      pts.push([toSvgX(currX), toSvgY(currY)]);
    }

    const baselineY = toSvgY(0);
    let d = `M ${toSvgX(lowerBound)},${baselineY} `;
    pts.forEach(([px, py]) => {
      d += `L ${px},${py} `;
    });
    d += `L ${toSvgX(upperBound)},${baselineY} Z`;
    return d;
  }, [probType, x1, x2, xMin, xMax, mean, se]);

  // Tick marks
  const tickValues = [-3, -2, -1, 0, 1, 2, 3].map((z) => mean + z * se);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-lg text-slate-900">Normal Distribution Visualizer & Calculator</h2>
            <p className="text-xs text-slate-500">P(a &lt; X &lt; b), Left/Right tail, and Inverse Normal (invNorm) with interactive graph</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 self-start sm:self-auto text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-colors font-mono"
            title="Copy calculator syntax (e.g. TI-84 command)"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Function'}</span>
          </button>
        </div>

        {/* Parameters row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-5 text-sm font-mono">
          <div>
            <label className="block text-xs font-sans text-slate-600 mb-1">Mean (μ)</label>
            <input
              type="number"
              value={mean}
              onChange={(e) => setMean(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-slate-600 mb-1">Standard Deviation (σ)</label>
            <input
              type="number"
              step="0.1"
              value={stdev}
              onChange={(e) => setStdev(Math.max(0.001, parseFloat(e.target.value) || 1))}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-slate-600 mb-1">Sample Size (n)</label>
            <input
              type="number"
              min="1"
              value={n}
              onChange={(e) => setN(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
            {n > 1 && (
              <span className="text-[11px] text-sky-700 font-mono">SE = {round(se, 4)}</span>
            )}
          </div>
        </div>

        {/* Interactive Distribution Curve (SVG) */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 overflow-hidden mb-5">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto max-h-72 select-none">
            {/* Shaded Area */}
            {shadePathD && (
              <path d={shadePathD} fill="url(#normalGradient)" opacity="0.85" />
            )}

            {/* Distribution Curve Line */}
            <path d={curvePathD} fill="none" stroke="#0284c7" strokeWidth="2.5" />

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
                    fontSize="11"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {round(val, 2)}
                  </text>
                </g>
              );
            })}

            {/* Markers for x1 and x2 */}
            {(probType === 'BETWEEN' || probType === 'RIGHT') && (
              <g>
                <line
                  x1={toSvgX(x1)}
                  y1={toSvgY(0)}
                  x2={toSvgX(x1)}
                  y2={toSvgY(jStat.normal.pdf(x1, mean, se))}
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

            {(probType === 'BETWEEN' || probType === 'LEFT') && (
              <g>
                <line
                  x1={toSvgX(x2)}
                  y1={toSvgY(0)}
                  x2={toSvgX(x2)}
                  y2={toSvgY(jStat.normal.pdf(x2, mean, se))}
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
              <linearGradient id="normalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.12" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Operation Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Probability Type Selector */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs tracking-wide text-slate-600 font-semibold block mb-2.5">
              Region / Tail Type
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => setProbType('BETWEEN')}
                className={`px-3 py-2 rounded-md font-mono transition-all ${
                  probType === 'BETWEEN'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                P(a &lt; X &lt; b) [Between]
              </button>
              <button
                onClick={() => setProbType('LEFT')}
                className={`px-3 py-2 rounded-md font-mono transition-all ${
                  probType === 'LEFT'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                P(X &lt; b) [Left Tail]
              </button>
              <button
                onClick={() => setProbType('RIGHT')}
                className={`px-3 py-2 rounded-md font-mono transition-all ${
                  probType === 'RIGHT'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                P(X &gt; a) [Right Tail]
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs tracking-wide text-slate-600 font-semibold block mb-2.5">
              Calculation Mode
            </span>
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setFuncType('PROBABILITY')}
                className={`flex-1 px-3 py-2 rounded-md font-mono transition-all ${
                  funcType === 'PROBABILITY'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Calculate Area (Prob)
              </button>
              <button
                onClick={() => {
                  setFuncType('INVERSE');
                  handleInverseCalc(currentProb);
                }}
                className={`flex-1 px-3 py-2 rounded-md font-mono transition-all ${
                  funcType === 'INVERSE'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Calculate X-Value (invNorm)
              </button>
            </div>
          </div>
        </div>

        {/* Inputs & Values Slider/Numeric Bar */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* X1 input */}
            {(probType === 'BETWEEN' || probType === 'RIGHT') && (
              <div className="flex-1 w-full">
                <div className="flex justify-between text-xs mb-1 text-slate-600">
                  <span>Lower Bound (a)</span>
                  <span>z = {round((x1 - mean) / se, 3)}</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  disabled={funcType === 'INVERSE'}
                  value={x1}
                  onChange={(e) => setX1(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* X2 input */}
            {(probType === 'BETWEEN' || probType === 'LEFT') && (
              <div className="flex-1 w-full">
                <div className="flex justify-between text-xs mb-1 text-slate-600">
                  <span>Upper Bound (b)</span>
                  <span>z = {round((x2 - mean) / se, 3)}</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  disabled={funcType === 'INVERSE'}
                  value={x2}
                  onChange={(e) => setX2(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Probability Output or Input */}
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
                disabled={funcType === 'PROBABILITY'}
                value={funcType === 'INVERSE' ? probInput : currentProb}
                onChange={(e) => handleInverseCalc(parseFloat(e.target.value) || 0)}
                className={`w-full bg-white border rounded px-3 py-2 font-bold ${
                  funcType === 'PROBABILITY'
                    ? 'border-emerald-500 text-emerald-700 cursor-default'
                    : 'border-purple-500 text-purple-700'
                }`}
              />
            </div>
          </div>

          {/* Quick formula badge */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-sans">TI Function representation:</span>
            <code className="text-sky-700 bg-white border border-slate-200 px-2 py-0.5 rounded">{makeFunctionString()}</code>
          </div>
        </div>
      </div>
    </div>
  );
};
