import React, { useState } from 'react';
import { stats, round, evalstr, PRECISION, jStat } from '../lib/stats';
import {
  Calculator,
  Play,
  Trash2,
  Plus,
  Info,
  Copy,
  Check,
  Table,
  ClipboardPaste,
} from 'lucide-react';

interface GeneralCalculatorProps {
  l1: string[];
  setL1: React.Dispatch<React.SetStateAction<string[]>>;
  l2: string[];
  setL2: React.Dispatch<React.SetStateAction<string[]>>;
  l3: string[];
  setL3: React.Dispatch<React.SetStateAction<string[]>>;
}

export function parseDelimitedData(text: string): string[][] {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return lines.map((line) => {
    if (line.includes('\t')) {
      return line.split('\t').map((c) => c.trim());
    }
    if (line.includes(',')) {
      return line.split(',').map((c) => c.trim());
    }
    return line.split(/\s+/).map((c) => c.trim());
  });
}

export const GeneralCalculator: React.FC<GeneralCalculatorProps> = ({
  l1,
  setL1,
  l2,
  setL2,
  l3,
  setL3,
}) => {
  const [expression, setExpression] = useState('1-var_stats(L1)');
  const [outputHtml, setOutputHtml] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [tableCopied, setTableCopied] = useState<'space' | 'tsv' | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [rawPasteText, setRawPasteText] = useState('1 2\n3 4\n5 6');
  const [pasteTarget, setPasteTarget] = useState<'l1_l2' | 'l1' | 'l2' | 'l3'>('l1_l2');
  const [pasteReplace, setPasteReplace] = useState(true);
  const [pasteNotification, setPasteNotification] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);

  const getRawDataFromList = (list: string[]): number[] => {
    return list
      .map((item) => item.trim())
      .filter((item) => item !== '')
      .map((item) => evalstr(item))
      .filter((item) => !isNaN(item));
  };

  const getListByName = (name: string): number[] | undefined => {
    const clean = name.trim().toLowerCase();
    if (clean === 'l1') return getRawDataFromList(l1);
    if (clean === 'l2') return getRawDataFromList(l2);
    if (clean === 'l3') return getRawDataFromList(l3);
    return undefined;
  };

  const handleCalculate = (customExpr?: string) => {
    const exprToEval = customExpr !== undefined ? customExpr : expression;
    const expr = exprToEval.trim();

    if (expr.includes('1-var_stats')) {
      const inner = expr.replace('1-var_stats', '').replace(/[()]/g, '').trim();
      if (inner.includes(',')) {
        const [lA, lB] = inner.split(',').map((s) => s.trim());
        const xdata = getListByName(lA);
        const fdata = getListByName(lB);

        if (!xdata || !fdata || xdata.length === 0 || fdata.length === 0) {
          setOutputHtml(`<span class="text-amber-700 font-medium">Error: Make sure both lists (${lA}, ${lB}) exist and contain valid numbers.</span>`);
          return;
        }

        const n = stats.wn(xdata, fdata);
        const mean = stats.wmean(xdata, fdata);
        const s = stats.wstdev(xdata, fdata);
        const sigma = stats.wstdevp(xdata, fdata);
        const sum = stats.wsum(xdata, fdata);
        const sumofsqr = stats.wsumofsqr(xdata, fdata);
        const min = stats.wmin(xdata, fdata);
        const q1 = stats.wq1(xdata, fdata);
        const median = stats.wmedian(xdata, fdata);
        const q3 = stats.wq3(xdata, fdata);
        const max = stats.wmax(xdata, fdata);

        setOutputHtml(`
          <div class="space-y-1">
            <div class="text-xs font-semibold text-sky-700 tracking-wide mb-2">Weighted 1-Variable Statistics (${lA} = Data, ${lB} = Freq)</div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:text-base font-mono text-slate-800">
              <div><i>n</i> = ${round(n, PRECISION)}</div>
              <div><i>x̄</i> = ${round(mean, PRECISION)}</div>
              <div><i>s</i> = ${round(s, PRECISION)}</div>
              <div><i>σ</i> = ${round(sigma, PRECISION)}</div>
              <div>Σ<i>x</i> = ${round(sum, PRECISION)}</div>
              <div>Σ<i>x²</i> = ${round(sumofsqr, PRECISION)}</div>
              <div>Min = ${round(min, PRECISION)}</div>
              <div><i>Q₁</i> = ${round(q1, PRECISION)}</div>
              <div>Median = ${round(median, PRECISION)}</div>
              <div><i>Q₃</i> = ${round(q3, PRECISION)}</div>
              <div class="col-span-2">Max = ${round(max, PRECISION)}</div>
            </div>
          </div>
        `);
      } else {
        const xdata = getListByName(inner);
        if (!xdata || xdata.length === 0) {
          setOutputHtml(`<span class="text-amber-700 font-medium">Error: List '${inner}' is empty or does not exist. Enter numbers into ${inner.toUpperCase()} table below.</span>`);
          return;
        }

        const n = xdata.length;
        const mean = stats.mean(xdata);
        const s = stats.stdev(xdata);
        const sigma = stats.stdevp(xdata);
        const sum = stats.sum(xdata);
        const sumofsqr = stats.sumofsqr(xdata);
        const min = stats.min(xdata);
        const q1 = stats.q1(xdata);
        const median = stats.median(xdata);
        const q3 = stats.q3(xdata);
        const max = stats.max(xdata);

        setOutputHtml(`
          <div class="space-y-1">
            <div class="text-xs font-semibold text-emerald-700 tracking-wide mb-2">1-Variable Statistics (${inner.toUpperCase()})</div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:text-base font-mono text-slate-800">
              <div><i>n</i> = ${round(n, PRECISION)}</div>
              <div><i>x̄</i> = ${round(mean, PRECISION)}</div>
              <div><i>s</i> = ${round(s, PRECISION)}</div>
              <div><i>σ</i> = ${round(sigma, PRECISION)}</div>
              <div>Σ<i>x</i> = ${round(sum, PRECISION)}</div>
              <div>Σ<i>x²</i> = ${round(sumofsqr, PRECISION)}</div>
              <div>Min = ${round(min, PRECISION)}</div>
              <div><i>Q₁</i> = ${round(q1, PRECISION)}</div>
              <div>Median = ${round(median, PRECISION)}</div>
              <div><i>Q₃</i> = ${round(q3, PRECISION)}</div>
              <div class="col-span-2">Max = ${round(max, PRECISION)}</div>
            </div>
          </div>
        `);
      }
    } else if (expr.includes('lin_reg')) {
      const inner = expr.replace('lin_reg', '').replace(/[()]/g, '').trim();
      const parts = inner.split(',').map((s) => s.trim());
      if (parts.length < 2) {
        setOutputHtml(`<span class="text-amber-700 font-medium">Usage: lin_reg(L1, L2)</span>`);
        return;
      }
      const xdata = getListByName(parts[0]);
      const ydata = getListByName(parts[1]);

      if (!xdata || !ydata || xdata.length < 2 || ydata.length < 2) {
        setOutputHtml(`<span class="text-amber-700 font-medium">Error: Linear regression requires at least 2 data pairs in ${parts[0]} and ${parts[1]}.</span>`);
        return;
      }

      const minLen = Math.min(xdata.length, ydata.length);
      const x = xdata.slice(0, minLen);
      const y = ydata.slice(0, minLen);

      const r = stats.correlation(x, y);
      const rsqr = r * r;
      const [m, b] = stats.linreg(x, y);
      const n = minLen;
      const df = n - 2;
      const t = df > 0 && 1 - rsqr > 0 ? r * Math.sqrt(df / (1 - rsqr)) : NaN;
      const p = !isNaN(t) ? 2 * (1 - jStat.studentt.cdf(Math.abs(t), df)) : NaN;

      setOutputHtml(`
        <div class="space-y-2">
          <div class="text-xs font-semibold text-purple-700 tracking-wide">Linear Regression (y = ax + b)</div>
          <div class="font-mono text-base sm:text-lg text-emerald-700 font-semibold">
            <i>y</i> = ${round(m, PRECISION)}<i>x</i> ${b >= 0 ? '+' : '-'} ${round(Math.abs(b), PRECISION)}
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-sm sm:text-base text-slate-800">
            <div><i>a</i> (slope) = ${round(m, PRECISION)}</div>
            <div><i>b</i> (y-int) = ${round(b, PRECISION)}</div>
            <div><i>r²</i> = ${round(rsqr, PRECISION)}</div>
            <div><i>r</i> = ${round(r, PRECISION)}</div>
          </div>
          <div class="pt-2 border-t border-slate-200">
            <div class="text-xs font-semibold text-slate-500 tracking-wide mb-1">t-Test for ρ ≠ 0 (df = ${df})</div>
            <div class="grid grid-cols-2 gap-x-4 font-mono text-sm sm:text-base text-slate-800">
              <div><i>t</i> = ${isNaN(t) ? 'N/A' : round(t, PRECISION)}</div>
              <div><i>p-value</i> = ${isNaN(p) ? 'N/A' : round(p, PRECISION)}</div>
            </div>
          </div>
        </div>
      `);
    } else {
      const v = evalstr(expr);
      if (isNaN(v)) {
        setOutputHtml(`<span class="text-rose-600 font-medium">Syntax Error: Unable to evaluate '${expr}'</span>`);
      } else {
        setOutputHtml(`
          <div class="font-mono text-xl sm:text-2xl text-emerald-700 font-bold">
            = ${round(v, PRECISION)}
          </div>
        `);
      }
    }
  };

  const appendSymbol = (sym: string) => {
    setExpression((prev) => prev + sym);
  };

  const handleCopyOutput = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = outputHtml;
    const text = tempDiv.innerText || tempDiv.textContent || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRowChange = (
    listType: 'l1' | 'l2' | 'l3',
    idx: number,
    value: string
  ) => {
    const setter = listType === 'l1' ? setL1 : listType === 'l2' ? setL2 : setL3;
    setter((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const addRow = () => {
    setL1((prev) => [...prev, '']);
    setL2((prev) => [...prev, '']);
    setL3((prev) => [...prev, '']);
  };

  const removeRow = (idx: number) => {
    setL1((prev) => prev.filter((_, i) => i !== idx));
    setL2((prev) => prev.filter((_, i) => i !== idx));
    setL3((prev) => prev.filter((_, i) => i !== idx));
  };

  const applyParsedData = (
    rows: string[][],
    startCol: 'l1' | 'l2' | 'l3' = 'l1',
    startRow: number = 0,
    replace: boolean = false
  ) => {
    const colOrder: ('l1' | 'l2' | 'l3')[] = ['l1', 'l2', 'l3'];
    const startColIdx = colOrder.indexOf(startCol);

    const nextL1 = replace ? [] : [...l1];
    const nextL2 = replace ? [] : [...l2];
    const nextL3 = replace ? [] : [...l3];
    const targetLists = [nextL1, nextL2, nextL3];

    rows.forEach((rowTokens, rIdx) => {
      const targetRow = (replace ? 0 : startRow) + rIdx;
      rowTokens.forEach((token, cIdx) => {
        const targetColIdx = startColIdx + cIdx;
        if (targetColIdx < 3) {
          const list = targetLists[targetColIdx];
          while (list.length <= targetRow) {
            list.push('');
          }
          list[targetRow] = token;
        }
      });
    });

    const maxLen = Math.max(nextL1.length, nextL2.length, nextL3.length, 6);
    while (nextL1.length < maxLen) nextL1.push('');
    while (nextL2.length < maxLen) nextL2.push('');
    while (nextL3.length < maxLen) nextL3.push('');

    setL1(nextL1);
    setL2(nextL2);
    setL3(nextL3);

    setPasteNotification(`Imported ${rows.length} rows (${rows[0]?.length || 0} column(s))`);
    setTimeout(() => setPasteNotification(null), 3500);
  };

  const handleCellPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    col: 'l1' | 'l2' | 'l3',
    rowIdx: number
  ) => {
    const text = e.clipboardData.getData('text');
    const parsed = parseDelimitedData(text);
    if (parsed.length === 0) return;

    if (parsed.length > 1 || parsed[0].length > 1) {
      e.preventDefault();
      applyParsedData(parsed, col, rowIdx, false);
    }
  };

  const handleModalImport = () => {
    const parsed = parseDelimitedData(rawPasteText);
    if (parsed.length === 0) return;
    const startCol = pasteTarget === 'l1_l2' ? 'l1' : pasteTarget;
    applyParsedData(parsed, startCol, 0, pasteReplace);
    setShowPasteModal(false);
  };

  const handleCopyTableData = (format: 'space' | 'tsv' = 'space') => {
    const maxLen = Math.max(l1.length, l2.length, l3.length);
    const rows: string[] = [];
    const sep = format === 'space' ? ' ' : '\t';

    for (let i = 0; i < maxLen; i++) {
      const v1 = l1[i]?.trim() || '';
      const v2 = l2[i]?.trim() || '';
      const v3 = l3[i]?.trim() || '';
      if (v1 !== '' || v2 !== '' || v3 !== '') {
        if (v3 !== '') {
          rows.push([v1 || '0', v2 || '0', v3].join(sep));
        } else if (v2 !== '') {
          rows.push([v1 || '0', v2].join(sep));
        } else {
          rows.push(v1);
        }
      }
    }
    navigator.clipboard.writeText(rows.join('\n'));
    setTableCopied(format);
    setTimeout(() => setTableCopied(null), 2000);
  };

  const loadSampleData = (type: 'exam' | 'regression' | 'weighted') => {
    if (type === 'exam') {
      setL1(['78', '85', '92', '64', '88', '95', '71', '83', '90', '76']);
      setL2(['', '', '', '', '', '', '', '', '', '']);
      setL3(['', '', '', '', '', '', '', '', '', '']);
      setExpression('1-var_stats(L1)');
      handleCalculate('1-var_stats(L1)');
    } else if (type === 'weighted') {
      setL1(['10', '20', '30', '40', '50']);
      setL2(['2', '5', '12', '8', '3']);
      setL3(['', '', '', '', '']);
      setExpression('1-var_stats(L1, L2)');
      handleCalculate('1-var_stats(L1, L2)');
    } else if (type === 'regression') {
      setL1(['1', '2', '3', '4', '5', '6', '7', '8']);
      setL2(['2.1', '3.8', '5.2', '7.0', '8.9', '11.1', '13.2', '14.8']);
      setL3(['', '', '', '', '', '', '', '']);
      setExpression('lin_reg(L1, L2)');
      handleCalculate('lin_reg(L1, L2)');
    }
  };

  const maxRows = Math.max(l1.length, l2.length, l3.length, 6);

  return (
    <div className="space-y-6">
      {/* Top Expression & Calculation Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-slate-900">Statistics & Math Expression Evaluator</h2>
              <p className="text-xs text-slate-500">Evaluate 1-var stats, linear regression, combinatorics, or algebraic expressions</p>
            </div>
          </div>
          <button
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors p-2 hover:bg-slate-100 rounded-lg"
          >
            <Info className="w-4 h-4" />
            <span>About</span>
          </button>
        </div>

        {/* Expression Input */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCalculate();
              }}
              placeholder="e.g. 1-var_stats(L1), lin_reg(L1, L2), combinations(10, 3), (4*5)+sqrt(16)"
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 font-mono text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {expression && (
              <button
                onClick={() => setExpression('')}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-700 p-1"
                title="Clear input"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCalculate()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all active:scale-95 whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Calculate</span>
            </button>
            <button
              onClick={() => {
                setExpression('');
                setOutputHtml('');
              }}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-colors font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Function Keypad Quick Buttons */}
        <div className="flex flex-wrap gap-1.5 mb-5 text-xs font-mono">
          <button
            onClick={() => appendSymbol('1-var_stats(')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-emerald-700 border border-slate-200 rounded-md transition-colors"
          >
            1-var_stats(
          </button>
          <button
            onClick={() => appendSymbol('lin_reg(')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-purple-700 border border-slate-200 rounded-md transition-colors"
          >
            lin_reg(
          </button>
          <button
            onClick={() => appendSymbol('combinations(')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-sky-700 border border-slate-200 rounded-md transition-colors"
          >
            combinations(n, r)
          </button>
          <button
            onClick={() => appendSymbol('permutations(')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-sky-700 border border-slate-200 rounded-md transition-colors"
          >
            permutations(n, r)
          </button>
          <button
            onClick={() => appendSymbol('!')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-amber-700 border border-slate-200 rounded-md transition-colors"
          >
            n!
          </button>
          <button
            onClick={() => appendSymbol('sqrt(')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md transition-colors"
          >
            √x (sqrt)
          </button>
          <button
            onClick={() => appendSymbol('^')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md transition-colors"
          >
            x^y
          </button>
          <button
            onClick={() => appendSymbol('L1')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 border border-slate-200 rounded-md transition-colors font-bold"
          >
            L1
          </button>
          <button
            onClick={() => appendSymbol('L2')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 border border-slate-200 rounded-md transition-colors font-bold"
          >
            L2
          </button>
          <button
            onClick={() => appendSymbol('L3')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 border border-slate-200 rounded-md transition-colors font-bold"
          >
            L3
          </button>
          <button
            onClick={() => appendSymbol(', ')}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md transition-colors"
          >
            ,
          </button>
        </div>

        {/* Calculation Result Display */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[100px] relative flex flex-col justify-center">
          <div className="absolute top-2 right-2 flex gap-1">
            {outputHtml && (
              <button
                onClick={handleCopyOutput}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded transition-colors shadow-2xs"
                title="Copy result"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          {outputHtml ? (
            <div
              className="text-slate-900"
              dangerouslySetInnerHTML={{ __html: outputHtml }}
            />
          ) : (
            <div className="text-slate-400 italic text-sm text-center">
              Press Calculate or Enter to evaluate expression
            </div>
          )}
        </div>
      </div>

      {/* Data Lists Editor (L1, L2, L3) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900">Data Lists (L1, L2, L3)</h3>
              <p className="text-xs text-slate-500">Enter sample values for single-variable stats, frequencies, or regression analysis</p>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Preset:</span>
            <button
              onClick={() => loadSampleData('exam')}
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors"
            >
              Test Scores
            </button>
            <button
              onClick={() => loadSampleData('weighted')}
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors"
            >
              Weighted Freq
            </button>
            <button
              onClick={() => loadSampleData('regression')}
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors"
            >
              (X, Y) Pairs
            </button>
          </div>
        </div>

        {/* Copy & Paste Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPasteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium shadow-2xs transition-all active:scale-95"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste / Import Data</span>
            </button>

            <button
              onClick={() => handleCopyTableData('space')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-medium transition-all"
              title="Copy current data as space-separated text (e.g. 1 2\n3 4\n5 6)"
            >
              {tableCopied === 'space' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{tableCopied === 'space' ? 'Copied!' : 'Copy Table'}</span>
            </button>

            <button
              onClick={() => handleCopyTableData('tsv')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-mono transition-all"
              title="Copy for Excel / Sheets (Tab-separated)"
            >
              {tableCopied === 'tsv' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
              <span>{tableCopied === 'tsv' ? 'Copied TSV' : 'TSV'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {pasteNotification ? (
              <span className="text-xs font-medium text-emerald-700">{pasteNotification}</span>
            ) : (
              <span className="text-[11px] text-slate-500">
                Directly paste multi-column data (like <code className="text-indigo-700 bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">1 2</code>) into any cell
              </span>
            )}
          </div>
        </div>

        {/* Spreadsheet-like Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-80 overflow-y-auto bg-white">
          <table className="w-full text-left border-collapse font-mono text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-2.5 w-12 text-center text-xs text-slate-500 font-semibold border-r border-slate-200">#</th>
                <th className="p-2.5 text-indigo-700 font-semibold border-r border-slate-200">
                  <div className="flex items-center justify-between">
                    <span>L1 (X)</span>
                    <button
                      onClick={() => setL1([])}
                      className="text-[10px] font-normal text-slate-500 hover:text-rose-600"
                    >
                      Clear
                    </button>
                  </div>
                </th>
                <th className="p-2.5 text-indigo-700 font-semibold border-r border-slate-200">
                  <div className="flex items-center justify-between">
                    <span>L2 (Y / Freq)</span>
                    <button
                      onClick={() => setL2([])}
                      className="text-[10px] font-normal text-slate-500 hover:text-rose-600"
                    >
                      Clear
                    </button>
                  </div>
                </th>
                <th className="p-2.5 text-indigo-700 font-semibold border-r border-slate-200">
                  <div className="flex items-center justify-between">
                    <span>L3</span>
                    <button
                      onClick={() => setL3([])}
                      className="text-[10px] font-normal text-slate-500 hover:text-rose-600"
                    >
                      Clear
                    </button>
                  </div>
                </th>
                <th className="p-2.5 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {Array.from({ length: maxRows }).map((_, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-2 text-center text-xs text-slate-400 border-r border-slate-200 bg-slate-50/60">
                    {idx + 1}
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <input
                      type="text"
                      value={l1[idx] ?? ''}
                      onChange={(e) => handleRowChange('l1', idx, e.target.value)}
                      onPaste={(e) => handleCellPaste(e, 'l1', idx)}
                      placeholder="—"
                      className="w-full bg-transparent px-2 py-1 text-slate-900 placeholder:text-slate-300 focus:bg-indigo-50/50 focus:outline-none rounded"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <input
                      type="text"
                      value={l2[idx] ?? ''}
                      onChange={(e) => handleRowChange('l2', idx, e.target.value)}
                      onPaste={(e) => handleCellPaste(e, 'l2', idx)}
                      placeholder="—"
                      className="w-full bg-transparent px-2 py-1 text-slate-900 placeholder:text-slate-300 focus:bg-indigo-50/50 focus:outline-none rounded"
                    />
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <input
                      type="text"
                      value={l3[idx] ?? ''}
                      onChange={(e) => handleRowChange('l3', idx, e.target.value)}
                      onPaste={(e) => handleCellPaste(e, 'l3', idx)}
                      placeholder="—"
                      className="w-full bg-transparent px-2 py-1 text-slate-900 placeholder:text-slate-300 focus:bg-indigo-50/50 focus:outline-none rounded"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <button
                      onClick={() => removeRow(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Delete row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table footer controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-800 font-medium py-1.5 px-3 bg-indigo-50 border border-indigo-200 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>

          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => {
                setExpression('1-var_stats(L1)');
                handleCalculate('1-var_stats(L1)');
              }}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-100 font-medium transition-colors"
            >
              1-Var Stats (L1)
            </button>
            <button
              onClick={() => {
                setExpression('1-var_stats(L1, L2)');
                handleCalculate('1-var_stats(L1, L2)');
              }}
              className="px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md hover:bg-sky-100 font-medium transition-colors"
            >
              Weighted Stats (L1, L2)
            </button>
            <button
              onClick={() => {
                setExpression('lin_reg(L1, L2)');
                handleCalculate('lin_reg(L1, L2)');
              }}
              className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md hover:bg-purple-100 font-medium transition-colors"
            >
              LinReg (L1, L2)
            </button>
          </div>
        </div>
      </div>

      {/* Paste / Bulk Import Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
                  <ClipboardPaste className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-slate-900">Paste / Import Multi-Column Data</h3>
                  <p className="text-xs text-slate-500">Supports space, tab, or comma delimited row formats</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Paste data below:</span>
              <button
                onClick={() => setRawPasteText('1 2\n3 4\n5 6')}
                className="text-indigo-600 hover:text-indigo-700 underline font-mono text-[11px]"
              >
                Load &quot;1 2 / 3 4 / 5 6&quot; Sample
              </button>
            </div>

            <textarea
              rows={6}
              value={rawPasteText}
              onChange={(e) => setRawPasteText(e.target.value)}
              placeholder={'1 2\n3 4\n5 6\n\nOr paste from Excel / Google Sheets'}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {rawPasteText.trim() && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span>
                    Detected: {parseDelimitedData(rawPasteText).length} rows, {parseDelimitedData(rawPasteText)[0]?.length || 0} column(s)
                  </span>
                </div>
                <div className="max-h-24 overflow-y-auto font-mono text-slate-600 space-y-1">
                  {parseDelimitedData(rawPasteText).slice(0, 5).map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-slate-400">Row {i + 1}:</span>
                      {r.map((col, ci) => (
                        <span key={ci} className="bg-white text-indigo-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {col}
                        </span>
                      ))}
                    </div>
                  ))}
                  {parseDelimitedData(rawPasteText).length > 5 && (
                    <div className="text-[11px] text-slate-500 italic">
                      ... and {parseDelimitedData(rawPasteText).length - 5} more rows
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Target Columns:</label>
                <select
                  value={pasteTarget}
                  onChange={(e) => setPasteTarget(e.target.value as 'l1_l2' | 'l1' | 'l2' | 'l3')}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="l1_l2">Auto (Col 1 → L1, Col 2 → L2, Col 3 → L3)</option>
                  <option value="l1">Start at L1</option>
                  <option value="l2">Start at L2</option>
                  <option value="l3">Start at L3</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Mode:</label>
                <div className="flex gap-3 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      checked={pasteReplace}
                      onChange={() => setPasteReplace(true)}
                      className="text-indigo-600"
                    />
                    <span>Replace Data</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      checked={!pasteReplace}
                      onChange={() => setPasteReplace(false)}
                      className="text-indigo-600"
                    />
                    <span>Append to end</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModalImport}
                disabled={!rawPasteText.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg shadow-sm transition-all"
              >
                Import into Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-semibold text-lg text-slate-900">About Statistics Calculator</h3>
              <button
                onClick={() => setShowAbout(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                <strong className="text-slate-900">Statistics Calculator</strong><br />
                Created by David Flenner (copyright 2020), redistributed and enhanced for modern web environments under GNU GPL v3.
              </p>
              <p>
                Core statistical computations and curve visualizers powered by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 font-mono text-xs">
                <li>JSXGraph (Uni Bayreuth)</li>
                <li>math.js</li>
                <li>jStat Statistics Engine</li>
              </ul>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowAbout(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
