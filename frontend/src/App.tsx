import { ChatInterface } from './components/ChatInterface'
import { AuthGate } from './components/AuthGate'
import { EnvDebug } from './components/EnvDebug'

function App() {
  return (
    <AuthGate>
      <ChatInterface />
      {/* 临时调试组件 - 生产环境中应移除 */}
      <EnvDebug />
    </AuthGate>
  )
}

export default App
