import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// Import page components
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Import layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Import hooks and utilities
import { useAuth } from './hooks/useAuth';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorFallback from './components/ui/ErrorFallback';

// Protected Route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route component (redirect to dashboard if already authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  redirectTo = '/dashboard' 
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to={redirectTo} replace /> : <>{children}</>;
};

// Layout wrapper component
interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showHeader = true, 
  showFooter = true 
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Application error:', error, errorInfo);
        // Here you could send error to monitoring service
      }}
    >
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                <Layout>
                  <Home />
                </Layout>
              } 
            />
            
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Layout showHeader={false} showFooter={false}>
                    <Login />
                  </Layout>
                </PublicRoute>
              } 
            />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Additional protected routes can be added here */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Profile Page (Coming Soon)</div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/plants" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Plant Collection (Coming Soon)</div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/social" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Social Feed (Coming Soon)</div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Catch-all route for 404 */}
            <Route 
              path="*" 
              element={
                <Layout>
                  <div className="flex items-center justify-center min-h-96">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                      <p className="text-lg text-gray-600 mb-8">Page not found</p>
                      <a 
                        href="/" 
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Go Home
                      </a>
                    </div>
                  </div>
                </Layout>
              } 
            />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;