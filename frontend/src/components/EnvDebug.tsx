import React from 'react';

/**
 * Environment Debug Component
 * 临时调试组件，用于显示前端环境变量
 * 生产环境中应该移除或隐藏
 */
export const EnvDebug: React.FC = () => {
  const envVars = {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };

  // 在控制台打印环境变量（方便调试）
  React.useEffect(() => {
    console.log('=== Frontend Environment Variables ===');
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('MODE:', import.meta.env.MODE);
    console.log('DEV:', import.meta.env.DEV);
    console.log('PROD:', import.meta.env.PROD);
    console.log('======================================');

    // 暴露到全局对象，方便控制台访问
    (window as any).__ENV__ = envVars;
    console.log('✅ 环境变量已暴露到 window.__ENV__');
    console.log('💡 在控制台输入: window.__ENV__');
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white text-xs p-3 rounded shadow-lg max-w-md z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">🔧 Environment Debug</h3>
        <span className="text-gray-400">(开发调试)</span>
      </div>
      <div className="space-y-1 font-mono">
        <div>
          <span className="text-gray-400">VITE_API_URL:</span>{' '}
          <span className={envVars.VITE_API_URL ? 'text-green-400' : 'text-red-400'}>
            {envVars.VITE_API_URL || 'undefined'}
          </span>
        </div>
        <div>
          <span className="text-gray-400">MODE:</span>{' '}
          <span className="text-blue-400">{envVars.MODE}</span>
        </div>
        <div>
          <span className="text-gray-400">PROD:</span>{' '}
          <span className="text-yellow-400">{String(envVars.PROD)}</span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400">
        💡 控制台输入: <code className="text-green-400">window.__ENV__</code>
      </div>
    </div>
  );
};

export default EnvDebug;
