
import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import { MOCK_USERS } from './mockData';
import { User } from './types';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-600">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="bg-red-50 p-4 rounded text-left inline-block overflow-auto max-w-full">
            {this.state.error?.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<'admin' | 'user'>('admin');
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check URL parameters for direct navigation
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const emailParam = params.get('email');

    if (viewParam === 'user' && emailParam) {
      setCurrentUserEmail(emailParam);
      setView('user');
    }
  }, []);

  const handleSelectUser = (email: string) => {
    setCurrentUserEmail(email);
    setView('user');
    // Optionally update URL without refresh
    const newUrl = `${window.location.pathname}?view=user&email=${email}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const currentUser = MOCK_USERS.find(u => u.email === currentUserEmail) || MOCK_USERS[0];

  return (
    <ErrorBoundary>
      {view === 'admin' ? (
        <AdminDashboard onSelectUser={handleSelectUser} />
      ) : (
        <UserDashboard user={currentUser} />
      )}
      
      {/* Debug/Switch Control (Floating) */}
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white text-xs p-2 rounded shadow opacity-50 hover:opacity-100 transition-opacity z-50">
        <button onClick={() => setView('admin')} className="mr-2 underline">Admin View</button>
        |
        <button onClick={() => setView('user')} className="ml-2 underline">User View</button>
      </div>
    </ErrorBoundary>
  );
};

export default App;
