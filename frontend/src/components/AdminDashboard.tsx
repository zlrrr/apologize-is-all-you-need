import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getAllSessions,
  getSessionDetails,
  getSystemStats,
  AdminUser,
  AdminSession,
  SystemStats,
} from '../services/adminApi';
import logger from '../utils/logger';

type Tab = 'overview' | 'users' | 'sessions';

export const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      onClose();
    }
  }, [isAdmin, onClose]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'sessions') {
      loadSessions();
    }
  }, [activeTab]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await getSystemStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      logger.error('Failed to load stats', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getAllUsers();
      setUsers(data.users);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      logger.error('Failed to load users', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const data = await getAllSessions();
      setSessions(data.sessions);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      logger.error('Failed to load sessions', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await updateUserStatus(userId, newStatus);
      // Reload users
      await loadUsers();
      logger.info('User status updated', { userId, newStatus });
    } catch (err: any) {
      setError(err.message);
      logger.error('Failed to update user status', err);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h2 className="text-2xl font-bold text-white">{t('user.adminDashboard')}</h2>
              <p className="text-purple-100 text-sm">
                {t('admin.welcome')}, {user?.username}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('admin.tabs.overview')}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('admin.tabs.users')}
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'sessions'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('admin.tabs.sessions')}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && stats && <OverviewTab stats={stats} />}
              {activeTab === 'users' && (
                <UsersTab users={users} onToggleStatus={handleToggleUserStatus} />
              )}
              {activeTab === 'sessions' && <SessionsTab sessions={sessions} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ stats: SystemStats }> = ({ stats }) => {
  const { t } = useTranslation();

  const statCards = [
    {
      label: t('admin.stats.totalUsers'),
      value: stats.users.total,
      icon: '👥',
      color: 'bg-blue-500',
    },
    {
      label: t('admin.stats.activeUsers'),
      value: stats.users.active,
      icon: '✓',
      color: 'bg-green-500',
    },
    {
      label: t('admin.stats.inactiveUsers'),
      value: stats.users.inactive,
      icon: '✗',
      color: 'bg-gray-500',
    },
    {
      label: t('admin.stats.admins'),
      value: stats.users.admins,
      icon: '⚡',
      color: 'bg-purple-500',
    },
    {
      label: t('admin.stats.totalSessions'),
      value: stats.sessions.total,
      icon: '💬',
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">{t('admin.overview.title')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              </div>
              <div className={`${card.color} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab: React.FC<{
  users: AdminUser[];
  onToggleStatus: (userId: number, currentStatus: boolean) => void;
}> = ({ users, onToggleStatus }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">{t('admin.users.title')}</h3>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.users.username')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.users.role')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.users.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.users.lastLogin')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.users.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-500'
                        : 'bg-blue-500'
                    }`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isActive ? t('admin.users.active') : t('admin.users.inactive')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString()
                    : t('admin.users.never')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => onToggleStatus(user.id, user.isActive)}
                      className={`${
                        user.isActive
                          ? 'text-red-600 hover:text-red-900'
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {user.isActive ? t('admin.users.disable') : t('admin.users.enable')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Sessions Tab Component
const SessionsTab: React.FC<{ sessions: AdminSession[] }> = ({ sessions }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">{t('admin.sessions.title')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-800 truncate">
                {session.title || t('admin.sessions.untitled')}
              </h4>
              <span className="text-xs text-gray-500">
                {t('admin.sessions.user')} #{session.userId}
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                💬 {session.messageCount} {t('admin.sessions.messages')}
              </p>
              <p className="text-xs text-gray-400">
                {t('admin.sessions.updated')}: {new Date(session.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      {sessions.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          {t('admin.sessions.empty')}
        </div>
      )}
    </div>
  );
};
