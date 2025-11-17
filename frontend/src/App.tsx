import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChatInterface } from './components/ChatInterface'
import { AuthPage } from './components/AuthPage'
import { useAuth } from './contexts/AuthContext'

function App() {
  const { t, i18n } = useTranslation()
  const { isAuthenticated, isLoading } = useAuth()

  // Update page title when language changes
  useEffect(() => {
    document.title = t('app.title')
  }, [i18n.language, t])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />
  }

  // Show main app if authenticated
  return <ChatInterface />
}

export default App
