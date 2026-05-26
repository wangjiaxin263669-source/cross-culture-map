import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AiModelProvider } from './context/AiModelContext.jsx'
import WalletNotice from './components/WalletNotice.jsx'

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AuthProvider>
      <AiModelProvider>
        <WalletNotice />
        <App />
      </AiModelProvider>
    </AuthProvider>
  </ErrorBoundary>,
)
