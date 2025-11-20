import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Chat } from './pages/Chat';
import { subscribeToAuth, signInWithGoogle, logout } from './services/firebase';
import { AuthState } from './types';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ user: null, loading: true, isDemo: false });

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user, isDemo) => {
      setAuth({ user, loading: false, isDemo });
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  if (auth.loading) {
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-ios-bg">
            <div className="w-10 h-10 border-4 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  return (
    <Router>
      {!auth.user ? (
        <Routes>
            <Route path="*" element={<Login onLogin={handleLogin} isDemo={auth.isDemo} />} />
        </Routes>
      ) : (
        <Layout isAuthenticated={true} onLogout={logout} title={getTitleFromPath(window.location.hash)}>
          <Routes>
            <Route path="/" element={<Dashboard userId={auth.user.uid} />} />
            <Route path="/upload" element={<Upload userId={auth.user.uid} />} />
            <Route path="/chat" element={<Chat userId={auth.user.uid} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
};

function getTitleFromPath(hash: string): string {
    if (hash.includes('upload')) return 'New Payslip';
    if (hash.includes('chat')) return 'AI Assistant';
    return 'Dashboard';
}

export default App;