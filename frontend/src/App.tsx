import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChatInterface } from './components/ChatInterface'
import { AuthGate } from './components/AuthGate'

function App() {
  const { t, i18n } = useTranslation()

  // Update page title when language changes
  useEffect(() => {
    document.title = t('app.title')
  }, [i18n.language, t])

  return (
    <AuthGate>
      <ChatInterface />
    </AuthGate>
  )
}

export default App
