/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Step, SelectorType } from '../types';

// Helper to get formatted selector based on chosen activeSelectorType
export function getSelector(stepPayload: Step['payload']): string {
  const { selectors, activeSelectorType, selector } = stepPayload;
  if (!selectors || !activeSelectorType) {
    return selector || '';
  }

  const val = selectors[activeSelectorType];
  if (!val) return selector || '';

  switch (activeSelectorType) {
    case 'id':
      return `#${val}`;
    case 'testId':
      return `[data-testid="${val}"]`;
    case 'label':
      return `aria-label="${val}"`;
    case 'name':
      return `[name="${val}"]`;
    case 'className':
      return `.${val.split(' ').filter(Boolean).join('.')}`;
    case 'text':
      return `text="${val}"`;
    default:
      return selector || '';
  }
}

// Convert string to lowerCamelCase or PascalCase for POM methods/classes
function toCamelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  if (!camel) return 'PageObject';
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

// Generates code based on steps, framework selection, and configuration parameters
export function transpile(
  steps: Step[],
  framework: string,
  options: {
    usePOM?: boolean;
    baseUrl?: string;
    addComments?: boolean;
    headless?: boolean;
  } = {}
): string {
  const { usePOM = false, baseUrl = '', addComments = true, headless = true } = options;

  const resolvedUrl = (url?: string) => {
    if (!url) return '';
    if (baseUrl && url.startsWith('/')) {
      return `${baseUrl.replace(/\/$/, '')}${url}`;
    }
    return url;
  };

  if (framework === 'playwright_ts') {
    if (usePOM) {
      // PAGE OBJECT MODEL: PLAYWRIGHT TS
      const methods: string[] = [];
      const testCalls: string[] = [];
      const selectorsDeclared: string[] = [];

      steps.forEach((step, idx) => {
        const selectorValue = getSelector(step.payload);
        const nameClean = step.payload.selectors?.testId || step.payload.selectors?.id || `element_${idx + 1}`;
        const camelName = toCamelCase(nameClean);

        switch (step.type) {
          case 'goto':
            methods.push(`  async navigate() {
    ${addComments ? '// Navigate to url\n    ' : ''}await this.page.goto('${resolvedUrl(step.payload.url)}');
  }`);
            testCalls.push(`  await testFlowPage.navigate();`);
            break;

          case 'click':
            selectorsDeclared.push(`  readonly ${camelName}Locator = this.page.locator('${selectorValue}');`);
            methods.push(`  async click${toPascalCase(nameClean)}() {
    ${addComments ? `// Click selector matching '${selectorValue}'\n    ` : ''}await this.${camelName}Locator.click();
  }`);
            testCalls.push(`  await testFlowPage.click${toPascalCase(nameClean)}();`);
            break;

          case 'type':
            selectorsDeclared.push(`  readonly ${camelName}Input = this.page.locator('${selectorValue}');`);
            methods.push(`  async fill${toPascalCase(nameClean)}(value: string) {
    ${addComments ? `// Type value into '${selectorValue}'\n    ` : ''}await this.${camelName}Input.fill(value);
  }`);
            testCalls.push(`  await testFlowPage.fill${toPascalCase(nameClean)}('${step.payload.value || ''}');`);
            break;

          case 'assert':
            selectorsDeclared.push(`  readonly ${camelName}Locator = this.page.locator('${selectorValue}');`);
            methods.push(`  async assert${toPascalCase(nameClean)}Visible() {
    ${addComments ? `// Assert element '${selectorValue}' is visible\n    ` : ''}await expect(this.${camelName}Locator).toBeVisible();
  }`);
            testCalls.push(`  await testFlowPage.assert${toPascalCase(nameClean)}Visible();`);
            break;

          case 'wait':
            methods.push(`  async waitAmount(ms: number) {
    await this.page.waitForTimeout(ms);
  }`);
            testCalls.push(`  await testFlowPage.waitAmount(${step.payload.timeout || 1000});`);
            break;

          case 'hover':
            selectorsDeclared.push(`  readonly ${camelName}Locator = this.page.locator('${selectorValue}');`);
            methods.push(`  async hoverOver${toPascalCase(nameClean)}() {
    await this.${camelName}Locator.hover();
  }`);
            testCalls.push(`  await testFlowPage.hoverOver${toPascalCase(nameClean)}();`);
            break;

          case 'scroll':
            methods.push(`  async scrollToCoordinates(x: number, y: number) {
    await this.page.evaluate(({ px, py }) => window.scrollTo(px, py), { px: x, py: y });
  }`);
            testCalls.push(`  await testFlowPage.scrollToCoordinates(0, 500);`);
            break;

          case 'api_request':
            const headersStr = step.payload.apiHeaders ? `, { headers: ${step.payload.apiHeaders.trim()} }` : '';
            methods.push(`  async triggerApiCall() {
    const response = await this.page.request.${(step.payload.apiMethod || 'GET').toLowerCase()}('${step.payload.apiUrl || ''}'${headersStr});
    expect(response.status()).toBe(${step.payload.apiExpectedStatus || 200});
  }`);
            testCalls.push(`  await testFlowPage.triggerApiCall();`);
            break;
        }
      });

      return `import { test, expect, Page } from '@playwright/test';

class TestFlowPage {
  readonly page: Page;
${selectorsDeclared.map(line => `  ${line.trim()}`).join('\n')}

  constructor(page: Page) {
    this.page = page;
  }

${methods.join('\n\n')}
}

test('Visual generated test with Page Object Model', async ({ page }) => {
  const testFlowPage = new TestFlowPage(page);
${testCalls.join('\n')}
});`;
    } else {
      // PROCEDURAL: PLAYWRIGHT TS
      const body = steps.map((step) => {
        const selectorValue = getSelector(step.payload);
        switch (step.type) {
          case 'goto':
            return `  ${addComments ? '// Navigate to targeted landing page\n  ' : ''}await page.goto('${resolvedUrl(step.payload.url)}');`;
          case 'click':
            return `  ${addComments ? `// Click visual element of pattern '${selectorValue}'\n  ` : ''}await page.click('${selectorValue}');`;
          case 'type':
            return `  ${addComments ? `// Fill keyboard value into element\n  ` : ''}await page.fill('${selectorValue}', '${step.payload.value || ''}');`;
          case 'assert':
            return `  ${addComments ? `// Expect target selector element to be visible\n  ` : ''}await expect(page.locator('${selectorValue}')).toBeVisible();`;
          case 'wait':
            return `  await page.waitForTimeout(${step.payload.timeout || 1000});`;
          case 'hover':
            return `  await page.locator('${selectorValue}').hover();`;
          case 'scroll':
            return `  await page.evaluate(() => window.scrollTo(0, 500));`;
          case 'api_request':
            const bodyStr = step.payload.apiBody ? `, data: ${step.payload.apiBody.trim()}` : '';
            const headersObj = step.payload.apiHeaders ? `, headers: ${step.payload.apiHeaders}` : '';
            return `  ${addComments ? `// API request asset assertion\n  ` : ''}const response = await page.request.${(step.payload.apiMethod || 'GET').toLowerCase()}('${step.payload.apiUrl || ''}'${bodyStr}${headersObj});\n  await expect(response.ok()).toBeTruthy();`;
          default:
            return '';
        }
      }).filter(Boolean).join('\n\n');

      return `import { test, expect } from '@playwright/test';

test('Visual generated procedural test', async ({ page }) => {
${body}
});`;
    }
  }

  // CYPRESS (JS)
  if (framework === 'cypress_js') {
    if (usePOM) {
      const selectorsDeclared: string[] = [];
      const methods: string[] = [];
      const suiteCalls: string[] = [];

      steps.forEach((step, idx) => {
        const selectorValue = getSelector(step.payload);
        const nameClean = step.payload.selectors?.testId || step.payload.selectors?.id || `element_${idx + 1}`;
        const camelName = toCamelCase(nameClean);

        switch (step.type) {
          case 'goto':
            methods.push(`  visit() {
    cy.visit('${resolvedUrl(step.payload.url)}');
    return this;
  }`);
            suiteCalls.push(`    testPage.visit();`);
            break;

          case 'click':
            methods.push(`  get${toPascalCase(nameClean)}() {
    return cy.get('${selectorValue}');
  }

  click${toPascalCase(nameClean)}() {
    this.get${toPascalCase(nameClean)}().click();
    return this;
  }`);
            suiteCalls.push(`    testPage.click${toPascalCase(nameClean)}();`);
            break;

          case 'type':
            methods.push(`  get${toPascalCase(nameClean)}Input() {
    return cy.get('${selectorValue}');
  }

  type${toPascalCase(nameClean)}(value) {
    this.get${toPascalCase(nameClean)}Input().clear().type(value);
    return this;
  }`);
            suiteCalls.push(`    testPage.type${toPascalCase(nameClean)}('${step.payload.value || ''}');`);
            break;

          case 'assert':
            methods.push(`  verify${toPascalCase(nameClean)}IsVisible() {
    cy.get('${selectorValue}').should('be.visible');
    return this;
  }`);
            suiteCalls.push(`    testPage.verify${toPascalCase(nameClean)}IsVisible();`);
            break;

          case 'wait':
            methods.push(`  waitAmount(ms) {
    cy.wait(ms);
    return this;
  }`);
            suiteCalls.push(`    testPage.waitAmount(${step.payload.timeout || 1000});`);
            break;

          case 'hover':
            methods.push(`  hover${toPascalCase(nameClean)}() {
    cy.get('${selectorValue}').trigger('mouseover');
    return this;
  }`);
            suiteCalls.push(`    testPage.hover${toPascalCase(nameClean)}();`);
            break;

          case 'scroll':
            methods.push(`  scrollToBottom() {
    cy.scrollTo('bottom');
    return this;
  }`);
            suiteCalls.push(`    testPage.scrollToBottom();`);
            break;

          case 'api_request':
            methods.push(`  triggerApiCall() {
    cy.request({
      method: '${step.payload.apiMethod || 'GET'}',
      url: '${step.payload.apiUrl || ''}',
      headers: ${step.payload.apiHeaders ? step.payload.apiHeaders.trim() : '{}'},
      body: ${step.payload.apiBody ? step.payload.apiBody.trim() : '{}'}
    }).then((response) => {
      expect(response.status).to.eq(${step.payload.apiExpectedStatus || 200});
    });
    return this;
  }`);
            suiteCalls.push(`    testPage.triggerApiCall();`);
            break;
        }
      });

      return `/// <reference types="cypress" />

class TestPage {
${methods.join('\n\n')}
}

describe('TestFlow AI Output Suite', () => {
  const testPage = new TestPage();

  it('Automated POM scenario run', () => {
${suiteCalls.join('\n')}
  });
});`;
    } else {
      // PROCEDURAL CYPRESS
      const body = steps.map((step) => {
        const selectorValue = getSelector(step.payload);
        switch (step.type) {
          case 'goto':
            return `    ${addComments ? '// Navigate web view\n    ' : ''}cy.visit('${resolvedUrl(step.payload.url)}');`;
          case 'click':
            return `    ${addComments ? `// Click identified selector\n    ` : ''}cy.get('${selectorValue}').click();`;
          case 'type':
            return `    ${addComments ? `// Enter simulated values\n    ` : ''}cy.get('${selectorValue}').clear().type('${step.payload.value || ''}');`;
          case 'assert':
            return `    ${addComments ? `// Assert element visual status\n    ` : ''}cy.get('${selectorValue}').should('be.visible');`;
          case 'wait':
            return `    cy.wait(${step.payload.timeout || 1000});`;
          case 'hover':
            return `    cy.get('${selectorValue}').trigger('mouseover');`;
          case 'scroll':
            return `    cy.scrollTo('bottom');`;
          case 'api_request':
            const bodyStr = step.payload.apiBody ? `, body: ${step.payload.apiBody.trim()}` : '';
            const headersStr = step.payload.apiHeaders ? `, headers: ${step.payload.apiHeaders.trim()}` : '';
            return `    cy.request({ method: '${step.payload.apiMethod || 'GET'}', url: '${step.payload.apiUrl || ''}'${headersStr}${bodyStr} }).its('status').should('eq', ${step.payload.apiExpectedStatus || 200});`;
          default:
            return '';
        }
      }).filter(Boolean).join('\n\n');

      return `/// <reference types="cypress" />

describe('Cypress automation visual script', () => {
  it('passes verification steps', () => {
${body}
  });
});`;
    }
  }

  // SELENIUM PYTHON
  if (framework === 'selenium_py') {
    if (usePOM) {
      const pageLocators: string[] = [];
      const methods: string[] = [];
      const testCalls: string[] = [];

      steps.forEach((step, idx) => {
        const selectorValue = getSelector(step.payload);
        const nameClean = step.payload.selectors?.testId || step.payload.selectors?.id || `element_${idx + 1}`;
        const nameUpper = nameClean.toUpperCase().replace(/[^a-zA-Z0-9]/g, '_');

        switch (step.type) {
          case 'goto':
            methods.push(`    def load(self):
        ${addComments ? '"""Open base testing URL"""\n        ' : ''}self.driver.get("${resolvedUrl(step.payload.url)}")`);
            testCalls.push(`    home_page.load()`);
            break;

          case 'click':
            pageLocators.push(`    ${nameUpper}_LOCATOR = (By.CSS_SELECTOR, "${selectorValue}")`);
            methods.push(`    def click_${nameClean.toLowerCase()}(self):
        ${addComments ? '"""Click target element"""\n        ' : ''}self.driver.find_element(*self.${nameUpper}_LOCATOR).click()`);
            testCalls.push(`    home_page.click_${nameClean.toLowerCase()}()`);
            break;

          case 'type':
            pageLocators.push(`    ${nameUpper}_INPUT = (By.CSS_SELECTOR, "${selectorValue}")`);
            methods.push(`    def type_in_${nameClean.toLowerCase()}(self, text):
        ${addComments ? '"""Erase and fill alphanumeric keys"""\n        ' : ''}element = self.driver.find_element(*self.${nameUpper}_INPUT)
        element.clear()
        element.send_keys(text)`);
            testCalls.push(`    home_page.type_in_${nameClean.toLowerCase()}("${step.payload.value || ''}")`);
            break;

          case 'assert':
            pageLocators.push(`    ${nameUpper}_ELEMENT = (By.CSS_SELECTOR, "${selectorValue}")`);
            methods.push(`    def is_${nameClean.toLowerCase()}_visible(self):
        ${addComments ? '"""Verify component visibility"""\n        ' : ''}return self.driver.find_element(*self.${nameUpper}_ELEMENT).is_displayed()`);
            testCalls.push(`    assert home_page.is_${nameClean.toLowerCase()}_visible() == True`);
            break;

          case 'wait':
            methods.push(`    def wait_duration(self, seconds):
        time.sleep(seconds)`);
            testCalls.push(`    home_page.wait_duration(${Math.max(1, (step.payload.timeout || 1000) / 1000)})`);
            break;

          case 'hover':
            pageLocators.push(`    ${nameUpper}_HOVER = (By.CSS_SELECTOR, "${selectorValue}")`);
            methods.push(`    def hover_on_${nameClean.toLowerCase()}(self):
        actions = ActionChains(self.driver)
        element = self.driver.find_element(*self.${nameUpper}_HOVER)
        actions.move_to_element(element).perform()`);
            testCalls.push(`    home_page.hover_on_${nameClean.toLowerCase()}()`);
            break;

          case 'scroll':
            methods.push(`    def scroll_page(self):
        self.driver.execute_script("window.scrollTo(0, 500);")`);
            testCalls.push(`    home_page.scroll_page()`);
            break;

          case 'api_request':
            methods.push(`    def check_rest_api(self):
        res = requests.${(step.payload.apiMethod || 'GET').toLowerCase()}("${step.payload.apiUrl || ''}")
        assert res.status_code == ${step.payload.apiExpectedStatus || 200}`);
            testCalls.push(`    home_page.check_rest_api()`);
            break;
        }
      });

      return `import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
import requests

class TargetFlowPage:
${pageLocators.join('\n')}

    def __init__(self, driver):
        self.driver = driver

${methods.join('\n\n')}

def test_workflow():
    options = webdriver.ChromeOptions()
    if ${headless ? 'True' : 'False'}:
        options.add_argument("--headless")
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(10)
    
    try:
        home_page = TargetFlowPage(driver)
${testCalls.join('\n')}
    finally:
        driver.quit()`;
    } else {
      // PROCEDURAL SELENIUM PYTHON
      const body = steps.map((step) => {
        const selectorValue = getSelector(step.payload);
        switch (step.type) {
          case 'goto':
            return `        driver.get("${resolvedUrl(step.payload.url)}")`;
          case 'click':
            return `        driver.find_element(By.CSS_SELECTOR, "${selectorValue}").click()`;
          case 'type':
            return `        input_field = driver.find_element(By.CSS_SELECTOR, "${selectorValue}")\n        input_field.clear()\n        input_field.send_keys("${step.payload.value || ''}")`;
          case 'assert':
            return `        assert driver.find_element(By.CSS_SELECTOR, "${selectorValue}").is_displayed() == True`;
          case 'wait':
            return `        time.sleep(${(step.payload.timeout || 1000) / 1000})`;
          case 'hover':
            return `        element = driver.find_element(By.CSS_SELECTOR, "${selectorValue}")\n        ActionChains(driver).move_to_element(element).perform()`;
          case 'scroll':
            return `        driver.execute_script("window.scrollTo(0, 500);")`;
          case 'api_request':
            const bodyArg = step.payload.apiBody ? `, json=${step.payload.apiBody}` : '';
            return `        response = requests.${(step.payload.apiMethod || 'GET').toLowerCase()}("${step.payload.apiUrl || ''}"${bodyArg})\n        assert response.status_code == ${step.payload.apiExpectedStatus || 200}`;
          default:
            return '';
        }
      }).filter(Boolean).join('\n\n');

      return `import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
import requests

def test_automation_script():
    options = webdriver.ChromeOptions()
    if ${headless ? 'True' : 'False'}:
        options.add_argument("--headless")
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(10)
    
    try:
${body}
    finally:
        driver.quit()`;
    }
  }

  // PUPPETEER (JS)
  if (framework === 'puppeteer_js') {
    const body = steps.map((step) => {
      const selectorValue = getSelector(step.payload);
      switch (step.type) {
        case 'goto':
          return `    await page.goto('${resolvedUrl(step.payload.url)}', { waitUntil: 'networkidle2' });`;
        case 'click':
          return `    await page.waitForSelector('${selectorValue}');\n    await page.click('${selectorValue}');`;
        case 'type':
          return `    await page.waitForSelector('${selectorValue}');\n    await page.click('${selectorValue}', { clickCount: 3 });\n    await page.type('${selectorValue}', '${step.payload.value || ''}');`;
        case 'assert':
          return `    await page.waitForSelector('${selectorValue}', { visible: true });\n    const isVisible_${step.id} = await page.evaluate((sel) => {\n      const el = document.querySelector(sel);\n      return el && el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().width > 0;\n    }, '${selectorValue}');\n    if (!isVisible_${step.id}) throw new Error('Assertion failed for element: ' + '${selectorValue}');`;
        case 'wait':
          return `    await new Promise(r => setTimeout(r, ${step.payload.timeout || 1000}));`;
        case 'hover':
          return `    await page.waitForSelector('${selectorValue}');\n    await page.hover('${selectorValue}');`;
        case 'scroll':
          return `    await page.evaluate(() => window.scrollBy(0, 500));`;
        case 'api_request':
          return `    // REST API check step using standard fetch\n    const apiResult_${step.id} = await page.evaluate(async (url, method, body, headers) => {\n      const res = await fetch(url, { method, body: body || undefined, headers: headers ? JSON.parse(headers) : undefined });\n      return res.status;\n    }, '${step.payload.apiUrl || ''}', '${step.payload.apiMethod || 'GET'}', ${step.payload.apiBody ? `'${step.payload.apiBody.trim()}'` : 'null'}, '${step.payload.apiHeaders || ''}');\n    if (apiResult_${step.id} !== ${step.payload.apiExpectedStatus || 200}) throw new Error('API failed with ' + apiResult_${step.id});`;
        default:
          return '';
      }
    }).filter(Boolean).join('\n\n');

    return `const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: ${headless ? 'true' : 'false'} });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
${body}
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test execution failed:', error.message);
  } finally {
    await browser.close();
  }
})();`;
  }

  return `// Unknown framework: ${framework}`;
}
