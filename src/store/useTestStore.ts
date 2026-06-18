/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { Step, SelectorType, ExecutionLog, TestFlow } from '../types';

interface TestState {
  // Core workflow variables
  steps: Step[];
  targetFramework: 'playwright_ts' | 'selenium_py' | 'cypress_js' | 'puppeteer_js';
  activeStepId: string | null;
  
  // Custom configuration
  config: {
    usePOM: boolean;
    baseUrl: string;
    addComments: boolean;
    headless: boolean;
  };
  
  // Locator ranking priority guards
  locatorRanking: SelectorType[];
  
  // Simulation playback variables
  isPlaying: boolean;
  currentPlayingStepIndex: number;
  logs: ExecutionLog[];
  
  // Simulated Mini-Browser Page sandbox variables
  browserUrl: string;
  isBrowserLoading: boolean;
  
  // Saved suite variables
  savedFlows: TestFlow[];
  activeFlowName: string;
  activeFlowDescription: string;

  // Actions
  addStep: (step: Step) => void;
  updateStep: (id: string, updates: Partial<Step['payload']>) => void;
  insertStepAt: (index: number, step: Step) => void;
  removeStep: (id: string) => void;
  reorderSteps: (startIndex: number, endIndex: number) => void;
  setSteps: (steps: Step[]) => void;
  clearSteps: () => void;
  
  setFramework: (fw: 'playwright_ts' | 'selenium_py' | 'cypress_js' | 'puppeteer_js') => void;
  setActiveStepId: (id: string | null) => void;
  updateConfig: (updates: Partial<TestState['config']>) => void;
  setLocatorRanking: (ranking: SelectorType[]) => void;
  
  // Logs & Playback
  addLog: (message: string, status?: 'info' | 'success' | 'warning' | 'error') => void;
  clearLogs: () => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentPlayingStepIndex: (index: number) => void;
  
  // Mini browser operations
  setBrowserUrl: (url: string) => void;
  setBrowserLoading: (loading: boolean) => void;
  
  // Save/Restore Flows
  saveCurrentFlow: (name: string, description: string) => void;
  loadFlow: (id: string) => void;
  deleteFlow: (id: string) => void;
}

const DEFAULT_STEPS: Step[] = [
  {
    id: 'step_initial_goto',
    type: 'goto',
    payload: {
      url: 'https://ecommerce-sandbox.testflow.ai/',
      activeSelectorType: 'id',
      selectors: {
        text: 'Root URL',
      }
    }
  },
  {
    id: 'step_default_click',
    type: 'click',
    payload: {
      selector: '#btn-login',
      activeSelectorType: 'id',
      selectors: {
        id: 'btn-login',
        testId: 'login-trigger',
        text: 'Login to Sandbox',
        className: 'px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700'
      }
    }
  },
  {
    id: 'step_default_type',
    type: 'type',
    payload: {
      selector: '[name=username]',
      value: 'manny_tester',
      activeSelectorType: 'name',
      selectors: {
        name: 'username',
        id: 'input-user',
        className: 'border p-2 rounded w-full',
        label: 'Username Input'
      }
    }
  },
  {
    id: 'step_default_assert',
    type: 'assert',
    payload: {
      selector: '#dashboard-title',
      activeSelectorType: 'id',
      selectors: {
        id: 'dashboard-title',
        text: 'Welcome, Manny!',
        className: 'text-2xl font-bold text-slate-800'
      }
    }
  }
];

export const useTestStore = create<TestState>((set, get) => {
  // Read initial states from LocalStorage safely
  let localSavedFlows: TestFlow[] = [];
  try {
    const saved = localStorage.getItem('testflow_saved_suites');
    if (saved) {
      localSavedFlows = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Could not parse saved testflow suites', e);
  }

  return {
    steps: DEFAULT_STEPS,
    targetFramework: 'playwright_ts',
    activeStepId: 'step_default_click',
    config: {
      usePOM: false,
      baseUrl: '',
      addComments: true,
      headless: true,
    },
    locatorRanking: ['testId', 'id', 'name', 'label', 'className', 'text'],
    isPlaying: false,
    currentPlayingStepIndex: -1,
    logs: [
      { id: '1', time: new Date().toLocaleTimeString(), status: 'info', message: 'TestFlow AI Workbench initialized.' },
      { id: '2', time: new Date().toLocaleTimeString(), status: 'info', message: 'Smart Locator Guard ready.' }
    ],
    browserUrl: 'https://ecommerce-sandbox.testflow.ai/',
    isBrowserLoading: false,
    savedFlows: localSavedFlows,
    activeFlowName: 'E-Commerce Login Scenario',
    activeFlowDescription: 'Visual simulation to log in Manny to our visual sandbox app and check metrics dashboard.',

    addStep: (step) => set((state) => ({
      steps: [...state.steps, step],
      activeStepId: step.id,
      logs: [
        ...state.logs,
        {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          status: 'success',
          message: `Recorded Step: ${step.type.toUpperCase()} -> ${step.payload.url || getSelectorText(step)}`
        }
      ]
    })),

    updateStep: (id, updates) => set((state) => ({
      steps: state.steps.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            payload: {
              ...s.payload,
              ...updates,
            }
          };
        }
        return s;
      })
    })),

    insertStepAt: (index, step) => set((state) => {
      const newSteps = [...state.steps];
      newSteps.splice(index, 0, step);
      return {
        steps: newSteps,
        activeStepId: step.id,
        logs: [
          ...state.logs,
          {
            id: Date.now().toString(),
            time: new Date().toLocaleTimeString(),
            status: 'info',
            message: `Inserted Step: ${step.type.toUpperCase()} at line ${index + 1}`
          }
        ]
      };
    }),

    removeStep: (id) => set((state) => {
      const remainingSteps = state.steps.filter((s) => s.id !== id);
      const wasActive = state.activeStepId === id;
      return {
        steps: remainingSteps,
        activeStepId: wasActive ? (remainingSteps[0]?.id || null) : state.activeStepId,
        logs: [
          ...state.logs,
          {
            id: Date.now().toString(),
            time: new Date().toLocaleTimeString(),
            status: 'warning',
            message: `Removed step ID: ${id}`
          }
        ]
      };
    }),

    reorderSteps: (startIndex, endIndex) => set((state) => {
      const result = [...state.steps];
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { steps: result };
    }),

    setSteps: (steps) => set({ steps }),

    clearSteps: () => set((state) => ({
      steps: [],
      activeStepId: null,
      logs: [
        ...state.logs,
        {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          status: 'warning',
          message: 'All builder timeline steps cleared.'
        }
      ]
    })),

    setFramework: (fw) => set((state) => ({
      targetFramework: fw,
      logs: [
        ...state.logs,
        {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          status: 'info',
          message: `Switched target transpiler context to: ${fw.toUpperCase()}`
        }
      ]
    })),

    setActiveStepId: (id) => set({ activeStepId: id }),

    updateConfig: (updates) => set((state) => ({
      config: { ...state.config, ...updates }
    })),

    setLocatorRanking: (ranking) => set({ locatorRanking: ranking }),

    addLog: (message, status = 'info') => set((state) => ({
      logs: [
        ...state.logs,
        {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          status,
          message,
        }
      ]
    })),

    clearLogs: () => set({ logs: [] }),
    
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    
    setCurrentPlayingStepIndex: (index) => set({ currentPlayingStepIndex: index }),
    
    setBrowserUrl: (url) => set({ browserUrl: url }),
    
    setBrowserLoading: (loading) => set({ isBrowserLoading: loading }),

    saveCurrentFlow: (name, description) => {
      const { steps, savedFlows } = get();
      const newFlow: TestFlow = {
        id: `flow_${Date.now()}`,
        name: name || 'Unnamed Test Scenario',
        description: description || 'Visual step recording',
        steps: [...steps],
        createdAt: new Date().toLocaleDateString()
      };

      const updatedFlows = [newFlow, ...savedFlows.filter((f) => f.name !== name)];
      localStorage.setItem('testflow_saved_suites', JSON.stringify(updatedFlows));
      
      set((state) => ({
        savedFlows: updatedFlows,
        activeFlowName: newFlow.name,
        activeFlowDescription: newFlow.description,
        logs: [
          ...state.logs,
          {
            id: Date.now().toString(),
            time: new Date().toLocaleTimeString(),
            status: 'success',
            message: `Suite flow "${newFlow.name}" saved securely in localStorage.`
          }
        ]
      }));
    },

    loadFlow: (id) => {
      const { savedFlows } = get();
      const targetFlow = savedFlows.find((f) => f.id === id);
      if (targetFlow) {
        set((state) => ({
          steps: targetFlow.steps,
          activeStepId: targetFlow.steps[0]?.id || null,
          activeFlowName: targetFlow.name,
          activeFlowDescription: targetFlow.description,
          logs: [
            ...state.logs,
            {
              id: Date.now().toString(),
              time: new Date().toLocaleTimeString(),
              status: 'info',
              message: `Loaded visual automation flow: "${targetFlow.name}"`
            }
          ]
        }));
      }
    },

    deleteFlow: (id) => {
      const { savedFlows } = get();
      const updated = savedFlows.filter((f) => f.id !== id);
      localStorage.setItem('testflow_saved_suites', JSON.stringify(updated));
      set((state) => ({
        savedFlows: updated,
        logs: [
          ...state.logs,
          {
            id: Date.now().toString(),
            time: new Date().toLocaleTimeString(),
            status: 'warning',
            message: `Deleted saved suite from database storage`
          }
        ]
      }));
    }
  };
});

// Selector describer utility
function getSelectorText(step: Step): string {
  if (step.type === 'goto') return step.payload.url || '';
  const { selectors, activeSelectorType, selector } = step.payload;
  if (!selectors || !activeSelectorType) return selector || '';
  return `${activeSelectorType}: "${selectors[activeSelectorType]}"`;
}
