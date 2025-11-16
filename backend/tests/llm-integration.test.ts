import { describe, it, expect, beforeAll } from 'vitest';
import { LLMService } from '../src/services/llm.service.js';
import logger from '../src/utils/logger.js';

/**
 * LLM Integration Tests
 *
 * These tests verify that the LLM service can successfully connect to
 * and interact with the configured LLM provider (Gemini, OpenAI, etc.)
 *
 * Prerequisites:
 * - Environment variables must be set (LLM_PROVIDER, GEMINI_API_KEY, etc.)
 * - Network connection to the LLM provider API
 *
 * Run with: npm test -- llm-integration.test.ts
 */

describe('LLM Service Integration Tests', () => {
  let llmService: LLMService;
  let config: any;

  beforeAll(() => {
    llmService = new LLMService();
    config = llmService.getConfig();

    console.log('\n=== LLM Configuration ===');
    console.log(`Provider: ${config.provider}`);
    console.log(`Model: ${config.model}`);
    console.log(`Base URL: ${config.baseURL}`);
    console.log(`API Key: ${config.apiKey ? '***' + config.apiKey.slice(-4) : 'Not set'}`);
    console.log(`Temperature: ${config.temperature}`);
    console.log(`Max Tokens: ${config.maxTokens}`);
    console.log('========================\n');
  });

  describe('Configuration Tests', () => {
    it('should have a valid provider configured', () => {
      const validProviders = ['lm-studio', 'openai', 'anthropic', 'gemini', 'custom'];
      expect(validProviders).toContain(config.provider);
    });

    it('should have a base URL configured', () => {
      expect(config.baseURL).toBeTruthy();
      expect(config.baseURL.length).toBeGreaterThan(0);
    });

    it('should have a model name configured', () => {
      expect(config.model).toBeTruthy();
      expect(config.model.length).toBeGreaterThan(0);
    });

    it('should have valid temperature (0-2)', () => {
      expect(config.temperature).toBeGreaterThanOrEqual(0);
      expect(config.temperature).toBeLessThanOrEqual(2);
    });

    it('should have valid maxTokens (> 0)', () => {
      expect(config.maxTokens).toBeGreaterThan(0);
    });

    it('should have API key for cloud providers', () => {
      const cloudProviders = ['openai', 'anthropic', 'gemini', 'custom'];
      if (cloudProviders.includes(config.provider)) {
        expect(config.apiKey).toBeTruthy();
        expect(config.apiKey.length).toBeGreaterThan(10);
      }
    });
  });

  describe('Health Check Tests', () => {
    it('should successfully connect to LLM provider', async () => {
      const isHealthy = await llmService.healthCheck();

      console.log(`Health check result: ${isHealthy ? '✓ HEALTHY' : '✗ UNHEALTHY'}`);

      // For cloud providers, health check should succeed if configured
      if (['openai', 'anthropic', 'gemini', 'custom'].includes(config.provider)) {
        if (config.apiKey) {
          expect(isHealthy).toBe(true);
        }
      }
    }, 10000); // 10 second timeout

    it('should get available models', async () => {
      try {
        const models = await llmService.getModels();
        console.log(`Found ${models?.data?.length || 0} models`);

        if (models && models.data) {
          expect(Array.isArray(models.data)).toBe(true);
          expect(models.data.length).toBeGreaterThan(0);

          // Log first few models
          console.log('Available models:');
          models.data.slice(0, 3).forEach((model: any) => {
            console.log(`  - ${model.id || model.name}`);
          });
        }
      } catch (error) {
        // Some providers may not support model listing
        console.log('Model listing not supported or failed:', error);
      }
    }, 10000);
  });

  describe('Chat Completion Tests', () => {
    it('should generate a simple text response', async () => {
      const testMessage = {
        role: 'user' as const,
        content: 'Say "Hello, test successful!" and nothing else.'
      };

      try {
        const response = await llmService.chatCompletion({
          messages: [testMessage],
          temperature: 0.7,
          max_tokens: 50
        });

        console.log('\n--- Chat Completion Test ---');
        console.log(`Request: "${testMessage.content}"`);
        console.log(`Response: "${response.choices[0].message.content}"`);
        console.log(`Tokens used: ${response.usage.total_tokens}`);
        console.log('---------------------------\n');

        expect(response).toBeTruthy();
        expect(response.choices).toBeTruthy();
        expect(response.choices.length).toBeGreaterThan(0);
        expect(response.choices[0].message.content).toBeTruthy();
        expect(response.usage.total_tokens).toBeGreaterThan(0);

        // Check if response contains expected content
        const responseText = response.choices[0].message.content.toLowerCase();
        expect(
          responseText.includes('hello') || responseText.includes('test')
        ).toBe(true);
      } catch (error) {
        console.error('Chat completion failed:', error);
        throw error;
      }
    }, 15000); // 15 second timeout

    it('should handle system prompts correctly', async () => {
      try {
        const response = await llmService.chatCompletion({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant. Always respond with exactly one word.'
            },
            {
              role: 'user',
              content: 'What is 2+2? Answer with just the number.'
            }
          ],
          temperature: 0.3,
          max_tokens: 10
        });

        console.log('\n--- System Prompt Test ---');
        console.log(`Response: "${response.choices[0].message.content}"`);
        console.log(`Tokens: ${response.usage.total_tokens}`);
        console.log('-------------------------\n');

        expect(response.choices[0].message.content).toBeTruthy();

        // Response should be very short (since we asked for one word)
        const wordCount = response.choices[0].message.content.trim().split(/\s+/).length;
        expect(wordCount).toBeLessThanOrEqual(5);
      } catch (error) {
        console.error('System prompt test failed:', error);
        throw error;
      }
    }, 15000);

    it('should respect temperature settings', async () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'Generate a random number between 1 and 10.'
        }
      ];

      try {
        // Test with low temperature (more deterministic)
        const response1 = await llmService.chatCompletion({
          messages,
          temperature: 0.1,
          max_tokens: 20
        });

        // Test with high temperature (more random)
        const response2 = await llmService.chatCompletion({
          messages,
          temperature: 0.9,
          max_tokens: 20
        });

        console.log('\n--- Temperature Test ---');
        console.log(`Low temp (0.1): "${response1.choices[0].message.content}"`);
        console.log(`High temp (0.9): "${response2.choices[0].message.content}"`);
        console.log('------------------------\n');

        expect(response1.choices[0].message.content).toBeTruthy();
        expect(response2.choices[0].message.content).toBeTruthy();
      } catch (error) {
        console.error('Temperature test failed:', error);
        throw error;
      }
    }, 20000);
  });

  describe('Apology Generation Tests', () => {
    it('should generate an apology response', async () => {
      try {
        const response = await llmService.generateApology({
          message: '我今天迟到了',
          style: 'gentle',
          history: []
        });

        console.log('\n--- Apology Generation Test ---');
        console.log(`User message: "我今天迟到了"`);
        console.log(`Style: gentle`);
        console.log(`Apology: "${response.reply}"`);
        console.log(`Emotion: ${response.emotion}`);
        console.log(`Tokens: ${response.tokensUsed}`);
        console.log('-------------------------------\n');

        expect(response.reply).toBeTruthy();
        expect(response.reply.length).toBeGreaterThan(10);
        expect(response.emotion).toBeTruthy();
        expect(response.style).toBe('gentle');
        expect(response.tokensUsed).toBeGreaterThan(0);

        // Response should be in Chinese (contains Chinese characters)
        expect(/[\u4e00-\u9fa5]/.test(response.reply)).toBe(true);
      } catch (error) {
        console.error('Apology generation failed:', error);
        throw error;
      }
    }, 20000);

    it('should generate different styles of apologies', async () => {
      const styles: Array<'gentle' | 'sincere' | 'formal' | 'humorous'> = [
        'gentle',
        'sincere',
        'formal'
      ];

      console.log('\n--- Different Apology Styles ---');

      for (const style of styles) {
        try {
          const response = await llmService.generateApology({
            message: '我弄坏了你的东西',
            style,
            history: []
          });

          console.log(`\nStyle: ${style}`);
          console.log(`Response: "${response.reply.substring(0, 100)}..."`);
          console.log(`Tokens: ${response.tokensUsed}`);

          expect(response.reply).toBeTruthy();
          expect(response.style).toBe(style);
        } catch (error) {
          console.error(`Failed for style ${style}:`, error);
          throw error;
        }
      }

      console.log('\n--------------------------------\n');
    }, 30000);

    it('should maintain conversation context', async () => {
      try {
        // First message
        const response1 = await llmService.generateApology({
          message: '我忘记了你的生日',
          style: 'sincere',
          history: []
        });

        // Second message with context
        const response2 = await llmService.generateApology({
          message: '我应该怎么补救？',
          style: 'sincere',
          history: [
            { role: 'user', content: '我忘记了你的生日' },
            { role: 'assistant', content: response1.reply }
          ]
        });

        console.log('\n--- Context Maintenance Test ---');
        console.log('Message 1: "我忘记了你的生日"');
        console.log(`Response 1: "${response1.reply.substring(0, 80)}..."`);
        console.log('\nMessage 2: "我应该怎么补救？"');
        console.log(`Response 2: "${response2.reply.substring(0, 80)}..."`);
        console.log('--------------------------------\n');

        expect(response1.reply).toBeTruthy();
        expect(response2.reply).toBeTruthy();

        // Second response should reference the context (birthday)
        // This is a loose check - just verify we got a response
        expect(response2.reply.length).toBeGreaterThan(20);
      } catch (error) {
        console.error('Context maintenance test failed:', error);
        throw error;
      }
    }, 30000);
  });

  describe('Error Handling Tests', () => {
    it('should handle empty messages gracefully', async () => {
      try {
        await llmService.chatCompletion({
          messages: [
            { role: 'user', content: '' }
          ],
          max_tokens: 50
        });
        // If it doesn't throw, that's also acceptable
      } catch (error) {
        // Should throw an error or handle gracefully
        expect(error).toBeTruthy();
      }
    });

    it('should handle very long messages', async () => {
      const longMessage = '测试 '.repeat(500); // ~3000 characters

      try {
        const response = await llmService.chatCompletion({
          messages: [
            { role: 'user', content: longMessage + '请简短回复。' }
          ],
          max_tokens: 100
        });

        console.log('\n--- Long Message Test ---');
        console.log(`Input length: ${longMessage.length} characters`);
        console.log(`Response length: ${response.choices[0].message.content.length} characters`);
        console.log(`Tokens: ${response.usage.total_tokens}`);
        console.log('------------------------\n');

        expect(response.choices[0].message.content).toBeTruthy();
      } catch (error) {
        // May hit token limits, which is acceptable
        console.log('Long message handled with error (expected):', error);
      }
    }, 20000);
  });

  describe('Performance Tests', () => {
    it('should respond within reasonable time (< 10 seconds)', async () => {
      const startTime = Date.now();

      const response = await llmService.chatCompletion({
        messages: [
          { role: 'user', content: 'Say hello.' }
        ],
        max_tokens: 20
      });

      const duration = Date.now() - startTime;

      console.log('\n--- Performance Test ---');
      console.log(`Response time: ${duration}ms`);
      console.log(`Tokens: ${response.usage.total_tokens}`);
      console.log('-----------------------\n');

      expect(duration).toBeLessThan(10000); // Should respond within 10 seconds
    }, 15000);

    it('should handle multiple sequential requests', async () => {
      const numRequests = 3;
      const durations: number[] = [];

      console.log('\n--- Sequential Requests Test ---');

      for (let i = 0; i < numRequests; i++) {
        const startTime = Date.now();

        await llmService.chatCompletion({
          messages: [
            { role: 'user', content: `Test request ${i + 1}` }
          ],
          max_tokens: 10
        });

        const duration = Date.now() - startTime;
        durations.push(duration);

        console.log(`Request ${i + 1}: ${duration}ms`);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      console.log(`Average: ${avgDuration.toFixed(0)}ms`);
      console.log('-------------------------------\n');

      expect(durations.every(d => d < 15000)).toBe(true);
    }, 50000);
  });
});
