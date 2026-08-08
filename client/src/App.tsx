import { useEffect } from 'react';

export function App() {

  useEffect(() => {
    fetch('http://localhost:4000/api/health')
      .then((res) => res.json())
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Бронювання переговорних кімнат</h1>
    </div>
  );
}

export default App;