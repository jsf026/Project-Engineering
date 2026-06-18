/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTestStore } from '../store/useTestStore';
import { Save, FolderOpen, Trash2, Plus, FileCode, Check } from 'lucide-react';

export default function SavedFlowsList() {
  const { 
    savedFlows, 
    activeFlowName, 
    activeFlowDescription, 
    saveCurrentFlow, 
    loadFlow, 
    deleteFlow,
    clearSteps
  } = useTestStore();

  const [name, setName] = useState(activeFlowName);
  const [desc, setDesc] = useState(activeFlowDescription);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveCurrentFlow(name, desc);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  const handleNewTest = () => {
    clearSteps();
    setName('New Draft Scenario');
    setDesc('Fresh manual capture sequence');
  };

  return (
    <div id="saved-flows-container" className="flex flex-col h-full bg-sophisticated-pane border-r border-slate-800 w-64 text-slate-300">
      {/* Header Banner */}
      <div className="p-4 border-b border-slate-800 bg-sophisticated-header flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="h-5 w-5 text-blue-400" />
          <span className="font-bold text-xs tracking-widest text-[#F1F5F9] font-sans">TESTFLOW AI</span>
        </div>
        <button
          onClick={handleNewTest}
          title="Create New Blank Test"
          className="p-1 px-2.5 text-xs rounded border border-slate-700 hover:border-slate-500 bg-[#1C212B] hover:bg-slate-800 text-slate-300 font-medium transition flex items-center gap-1 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 text-blue-450" />
          New
        </button>
      </div>

      {/* Save Flow Form */}
      <div id="save-flow-section" className="p-4 border-b border-slate-800 bg-[#0B0E14]/75 shrink-0">
        <span className="text-[10px] font-bold text-slate-555 uppercase tracking-widest mb-2.5 block">Save Scenario</span>
        <form onSubmit={handleSave} className="space-y-2.5">
          <div>
            <label className="block text-[10px] text-slate-500 font-medium uppercase mb-1">Scenario Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. User Checkout Success"
              className="w-full text-xs px-2.5 py-1.5 rounded bg-sophisticated-bg text-slate-200 border border-slate-700/80 focus:border-blue-500 focus:outline-none transition-all placeholder-slate-650"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-medium uppercase mb-1">Scope Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="A brief scope of what this manual capture verifies..."
              rows={2}
              className="w-full text-xs px-2.5 py-1.5 rounded bg-sophisticated-bg text-slate-200 border border-slate-700/80 focus:border-blue-500 focus:outline-none transition-all resize-none placeholder-slate-650"
            />
          </div>
          <button
            type="submit"
            className={`w-full py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isSavedRecently 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'bg-[#1C212B] hover:bg-blue-600 border border-slate-700 hover:text-white text-blue-450 hover:border-blue-550'
            }`}
          >
            {isSavedRecently ? (
              <>
                <Check className="h-3.5 w-3.5 text-white animate-pulse" />
                Scenario Saved!
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Commit to Local DB
              </>
            )}
          </button>
        </form>
      </div>

      {/* Saved Flows List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center gap-1.5 mb-2">
          <FolderOpen className="h-4 w-4 text-amber-500" />
          <span className="text-[10px] font-bold text-slate-555 uppercase tracking-widest">Stored Cases</span>
        </div>
        
        {savedFlows.length === 0 ? (
          <div className="text-center py-8 px-2 border border-dashed border-slate-800 rounded-lg bg-sophisticated-bg/10">
            <p className="text-xs text-slate-500">No test cases customized yet.</p>
            <p className="text-[10px] text-slate-600 mt-1">Saves persist in your browser cache.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {savedFlows.map((flow) => {
              const isActive = flow.name === name;
              return (
                <div 
                  key={flow.id} 
                  className={`group relative p-2.5 rounded border transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-blue-900/10 border-blue-500/40 shadow-md shadow-blue-950/20' 
                      : 'bg-[#1C212B] border-slate-750 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                  onClick={() => {
                    loadFlow(flow.id);
                    setName(flow.name);
                    setDesc(flow.description);
                  }}
                >
                  <div className="pr-6">
                    <h4 className="text-xs font-semibold text-slate-200 truncate">{flow.name}</h4>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{flow.description}</p>
                    <span className="text-[9px] text-slate-600 inline-block mt-2 font-mono">{flow.createdAt} • {flow.steps.length} Steps</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete the "${flow.name}" test scenario permanently?`)) {
                        deleteFlow(flow.id);
                      }
                    }}
                    className="absolute right-2.5 bottom-2.5 p-1 text-slate-600 hover:text-rose-450 rounded hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Delete Scenario"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Tester Manny Card */}
      <div className="p-3 bg-sophisticated-header border-t border-slate-800 text-[11px] text-slate-400 leading-normal shrink-0 select-none">
        <p className="font-medium text-slate-300">👋 Manny’s Helper Mode</p>
        <p className="mt-1 text-[10px] text-slate-500">
          Click elements in the live <b>sandbox mini-browser</b> to automatically record clicks, keyboard typing, and verify layouts instantly.
        </p>
      </div>
    </div>
  );
}
