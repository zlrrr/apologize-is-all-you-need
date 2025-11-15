import { useState, useEffect } from 'react';
import { checkHealth, checkLLMHealth } from '../services/api';
import logger from '../utils/logger';

interface HealthStatus {
  api: 'healthy' | 'degraded' | 'unavailable';
  llm: 'healthy' | 'degraded' | 'unavailable';
  lastCheck: Date | null;
}

export const HealthIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [health, setHealth] = useState<HealthStatus>({
    api: 'unavailable',
    llm: 'unavailable',
    lastCheck: null,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Check health on mount
    checkHealthStatus();

    // Check health every 30 seconds
    const interval = setInterval(checkHealthStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkHealthStatus = async () => {
    if (isChecking) return;

    setIsChecking(true);
    try {
      const healthData = await checkHealth();

      setHealth({
        api: healthData.services?.api === 'healthy' ? 'healthy' : 'degraded',
        llm: healthData.services?.llm === 'healthy' ? 'healthy' :
             healthData.services?.llm === 'unavailable' ? 'unavailable' : 'degraded',
        lastCheck: new Date(),
      });

      logger.info('Health check completed', healthData);
    } catch (error) {
      logger.error('Health check failed', error);
      setHealth({
        api: 'unavailable',
        llm: 'unavailable',
        lastCheck: new Date(),
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unavailable':
      default:
        return 'bg-red-500';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'healthy':
        return '正常';
      case 'degraded':
        return '降级';
      case 'unavailable':
      default:
        return '不可用';
    }
  };

  const overallStatus = health.api === 'healthy' && health.llm === 'healthy' ? 'healthy' :
                        health.api === 'unavailable' ? 'unavailable' : 'degraded';

  return (
    <div className={`relative ${className}`}>
      {/* Status indicator dot */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
        title="服务状态"
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor(overallStatus)} ${isChecking ? 'animate-pulse' : ''}`} />
        <span className="text-gray-600">
          {isChecking ? '检查中...' : getStatusText(overallStatus)}
        </span>
      </button>

      {/* Details popup */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-semibold text-gray-800">服务状态</h3>
              <button
                onClick={checkHealthStatus}
                disabled={isChecking}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              >
                {isChecking ? '检查中...' : '刷新'}
              </button>
            </div>

            {/* API Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">后端服务:</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(health.api)}`} />
                <span className="text-sm font-medium">{getStatusText(health.api)}</span>
              </div>
            </div>

            {/* LLM Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">LLM服务:</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(health.llm)}`} />
                <span className="text-sm font-medium">{getStatusText(health.llm)}</span>
              </div>
            </div>

            {/* Last check time */}
            {health.lastCheck && (
              <div className="pt-2 border-t text-xs text-gray-500">
                最后检查: {health.lastCheck.toLocaleTimeString()}
              </div>
            )}

            {/* Warning message if services are down */}
            {overallStatus !== 'healthy' && (
              <div className="pt-2 border-t">
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  {health.api === 'unavailable' && (
                    <p>• 无法连接到后端服务，请检查服务是否运行</p>
                  )}
                  {health.llm === 'unavailable' && (
                    <p>• LLM服务不可用，请确认LM Studio已启动并加载模型</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthIndicator;
