/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import SavedFlowsList from './components/SavedFlowsList';
import VisualBuilder from './components/VisualBuilder';
import MiniBrowserSandbox from './components/MiniBrowserSandbox';
import CodeViewer from './components/CodeViewer';
import StatsDashboard from './components/StatsDashboard';
import LocatorRankingPanel from './components/LocatorRankingPanel';
import { useTestStore } from './store/useTestStore';
import { 
  MonitorPlay, 
  Terminal, 
  Code2, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  Layers,
  Heart,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function App() {
  const { addLog, steps } = useTestStore();
  const [activeTab, setActiveTab] = useState<'record' | 'transpile' | 'analytics'>('record');
  const [apiHealth, setApiHealth] = useState<{ status: string; apiConfigured: boolean } | null>(null);

  // Poll server health on load to check if GEMINI_API_KEY is available (with cache-busting to bypass browser-cached boot errors)
  const checkHealth = () => {
    setApiHealth(null);
    const isNetlify = typeof window !== 'undefined' && (
      window.location.hostname.includes('netlify.app') || 
      window.location.hostname.includes('github.io') ||
      window.location.hostname.includes('vercel.app')
    );

    if (isNetlify) {
      setTimeout(() => {
        setApiHealth({ status: 'static_decap', apiConfigured: false });
        addLog('Detected static cloud host (Netlify/Vercel). Loaded premium standalone client engine.', 'success');
      }, 300);
      return;
    }

    fetch(`/api/health?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Response not OK');
        }
        return res.json();
      })
      .then((data) => {
        setApiHealth(data);
        if (data.apiConfigured) {
          addLog('Connected to TestFlow AI copilot server. Gemini engine ARMED.', 'success');
        } else {
          addLog('Server ready. Gemini API key empty (Offline Mock Generation system active).', 'warning');
        }
      })
      .catch((err) => {
        console.warn('Network alert checking health:', err);
        addLog('Server connection offline. Running in pure static sandbox mode.', 'error');
        setApiHealth({ status: 'offline', apiConfigured: false });
      });
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div id="app-root-container" className="flex h-screen w-screen overflow-hidden bg-sophisticated-bg font-sans text-slate-300 antialiased">
      
      {/* 1. LEFT CONTAINER: SCENARIO ARCHIVE MENU (SIDEBAR) */}
      <SavedFlowsList />

      {/* 2. CHIEF CONTENT DESK (WORKBENCH GRID) */}
      <div className="flex-1 flex flex-col min-w-0 bg-sophisticated-bg">
        
        {/* Top Control Header bar */}
        <header className="h-14 bg-sophisticated-bg border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">
              T
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h1 className="text-sm font-semibold tracking-tight text-white font-serif italic">
                  TestflowAI <span className="font-sans not-italic text-xs text-slate-300 font-normal">Workbench</span>
                </h1>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-sans ml-2">
                  v1.2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Manual Testing Transformation Suite ({steps.length} Steps Armed)</p>
            </div>
          </div>

          {/* Workbench Section Toggles */}
          <div className="flex bg-[#0B0E14] border border-slate-800 p-0.5 rounded-lg">
            <button
              onClick={() => {
                setActiveTab('record');
                addLog('Active viewport switched to Interactive Recorder Simulator.', 'info');
              }}
              className={`flex items-center gap-1.5 text-[11px] px-3.5 py-1.5 rounded transition font-medium ${
                activeTab === 'record'
                  ? 'bg-slate-800 border border-slate-700 text-white font-semibold'
                  : 'text-slate-550 hover:text-slate-300'
              }`}
            >
              <MonitorPlay className="h-3.5 w-3.5" />
              Simulated Recorder
            </button>

            <button
              onClick={() => {
                setActiveTab('transpile');
                addLog('Active viewport switched to Real-Time Code Transpiler.', 'info');
              }}
              className={`flex items-center gap-1.5 text-[11px] px-3.5 py-1.5 rounded transition font-medium ${
                activeTab === 'transpile'
                  ? 'bg-slate-800 border border-slate-700 text-white font-semibold'
                  : 'text-slate-550 hover:text-slate-300'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              Code Transpiler
            </button>

            <button
              onClick={() => {
                setActiveTab('analytics');
                addLog('Active viewport switched to Diagnostic Logs dashboard.', 'info');
              }}
              className={`flex items-center gap-1.5 text-[11px] px-3.5 py-1.5 rounded transition font-medium ${
                activeTab === 'analytics'
                  ? 'bg-slate-800 border border-slate-700 text-white font-semibold'
                  : 'text-slate-550 hover:text-slate-300'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Sim Logs & Charts
            </button>
          </div>

          {/* Secrets Config Status Check indicator */}
          <div className="flex items-center gap-4 text-xs font-mono">
            {apiHealth ? (
              apiHealth.status === 'static_decap' || apiHealth.status === 'offline' ? (
                <div className="flex items-center gap-2">
                  <div 
                    className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full cursor-help hover:bg-blue-500/15 transition-all" 
                    title="Standalone Sandbox Active (Static cloud deploy detected). Steps, flows, and simulation configs save automatically in your browser's LocalStorage."
                  >
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Standalone Client Active</span>
                  </div>
                  {apiHealth.status === 'offline' && (
                    <button
                      onClick={checkHealth}
                      className="text-[9px] font-mono text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 px-2 py-0.5 rounded transition cursor-pointer"
                      title="Retry connecting to Node.js backend"
                    >
                      Retry sync
                    </button>
                  )}
                </div>
              ) : apiHealth.apiConfigured ? (
                <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full" title="Gemini AI active server-side">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Local Sync Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full" title="Key missing. Using offline mocks.">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider font-semibold">Offline Mocks</span>
                </div>
              )
            ) : (
              <span className="text-slate-500 text-[10px] animate-pulse">Establishing connection...</span>
            )}
          </div>
        </header>

        {/* 3. CORE PANEL GRID LAYOUT based on active workspace option */}
        <div className="flex-1 flex h-full overflow-hidden">
          
          {/* ALWAYS DISPLAY VISUAL TIMELINE ON THE LEFT (Except on Analytics tab where we want space) */}
          {activeTab !== 'analytics' && (
            <div className="w-1/2 min-w-[340px] max-w-[500px] border-r border-slate-800 bg-sophisticated-pane shrink-0 h-full flex flex-col">
              <VisualBuilder />
            </div>
          )}

          {/* RIGHT-HAND SIDE LAYOUT DYNAMIC SHIFTING */}
          <div className="flex-1 h-full overflow-hidden flex flex-col bg-sophisticated-bg">
            {activeTab === 'record' && (
              <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6" style={{ contentVisibility: 'auto' }}>
                {/* Simulated Mini-Browser Sandbox Pane */}
                <div className="flex-1 min-h-0">
                  <MiniBrowserSandbox />
                </div>
                
                {/* Smart Locator priority panel nested gracefully below */}
                <div className="shrink-0">
                  <LocatorRankingPanel />
                </div>
              </div>
            )}

            {activeTab === 'transpile' && (
              <div className="flex-1 overflow-hidden" style={{ contentVisibility: 'auto' }}>
                <CodeViewer />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="flex-1 overflow-hidden" style={{ contentVisibility: 'auto' }}>
                <StatsDashboard />
              </div>
            )}
          </div>

        </div>

        {/* Bottom footer system stats */}
        <footer className="h-8 bg-sophisticated-header border-t border-slate-800 flex items-center justify-between px-4 text-[10px] text-slate-500 font-mono select-none shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Electron Process: <span className="text-emerald-500 font-semibold text-[10px]">Running</span></span>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Storage: <span className="text-slate-300 font-semibold text-[10px]">Local Drive /Tests</span></span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
            <span>UTF-8</span>
            <span>TypeScript</span>
            <span className="text-blue-400 font-bold font-semibold">Connected to Sandbox</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
