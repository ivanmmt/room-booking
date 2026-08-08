import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { BookingSystem } from './components/BookingSystem';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '1rem' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1000px',
          margin: '0 auto',
          paddingBottom: '1rem',
          borderBottom: '1px solid #eee',
        }}
      >
        <h2 style={{ margin: 0 }}>Система бронювання кімнат</h2>
        <div>
          <span>Вітаємо, <strong>{user?.name}</strong>! </span>
          <button
            onClick={logout}
            style={{ marginLeft: '1rem', padding: '0.4rem 0.8rem', cursor: 'pointer' }}
          >
            Вийти
          </button>
        </div>
      </header>

      <main style={{ marginTop: '1.5rem' }}>
        <BookingSystem />
      </main>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <AuthPage />;
};

export function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

export default App;