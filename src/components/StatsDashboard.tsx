/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTestStore } from '../store/useTestStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { 
  Play, 
  RotateCcw, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Timer, 
  TrendingUp, 
  Activity, 
  Trash2,
  Heart
} from 'lucide-react';

export default function StatsDashboard() {
  const { 
    logs, 
    clearLogs, 
    steps, 
    isPlaying, 
    setIsPlaying, 
    setCurrentPlayingStepIndex, 
    addLog,
    savedFlows
  } = useTestStore();

  // Handle visual play-simulation click
  const triggerSimulation = () => {
    if (steps.length === 0) {
      addLog('Cannot simulate empty test timeline. Add steps first.', 'warning');
      return;
    }

    addLog('Booting headless Chromium virtual environment...', 'info');
    setIsPlaying(true);
    setCurrentPlayingStepIndex(0);
  };

  const stopSimulation = () => {
    setIsPlaying(false);
    setCurrentPlayingStepIndex(-1);
    addLog('Test simulation playback aborted by debugger.', 'warning');
  };

  // Mock-stats history for Manny's dashboard graphs
  const auditHistory = [
    { date: 'Jun 12', passed: 18, failed: 2, duration: 420 },
    { date: 'Jun 13', passed: 24, failed: 1, duration: 380 },
    { date: 'Jun 14', passed: 28, failed: 0, duration: 310 },
    { date: 'Jun 15', passed: 32, failed: 3, duration: 390 },
    { date: 'Jun 16', passed: 41, failed: 1, duration: 270 },
    { date: 'Jun 17', passed: 48, failed: 0, duration: 250 },
  ];

  const totalBuildsSum = auditHistory.reduce((sum, item) => sum + item.passed + item.failed, 0);
  const successPillRate = Math.round((auditHistory.reduce((sum, item) => sum + item.passed, 0) / totalBuildsSum) * 100);

  return (
    <div id="diagnostics-suite" className="p-5 overflow-y-auto h-full space-y-6 text-slate-300 bg-sophisticated-pane">
      
      {/* Simulation Playback Controller cards */}
      <div id="player-banner" className="bg-sophisticated-card border border-slate-700/80 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 focus:outline-none">
            <Activity className="h-4 w-4 text-blue-400 animate-pulse" />
            Active Simulator Console
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Simulate and verify generated selector routines in-browser</p>
        </div>

        <div className="flex items-center gap-2.5">
          {isPlaying ? (
            <button
              onClick={stopSimulation}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer text-xs py-2 px-4 rounded flex items-center gap-1.5 shadow-lg shadow-rose-900/10 transition"
            >
              <RotateCcw className="h-4 w-4 animate-spin" />
              Abort Simulation
            </button>
          ) : (
            <button
              onClick={triggerSimulation}
              disabled={steps.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold cursor-pointer text-xs py-2 px-5 rounded flex items-center gap-1.5 shadow-lg transition"
            >
              <Play className="h-4 w-4" />
              Simulate Test Run
            </button>
          )}

          <button
            onClick={() => {
              clearLogs();
              addLog('Console trace traces cleared.', 'info');
            }}
            className="text-xs border border-slate-750 hover:bg-slate-800 text-slate-450 hover:text-white py-2 px-3 rounded transition cursor-pointer"
          >
            Clear Traces
          </button>
        </div>
      </div>

      {/* METRIC SUMMARIES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-sophisticated-card border border-slate-700/80 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-blue-400 shrink-0" />
          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Sync Integrity</span>
            <span className="text-xl font-bold text-slate-200">99.8%</span>
          </div>
        </div>

        <div className="p-4 bg-sophisticated-card border border-slate-700/80 rounded-lg flex items-center gap-3">
          <Timer className="h-8 w-8 text-amber-500 shrink-0" />
          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Avg Response Time</span>
            <span className="text-xl font-bold text-slate-200">255 ms</span>
          </div>
        </div>

        <div className="p-4 bg-sophisticated-card border border-slate-700/80 rounded-lg flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-sky-400 shrink-0" />
          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Test Suite Runs</span>
            <span className="text-xl font-bold text-slate-200">{totalBuildsSum} Runs</span>
          </div>
        </div>

        <div className="p-4 bg-sophisticated-card border border-slate-700/80 rounded-lg flex items-center gap-3">
          <Heart className="h-8 w-8 text-purple-400 shrink-0" />
          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Saved Test Cases</span>
            <span className="text-xl font-bold text-slate-200">{savedFlows.length} Suites</span>
          </div>
        </div>
      </div>

      {/* DIAGNOSTIC CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Run history chart */}
        <div className="bg-sophisticated-card border border-slate-700/80 p-4 rounded-lg flex flex-col justify-between min-h-[260px]">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-0.5">Test suite success status</h3>
            <p className="text-[10px] text-slate-500">Historical performance of executed steps compilation</p>
          </div>
          <div className="h-44 w-full mt-4 text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={auditHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                <YAxis stroke="#475569" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#334155', color: '#fff', borderRadius: '4px' }} />
                <Bar dataKey="passed" name="Passed" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="failed" name="Failed" fill="#f43f5e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Duration speed chart */}
        <div className="bg-sophisticated-card border border-slate-700/80 p-4 rounded-lg flex flex-col justify-between min-h-[260px]">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-0.5">Average Execution Speeds</h3>
            <p className="text-[10px] text-slate-500 font-sans">Sequence latency speed metrics (lower is better)</p>
          </div>
          <div className="h-44 w-full mt-4 text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={auditHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                <YAxis stroke="#475569" fontSize={9} unit="ms" />
                <Tooltip contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#334155', color: '#fff', borderRadius: '4px' }} />
                <Area type="monotone" dataKey="duration" name="Duration Speed" stroke="#d97706" fillOpacity={1} fill="url(#colorSpeed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* DETAILED CHRONOLOGICAL TRACE CONSOLE */}
      <div className="bg-[#0B0E14] border border-slate-800 rounded-lg overflow-hidden shadow-xl">
        <div className="p-3 px-4 bg-sophisticated-header border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-300 uppercase tracking-widest">
            <Terminal className="h-4 w-4 text-blue-400" />
            <span>Trace logging trace</span>
          </div>
          <span className="text-[9px] font-mono text-slate-500">Auto-refresh ready</span>
        </div>
        
        <div 
          className="p-4 h-48 overflow-y-auto font-mono text-[10.5px] leading-relaxed space-y-1 bg-[#05070a]/90"
          style={{ contentVisibility: 'auto' }}
        >
          {logs.map((log) => {
            const statusColors = {
              info: 'text-sky-400',
              success: 'text-blue-400 font-bold',
              warning: 'text-yellow-400',
              error: 'text-rose-500 font-bold'
            };

            return (
              <div key={log.id} className="flex gap-2.5 hover:bg-[#1C212B]/40 rounded transition px-1 py-0.5">
                <span className="text-slate-600 select-none shrink-0 border-r border-slate-800 pr-2">[{log.time}]</span>
                <span className={`${statusColors[log.status]} shrink-0 uppercase font-bold text-[9px]`}>
                  {log.status.padEnd(7)}
                </span>
                <span className="text-slate-400 break-all">{log.message}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
