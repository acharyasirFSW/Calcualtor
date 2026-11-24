import React, { useState } from 'react';
import {
  Calculator,
  Bell,
  BarChart2,
  Dices,
  Activity,
  GitCommit,
  BookOpen,
} from 'lucide-react';
import { GeneralCalculator } from './components/GeneralCalculator';
import { NormalDistribution } from './components/NormalDistribution';
import { TDistribution } from './components/TDistribution';
import { BinomialDistribution } from './components/BinomialDistribution';
import { ChiSquareDistribution } from './components/ChiSquareDistribution';
import { FDistribution } from './components/FDistribution';

type ActiveTab = 'calc' | 'normal' | 't' | 'binom' | 'chi2' | 'f';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calc');

  // Shared List Data for Calculator & Regression
  const [l1, setL1] = useState<string[]>([
    '78', '85', '92', '64', '88', '95', '71', '83', '90', '76'
  ]);
  const [l2, setL2] = useState<string[]>([
    '2.5', '3.1', '4.0', '1.8', '3.4', '4.2', '2.3', '3.0', '3.8', '2.7'
  ]);
  const [l3, setL3] = useState<string[]>([
    '', '', '', '', '', '', '', '', '', ''
  ]);

  const tabs = [
    {
      id: 'calc' as ActiveTab,
      label: 'Calculator & Lists',
      badge: '1-Var & LinReg',
      icon: Calculator,
      color: 'text-indigo-600',
      activeBg: 'bg-indigo-600',
    },
    {
      id: 'normal' as ActiveTab,
      label: 'Normal Dist',
      badge: 'N(μ, σ)',
      icon: Bell,
      color: 'text-sky-600',
      activeBg: 'bg-sky-600',
    },
    {
      id: 't' as ActiveTab,
      label: 'Student\'s t',
      badge: 't(df)',
      icon: BarChart2,
      color: 'text-purple-600',
      activeBg: 'bg-purple-600',
    },
    {
      id: 'binom' as ActiveTab,
      label: 'Binomial',
      badge: 'B(n, p)',
      icon: Dices,
      color: 'text-blue-600',
      activeBg: 'bg-blue-600',
    },
    {
      id: 'chi2' as ActiveTab,
      label: 'Chi-Square',
      badge: 'χ²(df)',
      icon: Activity,
      color: 'text-amber-600',
      activeBg: 'bg-amber-600',
    },
    {
      id: 'f' as ActiveTab,
      label: 'F-Distribution',
      badge: 'F(df₁, df₂)',
      icon: GitCommit,
      color: 'text-cyan-600',
      activeBg: 'bg-cyan-600',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-sm text-white">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Statistics Calculator
              </h1>
              <p className="text-xs text-slate-500">
                Interactive distribution curves, 1-variable statistics, and linear regression
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>TI-84 Compatible Syntax</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 mt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? `${tab.activeBg} text-white shadow-sm`
                      : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full bg-white">
        {activeTab === 'calc' && (
          <GeneralCalculator
            l1={l1}
            setL1={setL1}
            l2={l2}
            setL2={setL2}
            l3={l3}
            setL3={setL3}
          />
        )}
        {activeTab === 'normal' && <NormalDistribution />}
        {activeTab === 't' && <TDistribution />}
        {activeTab === 'binom' && <BinomialDistribution />}
        {activeTab === 'chi2' && <ChiSquareDistribution />}
        {activeTab === 'f' && <FDistribution />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Statistics Calculator · Based on original software by David Flenner (2020)
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            Powered by jStat · math.js · GNU GPL v3
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
