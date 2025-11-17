import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { checkHealth } from '../services/api';
import logger from '../utils/logger';

interface HealthStatus {
  api: 'healthy' | 'unavailable';
  lastCheck: Date | null;
}

export const HealthIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useTranslation();
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
    return health.api === 'healthy' ? t('header.connected') : t('header.disconnected');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Simple status indicator */}
      <div
        className="flex items-center gap-2 text-sm"
        title={health.api === 'healthy' ? t('header.backendConnected') : t('header.backendDisconnected')}
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isChecking ? 'animate-pulse' : ''}`} />
        <span className="text-gray-600 text-xs">
          {isChecking ? t('header.checking') : getStatusText()}
        </span>
      </div>
    </div>
  );
};

export default HealthIndicator;
