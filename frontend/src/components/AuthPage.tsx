import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';

type TabType = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!username.trim() || !password.trim()) {
      setError(t('auth.validation.required'));
      return;
    }

    if (username.length < 3) {
      setError(t('auth.validation.usernameTooShort'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.validation.passwordTooShort'));
      return;
    }

    if (activeTab === 'register' && password !== confirmPassword) {
      setError(t('auth.validation.passwordMismatch'));
      return;
    }

    setIsSubmitting(true);

    try {
      if (activeTab === 'login') {
        await login(username, password);
      } else {
        await register(username, password);
      }
      // Auth context will update and redirect automatically
    } catch (err: any) {
      setError(err.message || t('auth.error.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white text-center">
              {t('app.title')}
            </h1>
            <p className="text-blue-100 text-center mt-2">
              {t('app.subtitle')}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleTabChange('login')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('auth.login.title')}
            </button>
            <button
              onClick={() => handleTabChange('register')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'register'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('auth.register.title')}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('auth.username')}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                placeholder={t('auth.username.placeholder')}
                autoComplete="username"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('auth.username.hint')}
              </p>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                placeholder={t('auth.password.placeholder')}
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('auth.password.hint')}
              </p>
            </div>

            {/* Confirm Password (Register only) */}
            {activeTab === 'register' && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('auth.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder={t('auth.confirmPassword.placeholder')}
                  autoComplete="new-password"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {isSubmitting
                ? t('common.loading')
                : activeTab === 'login'
                ? t('auth.login.submit')
                : t('auth.register.submit')}
            </button>

            {/* Helper Text */}
            <div className="text-center">
              {activeTab === 'login' ? (
                <p className="text-sm text-gray-600">
                  {t('auth.login.noAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => handleTabChange('register')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {t('auth.login.createAccount')}
                  </button>
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  {t('auth.register.hasAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => handleTabChange('login')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {t('auth.register.loginHere')}
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            {t('auth.footer.defaultAdmin')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {t('auth.footer.adminCredentials')}
          </p>
        </div>
      </div>
    </div>
  );
};
