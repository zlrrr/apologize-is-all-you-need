#!/usr/bin/env node

/**
 * Gemini API Key Tester
 *
 * This script tests if a Gemini API key is valid and working.
 *
 * Usage:
 *   node test-gemini-api.js [api-key]
 *
 * If no API key is provided, it will read from GEMINI_API_KEY env variable.
 */

const https = require('https');

// Get API key from command line or environment
const apiKey = process.argv[2] || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: No API key provided');
  console.error('Usage: node test-gemini-api.js [api-key]');
  console.error('Or set GEMINI_API_KEY environment variable');
  process.exit(1);
}

// Mask API key for display (show first 10 and last 4 characters)
function maskApiKey(key) {
  if (key.length <= 14) return '***';
  return key.substring(0, 10) + '...' + key.substring(key.length - 4);
}

console.log('='.repeat(60));
console.log('Gemini API Key Tester');
console.log('='.repeat(60));
console.log(`API Key: ${maskApiKey(apiKey)}`);
console.log(`Time: ${new Date().toISOString()}`);
console.log('='.repeat(60));
console.log('');

// Test 1: List models endpoint
async function testListModels() {
  console.log('Test 1: List Available Models');
  console.log('-'.repeat(60));

  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);

          if (res.statusCode === 200) {
            console.log('✓ Success: API key is valid');
            console.log(`  Found ${json.models?.length || 0} models`);

            if (json.models && json.models.length > 0) {
              console.log('\n  Available models:');
              json.models.slice(0, 5).forEach(model => {
                console.log(`    - ${model.name}`);
                console.log(`      Display: ${model.displayName || 'N/A'}`);
              });
              if (json.models.length > 5) {
                console.log(`    ... and ${json.models.length - 5} more`);
              }
            }

            resolve({ success: true, models: json.models });
          } else {
            console.log(`✗ Failed: HTTP ${res.statusCode}`);
            console.log(`  Error: ${json.error?.message || 'Unknown error'}`);
            resolve({ success: false, error: json.error });
          }
        } catch (e) {
          console.log('✗ Failed: Invalid JSON response');
          console.log(`  Response: ${data.substring(0, 200)}`);
          resolve({ success: false, error: 'Invalid JSON' });
        }
      });
    }).on('error', (error) => {
      console.log('✗ Failed: Network error');
      console.log(`  Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
  });
}

// Test 2: Generate content (actual API call)
async function testGenerateContent() {
  console.log('\nTest 2: Generate Content (Chat Completion)');
  console.log('-'.repeat(60));

  return new Promise((resolve, reject) => {
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestData = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Say "Hello, API test successful!" in one sentence.'
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 50
      }
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    const startTime = Date.now();
    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;

        try {
          const json = JSON.parse(data);

          if (res.statusCode === 200) {
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const tokens = json.usageMetadata?.totalTokenCount || 0;

            console.log('✓ Success: Content generated');
            console.log(`  Response time: ${duration}ms`);
            console.log(`  Tokens used: ${tokens}`);
            console.log(`  Response: "${text.trim()}"`);

            resolve({ success: true, text, duration, tokens });
          } else {
            console.log(`✗ Failed: HTTP ${res.statusCode}`);
            console.log(`  Error: ${json.error?.message || 'Unknown error'}`);

            if (json.error?.status === 'PERMISSION_DENIED') {
              console.log('\n  Possible issues:');
              console.log('    - API key may not have permission for this API');
              console.log('    - Generative Language API may not be enabled');
              console.log('    - Check: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
            }

            resolve({ success: false, error: json.error });
          }
        } catch (e) {
          console.log('✗ Failed: Invalid JSON response');
          console.log(`  Response: ${data.substring(0, 200)}`);
          resolve({ success: false, error: 'Invalid JSON' });
        }
      });
    });

    req.on('error', (error) => {
      console.log('✗ Failed: Network error');
      console.log(`  Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.write(requestData);
    req.end();
  });
}

// Test 3: Rate limit check
async function testRateLimit() {
  console.log('\nTest 3: Rate Limit Check');
  console.log('-'.repeat(60));

  console.log('Making 3 rapid requests to check rate limiting...');

  const results = [];
  for (let i = 0; i < 3; i++) {
    const result = await testQuickRequest(i + 1);
    results.push(result);
    await sleep(100); // Small delay between requests
  }

  const successful = results.filter(r => r.success).length;
  console.log(`\n  Results: ${successful}/3 requests successful`);

  if (successful === 3) {
    console.log('  ✓ No rate limiting issues detected');
  } else {
    console.log('  ⚠ Some requests failed - may be hitting rate limits');
  }

  return { success: successful > 0, successful, total: 3 };
}

function testQuickRequest(num) {
  return new Promise((resolve) => {
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestData = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `Test ${num}` }] }],
      generationConfig: { maxOutputTokens: 10 }
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    const startTime = Date.now();
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - startTime;
        const success = res.statusCode === 200;
        console.log(`  Request ${num}: ${success ? '✓' : '✗'} (${duration}ms, HTTP ${res.statusCode})`);
        resolve({ success, duration });
      });
    });

    req.on('error', () => {
      console.log(`  Request ${num}: ✗ Network error`);
      resolve({ success: false });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`  Request ${num}: ✗ Timeout`);
      resolve({ success: false });
    });

    req.write(requestData);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main test runner
async function runTests() {
  try {
    const results = {
      listModels: await testListModels(),
      generateContent: await testGenerateContent(),
      rateLimit: await testRateLimit()
    };

    // Summary
    console.log('\n');
    console.log('='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));

    const allPassed = results.listModels.success &&
                     results.generateContent.success &&
                     results.rateLimit.success;

    console.log(`List Models:      ${results.listModels.success ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Generate Content: ${results.generateContent.success ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Rate Limit:       ${results.rateLimit.success ? '✓ PASS' : '✗ FAIL'}`);
    console.log('');
    console.log(`Overall: ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
    console.log('='.repeat(60));

    if (allPassed) {
      console.log('\n✓ Your Gemini API key is working correctly!');
      console.log('  You can use it in your Render environment variables.');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Add to Render: GEMINI_API_KEY=' + maskApiKey(apiKey));
      console.log('  2. Set: LLM_PROVIDER=gemini');
      console.log('  3. Set: GEMINI_MODEL=gemini-1.5-flash');
      console.log('  4. Deploy and test your application');
    } else {
      console.log('\n⚠ Some tests failed. Please check:');
      console.log('  1. API key is correct and not expired');
      console.log('  2. Generative Language API is enabled in Google Cloud');
      console.log('  3. Your account has not exceeded quota limits');
      console.log('  4. Visit: https://aistudio.google.com/app/apikey');
    }

    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('\nFatal error:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
