import { ChatInterface } from './components/ChatInterface'
import { AuthGate } from './components/AuthGate'

function App() {
  return (
    <AuthGate>
      <ChatInterface />
    </AuthGate>
  )
}

export default App
