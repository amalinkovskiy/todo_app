#!/usr/bin/env node
/**
 * verify-test-coverage.js
 *
 * Purpose:
 *  Ensures every Scenario defined in feature markdown files under features/ has a matching executed test
 *  present in the Playwright JSON results report (playwright-report/results.json).
 *
 * Feature File Format Assumptions:
 *  - Scenarios start with a markdown heading line beginning with '## Scenario:'
 *  - The next lines include:
 *      Test file: `relative/path/to/test.file`
 *      Test name: `Exact test title as appears in Playwright report`
 *  - Backticks around file and test name are optional but recommended.
 *
 * Matching Logic:
 *  - Loads the JSON report and constructs a Set of test titles (spec titles) per file.
 *  - For each feature scenario, verifies the tuple (testFile, testName) exists.
 *
 * Exit Codes:
 *  - 0: All scenarios are covered.
 *  - 1: Any scenario missing mapping data or missing executed test.
 */

const fs = require('fs');
const path = require('path');

const FEATURES_DIR = path.resolve(__dirname, '..', 'features');
const REPORT_PATH = path.resolve(__dirname, '..', 'playwright-report', 'results.json');

function loadReportTests() {
  if (!fs.existsSync(REPORT_PATH)) {
    console.error(`Playwright report not found at ${REPORT_PATH}. Run tests first.`);
    process.exit(1);
  }
  const json = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
  const mapping = new Map(); // file -> Set(test titles)

  function walkSuites(suites) {
    if (!Array.isArray(suites)) return;
    for (const suite of suites) {
      if (suite.specs && suite.specs.length) {
        for (const spec of suite.specs) {
          const file = suite.file || spec.file; // relative path as reported
          const keyFile = normalizeTestFile(file);
          if (!mapping.has(keyFile)) mapping.set(keyFile, new Set());
          mapping.get(keyFile).add(spec.title.trim());
        }
      }
      if (suite.suites && suite.suites.length) walkSuites(suite.suites);
    }
  }

  walkSuites(json.suites);
  return mapping;
}

function normalizeTestFile(file) {
  // Ensure forward slashes and remove leading ./ or tests/ if necessary normalization in feature files.
  return file.replace(/\\\\/g, '/').replace(/^[.]/, '').replace(/^\/*/, '');
}

function parseFeatureFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const scenarios = [];
  let currentScenario = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('## Scenario:')) {
      if (currentScenario) scenarios.push(currentScenario);
      currentScenario = { title: line.replace('## Scenario:', '').trim(), testFile: null, testName: null, filePath };
    } else if (line.toLowerCase().startsWith('test file:')) {
      const m = line.match(/test file:\s*`?([^`]+)`?/i);
      if (m && currentScenario) currentScenario.testFile = m[1].trim();
    } else if (line.toLowerCase().startsWith('test name:')) {
      const m = line.match(/test name:\s*`?([^`]+)`?/i);
      if (m && currentScenario) currentScenario.testName = m[1].trim();
    }
  }
  if (currentScenario) scenarios.push(currentScenario);
  return scenarios;
}

function main() {
  if (!fs.existsSync(FEATURES_DIR)) {
    console.error('No features directory found.');
    process.exit(1);
  }

  const testMapping = loadReportTests();

  const featureFiles = fs.readdirSync(FEATURES_DIR).filter(f => f.endsWith('.md'));
  let failures = 0;
  const results = [];

  for (const file of featureFiles) {
    const abs = path.join(FEATURES_DIR, file);
    const scenarios = parseFeatureFile(abs);
    for (const sc of scenarios) {
      if (!sc.testFile || !sc.testName) {
        failures++;
        results.push({ featureFile: file, scenario: sc.title, status: 'missing-metadata', message: 'Test file or name missing' });
        continue;
      }
  // Normalize provided test file path. Accept forms like:
  //  - tests/api/todos-production.spec.js
  //  - api/todos-production.spec.js
  //  - ./tests/api/todos-production.spec.js
  // Report uses relative path like 'api/todos-production.spec.js'
  let provided = sc.testFile.trim().replace(/^\.\//, '');
  // Strip leading 'tests/' if present
  provided = provided.replace(/^tests\//, '');
  // Collapse any duplicate 'api/' prefixes
  provided = provided.replace(/^(api\/)+/, 'api/');
  const normalized = normalizeTestFile(provided);
      const testFileSet = testMapping.get(normalized);
      if (!testFileSet) {
        failures++;
        results.push({ featureFile: file, scenario: sc.title, status: 'file-not-found', message: `Test file ${normalized} not present in report` });
        continue;
      }
      if (!testFileSet.has(sc.testName)) {
        failures++;
        results.push({ featureFile: file, scenario: sc.title, status: 'test-not-found', message: `Test name '${sc.testName}' not executed` });
        continue;
      }
      results.push({ featureFile: file, scenario: sc.title, status: 'ok' });
    }
  }

  // Output summary
  const okCount = results.filter(r => r.status === 'ok').length;
  console.log('Living Requirements Verification Report');
  console.log('======================================');
  for (const r of results) {
    if (r.status === 'ok') {
      console.log(`✔ ${r.featureFile} :: ${r.scenario}`);
    } else {
      console.log(`✖ ${r.featureFile} :: ${r.scenario} -> ${r.status} (${r.message})`);
    }
  }
  console.log('======================================');
  console.log(`Scenarios: ${results.length}, Passed: ${okCount}, Failed: ${failures}`);

  if (failures > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
