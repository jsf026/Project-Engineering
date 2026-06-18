/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTestStore } from '../store/useTestStore';
import { Step, StepType, SelectorType } from '../types';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Link, 
  MousePointerClick, 
  Keyboard, 
  CheckSquare, 
  Hourglass, 
  Hand, 
  ChevronDown, 
  ChevronUp, 
  Layers,
  ArrowUpDown,
  AlertCircle,
  HelpCircle,
  Code
} from 'lucide-react';

export default function VisualBuilder() {
  const { 
    steps, 
    activeStepId, 
    setActiveStepId, 
    updateStep, 
    removeStep, 
    insertStepAt, 
    clearSteps,
    addLog,
    reorderSteps
  } = useTestStore();

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Quick Action inserts helper
  const addActionInline = (index: number, type: StepType) => {
    const id = `inline_step_${Date.now()}`;
    let basePayload: Partial<Step['payload']> = {};

    switch (type) {
      case 'wait':
        basePayload = { timeout: 1500, activeSelectorType: 'text', selectors: { text: 'Pause delay' } };
        break;
      case 'scroll':
        basePayload = { activeSelectorType: 'text', selectors: { text: 'Scroll page viewport' } };
        break;
      case 'assert':
        basePayload = { selector: '.success-banner', activeSelectorType: 'className', selectors: { className: 'success-banner' } };
        break;
      case 'goto':
        basePayload = { url: 'https://ecommerce-sandbox.testflow.ai/', activeSelectorType: 'text', selectors: { text: 'Root URL' } };
        break;
    }

    const step: Step = {
      id,
      type,
      payload: basePayload
    };

    insertStepAt(index, step);
  };

  // Submit helper for natural language AI step generation
  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    setAiError(null);
    addLog(`Contacting server AI Engine for prompt parsing: "${aiPrompt}"...`, 'info');

    try {
      const response = await fetch('/api/generate-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!response.ok) {
        const errData = await response.json();
        if (errData.error === 'AUTHENTICATION_REQUIRED') {
          throw new Error('CONFIG_KEY_MISSING');
        }
        throw new Error(errData.message || 'Server translation error.');
      }

      const data = await response.json();
      if (data.steps && Array.isArray(data.steps) && data.steps.length > 0) {
        // Appends generated steps with unique IDs
        data.steps.forEach((s: Step, index: number) => {
          const stepWithId: Step = {
            ...s,
            id: `ai_step_${Date.now()}_${index}`,
          };
          insertStepAt(steps.length + index, stepWithId);
        });
        addLog(`🎉 AI successfully appended ${data.steps.length} sequential steps matching requirements!`, 'success');
        setAiPrompt('');
      } else {
        throw new Error('AI was unable to identify matching steps recursively.');
      }

    } catch (err: any) {
      console.warn('AI compilation error caught:', err);
      if (err.message === 'CONFIG_KEY_MISSING') {
        setAiError('Secrets configuration key required! Tap on "Settings > Secrets" and paste a valid GEMINI_API_KEY to test actual real-time AI capabilities.');
      } else {
        setAiError(err.message || 'Network translation error. Run server diagnostic logs or trigger local simulation.');
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  // Mock-failover generator lets Manny continue seamlessly if API key is not present yet
  const handleMockGenerate = () => {
    setIsAiLoading(true);
    setAiError(null);
    setTimeout(() => {
      const mockSteps: Step[] = [
        {
          id: `f_mock_${Date.now()}_1`,
          type: 'click',
          payload: {
            selector: '#btn-login',
            activeSelectorType: 'id',
            selectors: { id: 'btn-login', text: 'Sign In Block' }
          }
        },
        {
          id: `f_mock_${Date.now()}_2`,
          type: 'wait',
          payload: {
            timeout: 2000,
            activeSelectorType: 'text',
            selectors: { text: 'Wait period' }
          }
        },
        {
          id: `f_mock_${Date.now()}_3`,
          type: 'assert',
          payload: {
            selector: '#dashboard-title',
            activeSelectorType: 'id',
            selectors: { id: 'dashboard-title', text: 'Welcome Banner' }
          }
        }
      ];

      mockSteps.forEach((s, idx) => insertStepAt(steps.length + idx, s));
      setIsAiLoading(false);
      setAiPrompt('');
      addLog('Generated simulated visual steps successfully (Offline Sandbox Fallback Mode).', 'success');
    }, 800);
  };

  const getStepIcon = (type: StepType) => {
    switch (type) {
      case 'goto': return <Link className="h-4 w-4 text-sky-400" />;
      case 'click': return <MousePointerClick className="h-4 w-4 text-emerald-400" />;
      case 'type': return <Keyboard className="h-4 w-4 text-teal-400" />;
      case 'assert': return <CheckSquare className="h-4 w-4 text-purple-400" />;
      case 'wait': return <Hourglass className="h-4 w-4 text-amber-400" />;
      case 'hover': return <Hand className="h-4 w-4 text-pink-400" />;
      default: return <Code className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStepBadge = (type: StepType) => {
    switch (type) {
      case 'goto':
        return <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-mono rounded border border-blue-500/20 uppercase tracking-wider font-semibold">GOTO</span>;
      case 'type':
        return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-mono rounded border border-amber-500/20 uppercase tracking-wider font-semibold">TYPE</span>;
      case 'click':
        return <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-mono rounded border border-purple-500/20 uppercase tracking-wider font-semibold">CLICK</span>;
      case 'assert':
        return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono rounded border border-emerald-500/20 uppercase tracking-wider font-semibold">ASSERT</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-500/10 text-slate-400 text-[10px] font-mono rounded border border-slate-500/20 uppercase tracking-wider font-semibold">{type}</span>;
    }
  };

  return (
    <div id="visual-builder-root" className="flex flex-col h-full bg-sophisticated-pane text-slate-300">
      {/* visual action bar */}
      <div className="p-4 border-b border-slate-800 bg-sophisticated-header flex items-center justify-between shrink-0">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 font-sans">Visual Flow</span>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Chronological automation test track</p>
        </div>
        <button
          onClick={clearSteps}
          className="text-xs px-2.5 py-1 text-slate-400 hover:text-white bg-[#1C212B] border border-slate-700 hover:border-slate-500 rounded transition cursor-pointer"
        >
          Clear All
        </button>
      </div>

      {/* Steps List Canvas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-sophisticated-pane">
        {steps.length === 0 ? (
          <div className="text-center py-24 px-4 border-2 border-dashed border-slate-800 rounded-xl max-w-sm mx-auto my-12 bg-sophisticated-bg/30">
            <Layers className="h-8 w-8 text-slate-600 mx-auto mb-3" />
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Visual Canvas Empty</h4>
            <p className="text-[10px] text-slate-550 mt-1.5 max-w-[280px] mx-auto leading-normal">
              Click elements or enter inputs inside the live <b>Sandbox Viewport</b> to begin recording automation scripts, or type plain actions using the AI assistant card below!
            </p>
          </div>
        ) : (
          <div className="relative space-y-3">
            {steps.map((step, index) => {
              const isActive = activeStepId === step.id;
              const hasSelectorsMap = step.payload.selectors && Object.keys(step.payload.selectors).length > 0;
              
              return (
                <div key={step.id}>
                  {/* Inline Step Insertion Trigger */}
                  <div className="group/insert py-1 flex items-center justify-center relative">
                    <div className="w-full h-[1px] bg-slate-800/40 group-hover/insert:bg-blue-500/20 absolute"></div>
                    <div className="relative flex gap-1.5 opacity-0 group-hover/insert:opacity-100 transition-all scale-95 group-hover/insert:scale-100 z-10">
                      <button
                        onClick={() => addActionInline(index, 'wait')}
                        className="text-[9px] bg-sophisticated-bg border border-slate-800 hover:border-blue-500 hover:text-blue-400 py-1 px-2 rounded font-mono text-slate-400 transition cursor-pointer"
                      >
                        + Delay Pause
                      </button>
                      <button
                        onClick={() => addActionInline(index, 'assert')}
                        className="text-[9px] bg-sophisticated-bg border border-slate-800 hover:border-blue-500 hover:text-blue-400 py-1 px-2 rounded font-mono text-slate-400 transition cursor-pointer"
                      >
                        + Assert Check
                      </button>
                    </div>
                  </div>

                  {/* Main Step Card Node */}
                  <div 
                    onClick={() => setActiveStepId(step.id)}
                    className={`p-4 rounded-lg transition-all cursor-pointer relative ${
                      isActive 
                        ? 'bg-blue-900/10 border-2 border-blue-500/40 shadow-lg shadow-blue-950/20' 
                        : 'bg-sophisticated-card border border-slate-700 hover:border-blue-500/50'
                    }`}
                  >
                    {/* Top line header of step */}
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="flex items-center gap-2">
                        {getStepBadge(step.type)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">#{index + 1}</span>
                        
                        {/* Control buttons inside step */}
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            disabled={index === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              reorderSteps(index, index - 1);
                            }}
                            className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-20 rounded hover:bg-[#0B0E14] transition"
                            title="Move step up"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            disabled={index === steps.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              reorderSteps(index, index + 1);
                            }}
                            className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-20 rounded hover:bg-[#0B0E14] transition"
                            title="Move step down"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStep(step.id);
                            }}
                            title="Remove Step"
                            className="p-1 text-slate-500 hover:text-rose-450 rounded hover:bg-[#0B0E14] transition ml-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Step Card detail settings forms */}
                    <div className="mt-1">
                      {step.type === 'goto' && (
                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-slate-200 font-medium leading-snug">
                            Navigate to <span className="text-blue-400 font-semibold">{step.payload.url || 'https://ecommerce-sandbox.testflow.ai/'}</span>
                          </p>
                          <div className="flex items-center bg-sophisticated-bg border border-slate-800 rounded p-1 px-2.5 mt-1">
                            <span className="text-[9px] font-mono text-slate-550 uppercase font-bold shrink-0 pr-2">Edit URL:</span>
                            <input
                              type="text"
                              value={step.payload.url || ''}
                              onChange={(e) => updateStep(step.id, { url: e.target.value })}
                              className="flex-1 text-[11px] bg-transparent border-none text-blue-400 font-mono p-0 focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>
                      )}

                      {step.type === 'wait' && (
                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-slate-200 font-medium">
                            Delay playback sequence for <span className="text-amber-400 font-bold">{step.payload.timeout || 1000}ms</span>
                          </p>
                          <div className="flex items-center bg-sophisticated-bg border border-slate-800 rounded p-1 px-2 mt-1">
                            <span className="text-[9px] font-mono text-slate-550 uppercase font-bold shrink-0 pr-2">Timeout MS:</span>
                            <input
                              type="number"
                              value={step.payload.timeout || 1000}
                              onChange={(e) => updateStep(step.id, { timeout: parseInt(e.target.value) || 1000 })}
                              className="flex-1 text-[11px] bg-transparent border-none text-amber-400 font-mono p-0 focus:outline-none focus:ring-0"
                            />
                          </div>
                        </div>
                      )}

                      {(step.type === 'click' || step.type === 'type' || step.type === 'assert') && (
                        <div className="space-y-2">
                          <div className="text-sm leading-snug">
                            {step.type === 'click' && (
                              <p className="text-slate-200 font-medium">Click on element matching priority selector</p>
                            )}
                            {step.type === 'type' && (
                              <p className="text-slate-200 font-medium">Type text content into element field</p>
                            )}
                            {step.type === 'assert' && (
                              <p className="text-slate-200 font-medium italic underline decoration-blue-500/20">Verify visibility of target node</p>
                            )}
                          </div>

                          {/* Selector configuration line */}
                          <div className="flex items-center gap-1.5 p-1 bg-sophisticated-bg border border-slate-800 rounded text-[11px]">
                            <span className="text-[9px] font-mono text-slate-550 font-bold uppercase pl-1.5 shrink-0">Selector:</span>
                            {hasSelectorsMap ? (
                              <select
                                value={step.payload.activeSelectorType || 'id'}
                                onChange={(e) => updateStep(step.id, { activeSelectorType: e.target.value as SelectorType })}
                                className="flex-1 bg-transparent border-none text-purple-400 font-mono py-0.5 focus:outline-none focus:ring-0 text-[10px] outline-none border-0"
                              >
                                {Object.entries(step.payload.selectors || {}).map(([key, val]) => (
                                  <option key={key} value={key} className="bg-sophisticated-bg text-slate-300">
                                    [{key.toUpperCase()}] {val}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={step.payload.selector || ''}
                                onChange={(e) => updateStep(step.id, { selector: e.target.value })}
                                className="flex-1 bg-transparent text-purple-400 border-none p-0.5 font-mono text-[10px] focus:outline-none focus:ring-0"
                              />
                            )}
                          </div>

                          {/* Typing keyboard target input */}
                          {step.type === 'type' && (
                            <div className="flex flex-col gap-1 mt-1">
                              <p className="text-xs text-slate-400 italic">Value: <span className="text-amber-300 font-mono">"{step.payload.value || ''}"</span></p>
                              <div className="flex items-center bg-sophisticated-bg border border-slate-800 rounded p-1 px-2.5">
                                <span className="text-[9px] font-mono text-slate-550 uppercase font-bold shrink-0 pr-2">Edit Value:</span>
                                <input
                                  type="text"
                                  value={step.payload.value || ''}
                                  onChange={(e) => updateStep(step.id, { value: e.target.value })}
                                  className="flex-1 text-[11px] bg-transparent border-none text-slate-200 p-0 focus:outline-none focus:ring-0"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Final Append insertion triggers */}
            <div className="group/insert py-1 flex items-center justify-center relative">
              <div className="w-full h-[1px] bg-slate-800/40 group-hover/insert:bg-blue-500/20 absolute"></div>
              <div className="relative flex gap-1.5 opacity-0 group-hover/insert:opacity-100 transition-all scale-95 group-hover/insert:scale-100 z-10">
                <button
                  onClick={() => addActionInline(steps.length, 'wait')}
                  className="text-[9px] bg-sophisticated-bg border border-slate-800 hover:border-blue-500 hover:text-blue-400 py-1 px-2 rounded font-mono text-slate-400 transition cursor-pointer"
                >
                  + Delay Pause
                </button>
                <button
                  onClick={() => addActionInline(steps.length, 'assert')}
                  className="text-[9px] bg-sophisticated-bg border border-slate-800 hover:border-blue-500 hover:text-blue-400 py-1 px-2 rounded font-mono text-slate-400 transition cursor-pointer"
                >
                  + Assert Check
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI STEPS TRANSLATOR ASSISTANT CARD */}
      <div id="ai-assistant-terminal" className="p-4 border-t border-slate-800 bg-sophisticated-header shrink-0">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">AI Automation Copilot</h3>
        </div>
        
        {aiError && (
          <div className="mb-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg flex gap-2 text-[10px] text-rose-350 leading-normal">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-450" />
            <div>
              <p className="font-semibold text-rose-200">AI Prompt Interrupted:</p>
              <p className="mt-0.5">{aiError}</p>
              <button
                onClick={handleMockGenerate}
                type="button"
                className="mt-1.5 px-2 py-0.5 hover:bg-rose-500/20 text-rose-300 border border-rose-400/30 rounded font-medium transition cursor-pointer"
              >
                Inject Sandbox Example (Offline Fallback)
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleAiGenerate} className="flex gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            disabled={isAiLoading}
            placeholder={isAiLoading ? "Parsing requirements..." : "Type instructions... e.g., 'Click login, wait 1s, check welcome title'"}
            className="flex-1 bg-sophisticated-bg border border-slate-700 focus:border-blue-500 text-xs px-3.5 py-2 rounded text-slate-200 focus:outline-none font-sans placeholder-slate-500 transition-all"
          />
          <button
            type="submit"
            disabled={isAiLoading || !aiPrompt.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-600 p-2 px-3 rounded transition-all flex items-center justify-center font-bold font-semibold shrink-0 cursor-pointer shadow-lg shadow-blue-900/10"
            title="Generate steps from instruction phrase"
          >
            {isAiLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </button>
        </form>
        <p className="text-[9px] text-slate-500 mt-1.5 text-center">
          Translates instructions directly into Playwright descriptors in real-time.
        </p>
      </div>
    </div>
  );
}
