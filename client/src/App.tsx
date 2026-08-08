import React, { useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { BookingSystem } from './components/BookingSystem';
import { WeeklySchedule, WeeklyScheduleRef } from './components/WeeklySchedule';
import { LogOut, CalendarDays } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const scheduleRef = useRef<WeeklyScheduleRef>(null);

  const handleBookingCreated = () => {
    if (scheduleRef.current) {
      scheduleRef.current.refresh();
    }
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', padding: '1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Верхня панель */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#eff6ff', padding: '0.5rem', borderRadius: '8px' }}>
              <CalendarDays color="#2563eb" size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: '700' }}>Система бронювання кімнат</h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Панель управління та тижневий розклад</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#334155' }}>
              Вітаємо, <strong style={{ color: '#0f172a' }}>{user?.name}</strong>
            </span>
            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#f1f5f9',
                border: 'none',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                color: '#475569',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              <LogOut size={16} />
              Вийти
            </button>
          </div>
        </header>

        {/* Основна секція */}
        <main>
          <BookingSystem onBookingCreated={handleBookingCreated} />
          <WeeklySchedule ref={scheduleRef} />
        </main>
      </div>
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