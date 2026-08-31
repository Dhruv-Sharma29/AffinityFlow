import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { AuthScreen } from './auth/AuthScreen'

function Root() {
  const { configured, loading, user } = useAuth();
  if (loading) return <div className="auth-loading">Loading VisioSpace…</div>;
  if (!configured || !user) return <AuthScreen />;
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider><Root /></AuthProvider>
  </StrictMode>,
)
