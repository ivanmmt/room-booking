import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Бронювання переговорних кімнат</h1>
        <div>
          <span>Вітаємо, <strong>{user?.name}</strong>! </span>
          <button onClick={logout} style={{ marginLeft: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Вийти
          </button>
        </div>
      </header>
      <hr style={{ margin: '1.5rem 0' }} />
      <p>Тут буде розклад кімнат та форма бронювання.</p>
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