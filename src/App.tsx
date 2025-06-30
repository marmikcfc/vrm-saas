import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/useAuthStore';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import AgentWizard from './pages/AgentWizard';
import Calls from './pages/Calls';
import KnowledgeBase from './pages/KnowledgeBase';
import MCPs from './pages/MCPs';
import UploadSpecification from './pages/UploadSpecification';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { initialized, initializeAuth } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      initializeAuth();
    }
  }, [initialized, initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/auth"
            element={
              <ProtectedRoute requireAuth={false}>
                <AuthPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <ProtectedRoute requireAuth={false}>
                <AuthPage />
              </ProtectedRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/agents" element={<Agents />} />
                    <Route path="/agents/wizard" element={<AgentWizard />} />
                    <Route path="/calls" element={<Calls />} />
                    <Route path="/knowledge-base" element={<KnowledgeBase />} />
                    <Route path="/mcps" element={<MCPs />} />
                    <Route path="/upload-specification" element={<UploadSpecification />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;