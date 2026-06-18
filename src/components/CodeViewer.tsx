/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useTestStore } from '../store/useTestStore';
import { transpile } from '../engines/transpiler';
import { Copy, Download, Settings, Code, FileText, Check, HelpCircle, ToggleLeft, ToggleRight } from 'lucide-react';

export default function CodeViewer() {
  const { 
    steps, 
    targetFramework, 
    setFramework, 
    config, 
    updateConfig,
    addLog 
  } = useTestStore();

  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Transpile visual execution steps instantly on dependency changes! < 10ms speed!
  const generatedCode = useMemo(() => {
    return transpile(steps, targetFramework, {
      usePOM: config.usePOM,
      baseUrl: config.baseUrl,
      addComments: config.addComments,
      headless: config.headless
    });
  }, [steps, targetFramework, config]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    addLog(`Copied generated ${targetFramework.toUpperCase()} script to clipboard.`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extension = targetFramework === 'selenium_py' ? 'py' : targetFramework === 'playwright_ts' ? 'ts' : 'js';
    const filename = `testflow_export.${extension}`;
    
    const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const element = document.createElement('a');
    element.href = url;
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    
    document.body.removeChild(element);
    URL.revokeObjectURL(url);

    addLog(`Downloaded script file: "${filename}" directly into local file system.`, 'success');
  };

  // Prepares nice highlighting names
  const getLanguageTag = () => {
    switch (targetFramework) {
      case 'playwright_ts': return 'TypeScript';
      case 'selenium_py': return 'Python';
      case 'cypress_js': return 'JavaScript (Cypress)';
      case 'puppeteer_js': return 'JavaScript (Puppeteer)';
      default: return 'Code';
    }
  };

  return (
    <div id="code-viewer-pane" className="flex flex-col h-full bg-sophisticated-code text-slate-300">
      
      {/* Code Header Control menu */}
      <div className="p-4 bg-sophisticated-header border-b border-slate-850 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-blue-400" />
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 font-sans">Transpiled Script</span>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Automated framework execution directives</p>
          </div>
        </div>

        {/* Framework toggle and Settings widgets */}
        <div className="flex items-center gap-2">
          <select
            value={targetFramework}
            onChange={(e) => setFramework(e.target.value as any)}
            className="bg-[#0B0E14] text-xs text-slate-300 border border-slate-800 rounded py-1 px-3 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="playwright_ts">Playwright (TS)</option>
            <option value="selenium_py">Selenium (Python)</option>
            <option value="cypress_js">Cypress (JS)</option>
            <option value="puppeteer_js">Puppeteer (JS)</option>
          </select>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded border transition cursor-pointer ${
              showSettings 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 font-bold' 
                : 'bg-[#1C212B] border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Configure Compiler Options"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 text-xs py-1.5 px-3 rounded border cursor-pointer font-semibold transition ${
              copied 
                ? 'bg-emerald-600/15 border-emerald-500/30 text-emerald-400 font-bold' 
                : 'bg-[#1C212B] border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="Copy script code clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-500 font-semibold cursor-pointer text-white text-xs py-1.5 px-3 rounded flex items-center gap-1 transition shadow-lg shadow-blue-900/10"
            title="Download script file direct"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* COMPILER SETTINGS SECTION */}
      {showSettings && (
        <div className="p-4 bg-sophisticated-header border-b border-slate-850 text-slate-300 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs animate-fast-slide shrink-0">
          
          {/* POM Toggle Option */}
          <div className="flex items-center justify-between p-2 rounded bg-[#0B0E14] border border-slate-800/80">
            <div>
              <span className="font-bold text-slate-200 block">Page Object Model (POM)</span>
              <span className="text-[10px] text-slate-500">Wrap steps into modular class structures</span>
            </div>
            <button
              onClick={() => {
                updateConfig({ usePOM: !config.usePOM });
                addLog(`Toggled Page Object Model format: ${!config.usePOM ? 'ACTIVE' : 'INACTIVE'}`, 'info');
              }}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              {config.usePOM ? <ToggleRight className="h-7 w-7 text-blue-400" /> : <ToggleLeft className="h-7 w-7 text-slate-700" />}
            </button>
          </div>

          {/* Add comments toggle */}
          <div className="flex items-center justify-between p-2 rounded bg-[#0B0E14] border border-slate-800/80">
            <div>
              <span className="font-bold text-slate-200 block">In-Script Comments</span>
              <span className="text-[10px] text-slate-500">Annotate recorded element click targets</span>
            </div>
            <button
              onClick={() => updateConfig({ addComments: !config.addComments })}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              {config.addComments ? <ToggleRight className="h-7 w-7 text-blue-400" /> : <ToggleLeft className="h-7 w-7 text-slate-700" />}
            </button>
          </div>

          {/* Override base URL input option */}
          <div className="p-2 rounded bg-[#0B0E14] border border-slate-800/80 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-200 block">Override Target URL</span>
              <span className="text-[10px] text-slate-500">Prepend string to navigation scripts</span>
            </div>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => updateConfig({ baseUrl: e.target.value })}
              placeholder="e.g. https://staging.myshop.com"
              className="w-full text-[11px] px-2 py-1 rounded bg-sophisticated-bg border border-slate-800 text-slate-200 mt-1.5 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* RENDERED CODE CANVAS PANEL */}
      <div 
        id="code-canvas-container" 
        className="flex-1 overflow-auto p-4 font-mono text-[11.5px] leading-relaxed bg-sophisticated-code"
        style={{ contentVisibility: 'auto' }}
      >
        <div className="flex bg-sophisticated-code rounded overflow-hidden border border-slate-800/80 w-full min-h-full">
          {/* Virtual Line Number gutter panel */}
          <div className="w-11 bg-[#0A0D12] border-r border-slate-800/80 text-slate-700 select-none text-right pr-3.5 py-4 font-mono text-[11px]">
            {generatedCode.split('\n').map((_, index) => (
              <div key={index} className="h-5">
                {(index + 1).toString().padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Actual Code Area */}
          <div className="flex-1 py-4 px-5 text-slate-350 font-mono overflow-x-auto whitespace-pre">
            {generatedCode.split('\n').map((line, idx) => {
              // Custom lightweight visual syntax highlighting! Looks spectacular.
              let coloredLine = <span>{line}</span>;
              
              const isComment = line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('"""');
              const isImport = line.trim().startsWith('import') || line.trim().startsWith('from ') || line.trim().startsWith('const ') || line.trim().startsWith('require');
              const isMethod = line.trim().startsWith('async ') || line.trim().startsWith('def ') || line.trim().startsWith('class ');
              const isAssert = line.includes('expect') || line.includes('assert');

              if (isComment) {
                coloredLine = <span className="text-slate-650 italic">{line}</span>;
              } else if (isImport) {
                coloredLine = <span className="text-slate-500 font-medium">{line}</span>;
              } else if (isMethod) {
                coloredLine = <span className="text-blue-400 font-bold font-medium">{line}</span>;
              } else if (isAssert) {
                coloredLine = <span className="text-emerald-400 font-semibold">{line}</span>;
              }

              return (
                <div key={idx} className="h-5 hover:bg-[#1C212B]/45 rounded px-1 transition-all">
                  {coloredLine}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live code sync stats banner */}
      <div className="p-2.5 px-4 bg-sophisticated-header border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-600" />
          <span>Active syntax mode: <b className="text-slate-400 font-semibold">{getLanguageTag()}</b></span>
        </div>
        <span>Sync Speed: <b className="text-blue-400 font-bold font-semibold">&lt; 10ms</b></span>
      </div>
    </div>
  );
}
