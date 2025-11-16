import { useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { verifyAuth, checkAuthStatus, setAuthToken } from '../services/api';
import logger from '../utils/logger';

interface AuthGateProps {
  children: ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if auth is enabled on backend
      const status = await checkAuthStatus();

      logger.info('Auth status checked', status);

      // If auth is not required, allow access
      if (!status.requiresAuth) {
        setAuthRequired(false);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      setAuthRequired(true);

      // Check if we have a valid token
      const token = localStorage.getItem('auth_token');
      const expiry = localStorage.getItem('auth_expiry');

      if (token && expiry && Date.now() < parseInt(expiry)) {
        // Token exists and not expired
        setAuthToken(token);
        setIsAuthenticated(true);
        logger.info('Using existing valid token');
      } else {
        // No valid token
        if (token) {
          // Token expired, clear it
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_expiry');
          setAuthToken(null);
          logger.info('Token expired, cleared');
        }
        setIsAuthenticated(false);
      }
    } catch (error) {
      logger.error('Auth check failed', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!inviteCode.trim() && !password.trim()) {
      setError('请输入邀请码或密码');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await verifyAuth(
        inviteCode.trim() || undefined,
        password.trim() || undefined
      );

      const { token, expiresIn } = response;

      // Save token
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_expiry', (Date.now() + expiresIn).toString());

      // Set token in axios headers
      setAuthToken(token);

      logger.info('Authentication successful');

      setIsAuthenticated(true);
      setError('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || t('auth.error');
      setError(errorMessage);
      logger.error('Authentication failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleAuth();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // If auth not required or already authenticated, show children
  if (!authRequired || isAuthenticated) {
    return <>{children}</>;
  }

  // Show auth form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">{t('auth.title')}</h2>
          <p className="mt-2 text-gray-600">{t('auth.subtitle')}</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Invite Code Input */}
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.inviteCode')}
            </label>
            <input
              id="inviteCode"
              type="text"
              placeholder={t('auth.inviteCode')}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t('auth.or')}</span>
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              placeholder={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleAuth}
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? t('common.loading') : t('auth.enter')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;
