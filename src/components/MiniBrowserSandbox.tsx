/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTestStore } from '../store/useTestStore';
import { Step, SelectorType } from '../types';
import { Globe, RefreshCw, Send, Sparkles, CheckCircle, ShoppingBag, Terminal, Play, Radio } from 'lucide-react';

export default function MiniBrowserSandbox() {
  const { 
    addStep, 
    addLog, 
    locatorRanking, 
    browserUrl, 
    setBrowserUrl,
    isPlaying,
    currentPlayingStepIndex,
    setCurrentPlayingStepIndex,
    setIsPlaying,
    steps
  } = useTestStore();

  const [inputUrl, setInputUrl] = useState(browserUrl);
  const [activeTab, setActiveTab] = useState<'login' | 'dashboard' | 'checkout' | 'crm'>('login');
  
  // Local simulated webpage state
  const [username, setUsername] = useState('manny_tester');
  const [password, setPassword] = useState('');
  const [promo, setPromo] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [crmStatusMessage, setCrmStatusMessage] = useState('Workspace healthy. All systems green.');
  
  // Highlighting elements for automated test simulation playback
  const [highlightedSelector, setHighlightedSelector] = useState<string | null>(null);

  // Auto-sync store URL changes
  useEffect(() => {
    setInputUrl(browserUrl);
  }, [browserUrl]);

  // Simulated Test Run Playback Engine
  // Flashes and reacts to steps as they simulate execution
  useEffect(() => {
    if (isPlaying && currentPlayingStepIndex >= 0 && currentPlayingStepIndex < steps.length) {
      const step = steps[currentPlayingStepIndex];
      addLog(`Simulating visual step: [${step.type.toUpperCase()}] ...`, 'info');
      
      // Determine target selector to highlight
      let sel = '';
      if (step.type === 'goto') {
        const urlToLoad = step.payload.url || 'https://ecommerce-sandbox.testflow.ai/';
        setInputUrl(urlToLoad);
        setBrowserUrl(urlToLoad);
        setActiveTab('login');
        setIsLoggedIn(false);
        setCartCount(0);
        sel = 'browser-frame';
      } else {
        const { selectors, activeSelectorType, selector } = step.payload;
        if (selectors && activeSelectorType) {
          const val = selectors[activeSelectorType];
          sel = activeSelectorType === 'id' ? val : activeSelectorType === 'className' ? val.split(' ')[0] : val;
        } else {
          sel = selector || '';
        }

        // Trigger action reactions in mock page
        if (step.type === 'click') {
          if (sel.includes('login') || sel.includes('btn-login') || sel.includes('login-trigger')) {
            setActiveTab('dashboard');
            setIsLoggedIn(true);
            addLog(`✓ Event trigger: Simulated customer login success. Redirecting to /dashboard`, 'success');
          } else if (sel.includes('sneakers') || sel.includes('add-sneakers-btn')) {
            setCartCount(c => c + 1);
            addLog(`✓ Event trigger: Added 'Red Sneakers' to checkout cart.`, 'success');
          } else if (sel.includes('checkout')) {
            setActiveTab('checkout');
            addLog(`✓ Event trigger: Redirected to checkout screen.`, 'success');
          }
        } else if (step.type === 'type') {
          if (sel.includes('username') || sel.includes('input-user')) {
            setUsername(step.payload.value || '');
          } else if (sel.includes('password')) {
            setPassword(step.payload.value || '');
          }
        }
      }

      setHighlightedSelector(sel);

      const delay = 1500; // Simulated speed delay
      const timer = setTimeout(() => {
        setHighlightedSelector(null);
        if (currentPlayingStepIndex + 1 < steps.length) {
          setCurrentPlayingStepIndex(currentPlayingStepIndex + 1);
        } else {
          setIsPlaying(false);
          setCurrentPlayingStepIndex(-1);
          addLog(`🎉 Test execution completed. All checks passed successfully.`, 'success');
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentPlayingStepIndex]);

  // Click interceptor helper for element actions under recording mode
  const recordInteraction = (
    type: 'goto' | 'click' | 'type' | 'assert',
    elementMeta: {
      id?: string;
      testId?: string;
      label?: string;
      name?: string;
      className?: string;
      text?: string;
      fallbackSelector: string;
      value?: string;
    }
  ) => {
    if (isPlaying) return; // Ignore recording clicks while playing back simulation

    // Map according to priority ranking list
    let chosenSelectorType: SelectorType = 'id';
    for (const rank of locatorRanking) {
      if (elementMeta[rank]) {
        chosenSelectorType = rank;
        break;
      }
    }

    const uniqueId = `step_${Date.now()}`;
    const newStep: Step = {
      id: uniqueId,
      type,
      payload: {
        selector: elementMeta.fallbackSelector,
        value: elementMeta.value || '',
        activeSelectorType: chosenSelectorType,
        selectors: {
          id: elementMeta.id,
          testId: elementMeta.testId,
          label: elementMeta.label,
          name: elementMeta.name,
          className: elementMeta.className,
          text: elementMeta.text,
        }
      }
    };

    addStep(newStep);
  };

  const isHighlighted = (propVal?: string) => {
    if (!highlightedSelector || !propVal) return false;
    return propVal.includes(highlightedSelector) || highlightedSelector.includes(propVal);
  };

  return (
    <div id="mock-browser-wrapper" className="flex flex-col bg-sophisticated-card border border-slate-700 rounded-lg overflow-hidden shadow-2xl h-full">
      {/* Browser Nav bar */}
      <div className="bg-[#0B0E14] px-4 py-2.5 flex items-center gap-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
        </div>
        {/* Address input */}
        <div className="flex-1 flex items-center bg-sophisticated-bg rounded px-2.5 py-1.5 border border-slate-800 text-xs gap-1.5">
          <Globe className="h-3.5 w-3.5 text-slate-550 shrink-0" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setBrowserUrl(inputUrl);
                recordInteraction('goto', { fallbackSelector: 'body', text: 'Navigation', textContent: inputUrl } as any);
              }
            }}
            className="flex-1 text-slate-200 bg-transparent focus:outline-none focus:ring-0 text-[11px]"
          />
          <RefreshCw 
            className="h-3 w-3 text-slate-550 hover:text-slate-300 cursor-pointer transition shrink-0"
            onClick={() => {
              setInputUrl(browserUrl);
              addLog('Simulated page canvas refresh.', 'info');
            }} 
          />
        </div>

        {/* Live capture status badge */}
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-[10px] font-bold text-blue-400 font-mono tracking-widest uppercase shrink-0">Live Sandbox</span>
        </div>
      </div>

      {/* Simulator Web Page Viewport */}
      <div 
        id="browser-frame" 
        className={`flex-1 bg-sophisticated-pane p-6 flex items-center justify-center relative overflow-y-auto ${
          isHighlighted('browser-frame') ? 'ring-4 ring-blue-500 ring-inset animate-pulse bg-[#0B0E14]' : ''
        }`}
      >
        <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-250 text-slate-800 relative min-h-[360px] flex flex-col transition-all">
          
          {/* Simulated Webpage Header banner */}
          <div className="bg-slate-800 text-white p-3.5 px-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="h-4.5 w-4.5 text-blue-400" />
              <span className="font-bold text-xs tracking-wider">E-Shop Demo Sandbox</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-medium bg-teal-500/10 text-teal-300 px-1.5 py-0.5 rounded font-mono">
                {cartCount} Items
              </span>
              <button 
                onClick={() => {
                  setActiveTab('login');
                  setIsLoggedIn(false);
                  setCartCount(0);
                }}
                className="text-[10px] hover:text-teal-400 font-bold transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* SIMULATED ROUTE: LOGIN TAB */}
          {activeTab === 'login' && (
            <div className="p-6 flex-1 flex flex-col justify-center">
              <div className="text-center mb-4">
                <h3 className="font-bold text-base text-slate-800">Secure Client Access</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Click fields below to record active steps</p>
              </div>

              <div className="space-y-3">
                {/* Email container */}
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Username / Email</label>
                  <input
                    type="text"
                    id="input-user"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onClick={() => {
                      recordInteraction('type', {
                        id: 'input-user',
                        name: 'username',
                        className: 'w-full text-xs border p-2 rounded',
                        text: 'Username field',
                        fallbackSelector: '#input-user',
                        value: username,
                      });
                    }}
                    className={`w-full text-xs border p-2 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none text-slate-800 transition ${
                      isHighlighted('input-user') || isHighlighted('username') ? 'ring-2 ring-yellow-500 border-yellow-500' : 'border-slate-300'
                    }`}
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Key Phrase</label>
                  <input
                    type="password"
                    id="input-password"
                    name="password"
                    value={password}
                    placeholder="••••••••"
                    onChange={(e) => setPassword(e.target.value)}
                    onClick={() => {
                      recordInteraction('type', {
                        id: 'input-password',
                        name: 'password',
                        className: 'w-full text-xs border p-2 rounded',
                        text: 'Password field',
                        fallbackSelector: '#input-password',
                        value: 'demo_key',
                      });
                    }}
                    className={`w-full text-xs border p-2 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none text-slate-800 transition ${
                      isHighlighted('input-password') || isHighlighted('password') ? 'ring-2 ring-yellow-500 border-yellow-500' : 'border-slate-300'
                    }`}
                  />
                </div>

                {/* Submit login button */}
                <button
                  type="button"
                  id="btn-login"
                  data-testid="login-trigger"
                  onClick={() => {
                    recordInteraction('click', {
                      id: 'btn-login',
                      testId: 'login-trigger',
                      className: 'w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-bold font-semibold cursor-pointer shadow-sm',
                      text: 'Login to Sandbox',
                      fallbackSelector: '#btn-login',
                    });
                    setActiveTab('dashboard');
                    setIsLoggedIn(true);
                  }}
                  className={`w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-bold tracking-wider transition ${
                    isHighlighted('btn-login') || isHighlighted('login-trigger') ? 'ring-2 ring-yellow-500 bg-yellow-500 hover:bg-yellow-600' : ''
                  }`}
                >
                  Sign In (Record Trigger)
                </button>
              </div>
            </div>
          )}

          {/* SIMULATED ROUTE: DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div id="dashboard-title" className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 leading-tight">Welcome back, {username}!</h3>
                    <p className="text-[9px] text-slate-400 mt-0.5">Manny Manual Session Sandbox</p>
                  </div>
                  <button
                    onClick={() => {
                      recordInteraction('assert', {
                        id: 'dashboard-title',
                        className: 'text-sm font-bold text-slate-800',
                        text: 'Welcome back, manny_tester!',
                        fallbackSelector: '#dashboard-title',
                      });
                      addLog('Assert Step added: verify Welcome back dashboard banner is visible', 'success');
                    }}
                    className="p-1 text-[9px] bg-teal-50 text-teal-600 border border-teal-200 hover:bg-teal-100 rounded transition"
                  >
                    Assert Visibility
                  </button>
                </div>

                {/* Catalog Item block */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-teal-300 transition bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded bg-rose-100 text-rose-500 font-bold flex items-center justify-center text-xs">👟</span>
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-850">Red Court Sneakers</h4>
                        <p className="text-[9px] text-slate-500 font-mono">$120.00 • In stock</p>
                      </div>
                    </div>
                    <button
                      id="add-sneakers-btn"
                      data-testid="btn-add-sneakers"
                      onClick={() => {
                        recordInteraction('click', {
                          id: 'add-sneakers-btn',
                          testId: 'btn-add-sneakers',
                          className: 'p-1 px-2.5 bg-teal-600 text-white rounded text-[10px] font-bold',
                          text: 'Add Class Sneakers',
                          fallbackSelector: '#add-sneakers-btn',
                        });
                        setCartCount(c => c + 1);
                      }}
                      className={`p-1 px-2.5 bg-teal-600 text-white rounded text-[10px] font-bold transition hover:bg-teal-700 cursor-pointer ${
                        isHighlighted('add-sneakers-btn') || isHighlighted('btn-add-sneakers') ? 'bg-yellow-500 hover:bg-yellow-600' : ''
                      }`}
                    >
                      + Add Item
                    </button>
                  </div>

                  {/* Checkout process buttons */}
                  {cartCount > 0 && (
                    <button
                      id="btn-checkout"
                      data-testid="checkout-btn"
                      onClick={() => {
                        recordInteraction('click', {
                          id: 'btn-checkout',
                          testId: 'checkout-btn',
                          className: 'w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs rounded font-bold cursor-pointer transition',
                          text: 'Perform Order Checkout',
                          fallbackSelector: '#btn-checkout',
                        });
                        setActiveTab('checkout');
                      }}
                      className={`w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] tracking-wider rounded font-bold transition mt-4 ${
                        isHighlighted('btn-checkout') || isHighlighted('checkout-btn') ? 'bg-yellow-500 hover:bg-yellow-600 text-slate-950' : ''
                      }`}
                    >
                      Proceed to E-Checkout
                    </button>
                  )}
                </div>
              </div>

              {/* CRM View toggle */}
              <button
                onClick={() => setActiveTab('crm')}
                className="mt-6 text-[9px] text-center w-full text-slate-400 hover:text-teal-600 border border-dotted border-slate-300 py-1.5 rounded transition"
              >
                Open Customer CRM Suite Table Mock
              </button>
            </div>
          )}

          {/* SIMULATED ROUTE: CHECKOUT FORM */}
          {activeTab === 'checkout' && (
            <div className="p-6 flex-1 flex flex-col justify-between text-center">
              <div className="my-auto space-y-4">
                <CheckCircle className="h-12 w-12 text-teal-500 mx-auto animate-bounce" />
                <div>
                  <h3 className="font-bold text-base text-slate-800">Checkout Complete!</h3>
                  <p className="text-xs text-slate-500 mt-1">Transaction simulated successfully.</p>
                </div>

                <div 
                  id="checkout-success-ref" 
                  className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-[11px] text-slate-600 text-left font-mono"
                  onClick={() => {
                    recordInteraction('assert', {
                      id: 'checkout-success-ref',
                      className: 'bg-slate-50 border p-3 rounded text-[11px]',
                      text: 'Transaction Status: SUCCESS',
                      fallbackSelector: '#checkout-success-ref'
                    });
                  }}
                >
                  <p className="text-[9px] text-slate-400 font-medium">Recorded Object Assertions Node:</p>
                  <p className="font-bold text-teal-600 mt-0.5" id="tx-success-pill">✓ STATUS: CONFIRMED</p>
                  <p className="mt-1">Buyer: {username}</p>
                  <span className="text-[9px] text-slate-400">ID: TF-TX-{Math.floor(Math.random()*9000 + 1000)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('login');
                  setIsLoggedIn(false);
                  setCartCount(0);
                }}
                className="w-full py-2 bg-slate-100 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-200 transition"
              >
                Restart Interactive Journey
              </button>
            </div>
          )}

          {/* SIMULATED ROUTE: CRM LOGS */}
          {activeTab === 'crm' && (
            <div className="p-4 flex-1 flex flex-col justify-between text-slate-700">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2 mb-2">
                  <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-rose-500 animate-pulse shrink-0" />
                    CRM Feeds List
                  </h3>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="text-[9px] text-teal-600 font-bold hover:underline"
                  >
                    Back
                  </button>
                </div>

                <div className="text-[10px] space-y-1.5">
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                    <div>
                      <p className="font-bold text-slate-800">Sys-Manny Profile</p>
                      <p className="text-[8px] text-slate-400">manual-tester@tesi.com</p>
                    </div>
                    <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">Active</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                    <div>
                      <p className="font-bold text-slate-800">E-Shop checkout pipeline</p>
                      <p className="text-[8px] text-slate-400">Playwright runner agent hook</p>
                    </div>
                    <span className="text-[8px] bg-amber-100 text-amber-800 font-bold px-1 rounded">Pending</span>
                  </div>
                </div>

                <div className="bg-slate-900 text-teal-400 text-[10px] font-mono p-2.5 rounded-lg leading-tight mt-4">
                  <p className="text-[8px] text-slate-500 font-medium font-sans uppercase">Simulator Console Feed</p>
                  <p className="mt-1">{crmStatusMessage}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 text-[9px]">
                <button
                  onClick={() => {
                    setCrmStatusMessage('Triggered simulated database backup sequence.');
                    addLog('Simulated CRM button: Backup DB clicked', 'info');
                    recordInteraction('click', {
                      fallbackSelector: 'button:contains("Backup DB")',
                      text: 'CRM Backup DB command',
                    });
                  }}
                  className="p-1 px-1.5 border hover:bg-slate-100 flex-1 rounded"
                >
                  Backup DB
                </button>
                <button
                  onClick={() => {
                    setCrmStatusMessage('Cleared workspace diagnostic telemetry.');
                    addLog('Simulated CRM button: Telemetry Flush clicked', 'warning');
                    recordInteraction('click', {
                      fallbackSelector: 'button:contains("Flush Alerts")',
                      text: 'CRM Flush Alerts'
                    });
                  }}
                  className="p-1 px-1.5 border hover:bg-slate-100 flex-1 rounded"
                >
                  Flush Alerts
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Frame Status logs at bottom */}
      <div className="bg-slate-950 p-2 px-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3 w-3 text-slate-500" />
          <span>Capture Status: <span className="text-teal-400 font-bold">Armed</span></span>
        </div>
        <span>Target Framework: <b className="text-slate-300 font-semibold">{steps.length} Actions Registered</b></span>
      </div>
    </div>
  );
}
