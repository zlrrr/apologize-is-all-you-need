#!/usr/bin/env node

/**
 * API Connection Diagnostic Tool
 *
 * This script tests the connection to the backend API and LLM service.
 * Run it locally or on Render to diagnose configuration issues.
 *
 * Usage:
 *   node test-api-connection.js [base-url]
 *
 * Examples:
 *   node test-api-connection.js
 *   node test-api-connection.js https://apologize-is-all-you-need.onrender.com
 */

const https = require('https');
const http = require('http');

// Get base URL from command line or use default
const baseUrl = process.argv[2] || 'http://localhost:5001';
const isHttps = baseUrl.startsWith('https');
const httpClient = isHttps ? https : http;

console.log('='.repeat(60));
console.log('API Connection Diagnostic Tool');
console.log('='.repeat(60));
console.log(`Target: ${baseUrl}`);
console.log(`Time: ${new Date().toISOString()}`);
console.log('='.repeat(60));
console.log('');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printStatus(label, status, message = '') {
  const symbols = {
    success: colorize('✓', 'green'),
    error: colorize('✗', 'red'),
    warning: colorize('⚠', 'yellow'),
    info: colorize('ℹ', 'blue'),
  };

  console.log(`${symbols[status]} ${label}`);
  if (message) {
    console.log(`  ${colorize(message, 'gray')}`);
  }
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);

    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'API-Diagnostic-Tool/1.0',
      },
    };

    const req = httpClient.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: true,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout (10s)'));
    });

    req.end();
  });
}

async function testEndpoint(name, path, expectedStatus = 200) {
  console.log('');
  console.log(colorize(`Testing: ${name}`, 'blue'));
  console.log(colorize(`Path: ${path}`, 'gray'));
  console.log('-'.repeat(60));

  try {
    const result = await makeRequest(path);

    // Check status code
    if (result.status === expectedStatus) {
      printStatus('HTTP Status', 'success', `${result.status} OK`);
    } else {
      printStatus('HTTP Status', 'warning', `${result.status} (expected ${expectedStatus})`);
    }

    // Check response data
    if (result.parseError) {
      printStatus('Response', 'error', 'Failed to parse JSON');
      console.log(colorize('  Raw response:', 'gray'));
      console.log(colorize(`  ${result.data}`, 'gray'));
    } else {
      printStatus('Response', 'success', 'Valid JSON');

      // Pretty print JSON
      console.log(colorize('  Data:', 'gray'));
      const jsonStr = JSON.stringify(result.data, null, 2);
      jsonStr.split('\n').forEach(line => {
        console.log(colorize(`    ${line}`, 'gray'));
      });

      // Return data for further analysis
      return result.data;
    }
  } catch (error) {
    printStatus('Connection', 'error', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log(colorize('  Suggestion: The server is not running or not accessible', 'yellow'));
    } else if (error.code === 'ENOTFOUND') {
      console.log(colorize('  Suggestion: Invalid hostname or DNS resolution failed', 'yellow'));
    } else if (error.message.includes('timeout')) {
      console.log(colorize('  Suggestion: Server is not responding within 10 seconds', 'yellow'));
    }

    return null;
  }
}

async function analyzeHealth(healthData) {
  console.log('');
  console.log(colorize('Health Analysis', 'blue'));
  console.log('-'.repeat(60));

  if (!healthData) {
    printStatus('Analysis', 'error', 'No health data available');
    return;
  }

  // Check API status
  if (healthData.services?.api === 'healthy') {
    printStatus('Backend API', 'success', 'Running normally');
  } else {
    printStatus('Backend API', 'error', 'Not healthy');
  }

  // Check LLM status
  if (healthData.services?.llm === 'healthy') {
    printStatus('LLM Service', 'success', 'Connected and ready');
  } else if (healthData.services?.llm === 'unavailable') {
    printStatus('LLM Service', 'error', 'Not available');

    // Check configuration
    if (healthData.config?.configured === false) {
      console.log(colorize('  Issue: LLM provider not configured', 'yellow'));
      console.log(colorize('  Provider: ' + (healthData.config?.provider || 'unknown'), 'gray'));
      console.log(colorize('  BaseURL: ' + (healthData.config?.baseURL || 'not set'), 'gray'));
    }

    // Show suggestions if available
    if (healthData.diagnostics?.suggestions) {
      console.log(colorize('  Suggestions:', 'yellow'));
      healthData.diagnostics.suggestions.forEach(suggestion => {
        console.log(colorize(`    - ${suggestion}`, 'gray'));
      });
    }
  } else {
    printStatus('LLM Service', 'warning', 'Degraded');
  }

  // Show configuration
  console.log('');
  console.log(colorize('Configuration:', 'blue'));
  console.log(colorize(`  Provider: ${healthData.config?.provider || 'unknown'}`, 'gray'));
  console.log(colorize(`  Model: ${healthData.config?.model || 'unknown'}`, 'gray'));
  console.log(colorize(`  BaseURL: ${healthData.config?.baseURL || 'not set'}`, 'gray'));
  console.log(colorize(`  Configured: ${healthData.config?.configured ? 'Yes' : 'No'}`, 'gray'));

  // Show uptime
  if (healthData.uptime) {
    const uptime = Math.floor(healthData.uptime);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    console.log(colorize(`  Uptime: ${hours}h ${minutes}m ${seconds}s`, 'gray'));
  }
}

async function main() {
  try {
    // Test 1: Root endpoint
    await testEndpoint('Root Endpoint', '/');

    // Test 2: Basic health check
    const healthData = await testEndpoint('Health Check', '/api/health', 200);

    // Test 3: LLM health check
    await testEndpoint('LLM Health Check', '/api/health/llm', [200, 503]);

    // Test 4: Auth status
    await testEndpoint('Auth Status', '/api/auth/status', 200);

    // Analyze health data
    await analyzeHealth(healthData);

    // Summary
    console.log('');
    console.log('='.repeat(60));
    console.log(colorize('Diagnostic Complete', 'green'));
    console.log('='.repeat(60));

    // Environment check
    console.log('');
    console.log(colorize('Environment Variables to Check:', 'blue'));
    console.log(colorize('  Required:', 'yellow'));
    console.log(colorize('    - LLM_PROVIDER (openai, anthropic, gemini, custom)', 'gray'));
    console.log(colorize('    - GEMINI_API_KEY (if using gemini)', 'gray'));
    console.log(colorize('    - OPENAI_API_KEY (if using openai)', 'gray'));
    console.log(colorize('    - ANTHROPIC_API_KEY (if using anthropic)', 'gray'));
    console.log(colorize('  Optional:', 'yellow'));
    console.log(colorize('    - LLM_TEMPERATURE (default: 0.7)', 'gray'));
    console.log(colorize('    - LLM_MAX_TOKENS (default: 500)', 'gray'));
    console.log('');

  } catch (error) {
    console.error(colorize('Fatal Error:', 'red'), error);
    process.exit(1);
  }
}

// Run the diagnostic
main();
