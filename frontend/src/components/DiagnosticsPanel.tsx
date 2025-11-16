import { useState } from 'react';
import { checkHealth, checkLLMHealth, checkAuthStatus } from '../services/api';
import logger from '../utils/logger';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  details?: any;
}

export const DiagnosticsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // Test 1: Basic health check
    try {
      const health = await checkHealth();
      diagnosticResults.push({
        name: 'Backend API',
        status: health.services?.api === 'healthy' ? 'success' : 'error',
        message: health.services?.api === 'healthy'
          ? '后端服务正常运行'
          : '后端服务异常',
        details: health,
      });

      // Test 2: LLM service check
      if (health.services?.llm === 'healthy') {
        diagnosticResults.push({
          name: 'LLM Service',
          status: 'success',
          message: `${health.config?.provider} 服务连接成功`,
          details: health.config,
        });
      } else if (health.config?.configured === false) {
        diagnosticResults.push({
          name: 'LLM Service',
          status: 'error',
          message: 'LLM 未配置 - 请在 Render 设置环境变量',
          details: {
            suggestions: health.diagnostics?.suggestions || [],
          },
        });
      } else {
        diagnosticResults.push({
          name: 'LLM Service',
          status: 'warning',
          message: 'LLM 服务不可用 - 请检查配置',
          details: health.config,
        });
      }
    } catch (error) {
      logger.error('Health check failed', error);
      diagnosticResults.push({
        name: 'Backend API',
        status: 'error',
        message: '无法连接到后端服务',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }

    // Test 3: LLM detailed health
    try {
      const llmHealth = await checkLLMHealth();
      const responseTime = parseInt(llmHealth.responseTime) || 0;

      if (llmHealth.status === 'healthy') {
        diagnosticResults.push({
          name: 'LLM Response Time',
          status: responseTime < 2000 ? 'success' : 'warning',
          message: `响应时间: ${llmHealth.responseTime}`,
          details: llmHealth.diagnostics,
        });
      }
    } catch (error) {
      // LLM health check might fail if not configured, that's okay
      logger.warn('LLM health check failed', error);
    }

    // Test 4: Auth status
    try {
      const authStatus = await checkAuthStatus();
      diagnosticResults.push({
        name: 'Authentication',
        status: 'success',
        message: authStatus.authEnabled ? '认证已启用' : '认证未启用',
        details: authStatus,
      });
    } catch (error) {
      logger.error('Auth status check failed', error);
      diagnosticResults.push({
        name: 'Authentication',
        status: 'warning',
        message: '无法检查认证状态',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }

    // Test 5: CORS check
    const apiUrl = import.meta.env.VITE_API_URL;
    diagnosticResults.push({
      name: 'CORS Configuration',
      status: apiUrl ? 'success' : 'warning',
      message: apiUrl ? `后端地址: ${apiUrl}` : '未配置后端地址',
      details: { VITE_API_URL: apiUrl },
    });

    setResults(diagnosticResults);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="text-green-500 text-xl">✓</span>;
      case 'warning':
        return <span className="text-yellow-500 text-xl">⚠</span>;
      case 'error':
        return <span className="text-red-500 text-xl">✗</span>;
      case 'pending':
        return <span className="text-gray-400 text-xl">○</span>;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">系统诊断</h2>
            <p className="text-sm text-gray-500 mt-1">检查前后端连接和配置状态</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Run button */}
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="w-full mb-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isRunning ? '诊断中...' : results.length > 0 ? '重新运行诊断' : '开始诊断'}
          </button>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800">{result.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{result.message}</div>

                      {/* Details */}
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            查看详情
                          </summary>
                          <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded overflow-auto max-h-40">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Help text */}
          {results.length === 0 && !isRunning && (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-sm">点击上方按钮开始系统诊断</p>
            </div>
          )}
        </div>

        {/* Footer with help links */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-2">遇到问题？</p>
            <ul className="space-y-1 text-gray-500">
              <li>• 查看 <code className="bg-gray-200 px-1 rounded">GEMINI_CONFIGURATION_GUIDE.md</code> 了解如何配置 Gemini</li>
              <li>• 查看 <code className="bg-gray-200 px-1 rounded">RENDER_CONFIGURATION.md</code> 了解 Render 配置</li>
              <li>• 在 Render Dashboard 查看服务日志</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsPanel;
