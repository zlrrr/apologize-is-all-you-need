import { useState, useEffect } from 'react';
import { checkHealth } from '../services/api';
import logger from '../utils/logger';

interface HealthStatus {
  api: 'healthy' | 'unavailable';
  lastCheck: Date | null;
}

export const HealthIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [health, setHealth] = useState<HealthStatus>({
    api: 'unavailable',
    lastCheck: null,
  });
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
        api: healthData.services?.api === 'healthy' ? 'healthy' : 'unavailable',
        lastCheck: new Date(),
      });

      logger.info('Health check completed', healthData);
    } catch (error) {
      logger.error('Health check failed', error);
      setHealth({
        api: 'unavailable',
        lastCheck: new Date(),
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = (): string => {
    return health.api === 'healthy' ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = (): string => {
    return health.api === 'healthy' ? '已连接' : '未连接';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Simple status indicator */}
      <div
        className="flex items-center gap-2 text-sm"
        title={health.api === 'healthy' ? '后端服务已连接' : '后端服务未连接'}
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isChecking ? 'animate-pulse' : ''}`} />
        <span className="text-gray-600 text-xs">
          {isChecking ? '检查中...' : getStatusText()}
        </span>
      </div>
    </div>
  );
};

export default HealthIndicator;
