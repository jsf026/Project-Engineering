/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTestStore } from '../store/useTestStore';
import { SelectorType } from '../types';
import { ChevronUp, ChevronDown, ShieldCheck, HelpCircle } from 'lucide-react';

export default function LocatorRankingPanel() {
  const { locatorRanking, setLocatorRanking, addLog } = useTestStore();

  const moveRanking = (index: number, direction: 'up' | 'down') => {
    const newRanking = [...locatorRanking];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= locatorRanking.length) return;

    // Swap elements
    const temp = newRanking[index];
    newRanking[index] = newRanking[targetIndex];
    newRanking[targetIndex] = temp;

    setLocatorRanking(newRanking);
    addLog(`Adjusted Smart Locator priorities to: ${newRanking.join(' > ')}`, 'info');
  };

  const labels: Record<SelectorType, { name: string; desc: string; color: string }> = {
    testId: { name: 'attribute: data-testid', desc: 'Pre-defined QA automation tag (most resilient to structural changes)', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    id: { name: 'attribute: #id', desc: 'Standard unique document node identity tag', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    name: { name: 'attribute: [name]', desc: 'HTML input form reference fields', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    label: { name: 'attribute: aria-label', desc: 'Accessibility description guidelines', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    className: { name: 'selector: .class-name', desc: 'Layout selectors (fragile if styles/classes change)', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
    text: { name: 'selector: :has-text()', desc: 'Inner textual string matching (fragile, translation breaking)', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  };

  return (
    <div id="locator-prioritizer" className="bg-sophisticated-card border border-slate-700 rounded-lg p-4 text-slate-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 focus:outline-none">
          <ShieldCheck className="h-4 w-4 text-blue-400 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Smart Locator Priorities</h3>
        </div>
        <div className="group relative">
          <HelpCircle className="h-3.5 w-3.5 text-slate-500 hover:text-slate-450 cursor-help" />
          <div className="absolute right-0 top-5 hidden group-hover:block bg-[#0B0E14] border border-slate-800 p-2.5 rounded w-64 text-[10px] text-slate-400 leading-normal z-50 shadow-xl">
            Auto-selects active script expressions by querying attributes from top-to-bottom. Move data-testid or #id to the top to secure your codebase from frontend design modifications!
          </div>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 mb-3.5 leading-relaxed">
        Prioritize locator algorithms. Adjust ordering to control the rank scoring of generated script targets:
      </p>

      {/* Ranks list */}
      <div className="space-y-1.5">
        {locatorRanking.map((key, index) => {
          const detail = labels[key];
          return (
            <div 
              key={key} 
              className={`flex items-center justify-between p-2 rounded border bg-[#0B0E14] border-slate-800/80 ${detail.color} transition-all`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-600 font-bold w-4">#{index + 1}</span>
                <div>
                  <div className="text-[11px] font-bold font-mono">{detail.name}</div>
                  <div className="text-[9px] text-slate-550 mt-0.5 max-w-[280px] line-clamp-1">{detail.desc}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={index === 0}
                  onClick={() => moveRanking(index, 'up')}
                  className="p-1 rounded bg-[#1C212B] hover:bg-slate-800 text-slate-450 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Move priority up"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  disabled={index === locatorRanking.length - 1}
                  onClick={() => moveRanking(index, 'down')}
                  className="p-1 rounded bg-[#1C212B] hover:bg-slate-800 text-slate-450 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Move priority down"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
