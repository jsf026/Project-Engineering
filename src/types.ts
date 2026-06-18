/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StepType = 'goto' | 'click' | 'type' | 'assert' | 'api_request' | 'wait' | 'hover' | 'scroll';

export type SelectorType = 'id' | 'testId' | 'label' | 'name' | 'className' | 'text';

export interface StepSelectors {
  id?: string;
  testId?: string;
  label?: string;
  name?: string;
  className?: string;
  text?: string;
}

export interface Step {
  id: string;
  type: StepType;
  payload: {
    url?: string;
    selector?: string;
    selectors?: StepSelectors;
    activeSelectorType?: SelectorType;
    value?: string;
    timeout?: number;
    apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    apiUrl?: string;
    apiHeaders?: string;
    apiBody?: string;
    apiExpectedStatus?: number;
  };
}

export interface TestFlow {
  id: string;
  name: string;
  description: string;
  steps: Step[];
  createdAt: string;
}

export interface ExecutionLog {
  id: string;
  time: string;
  status: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface TestSuiteStats {
  totalRuns: number;
  passRate: number;
  avgDurationMs: number;
  history: {
    date: string;
    passed: number;
    failed: number;
    duration: number;
  }[];
}
