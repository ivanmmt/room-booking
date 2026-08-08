import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Clock, Users, Calendar } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  floor: number;
  capacity: number;
}

interface Booking {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  roomId: string;
  userId: string;
  user: { id: string; name: string; email: string };
}

export const WeeklySchedule: React.FC = () => {
  const { token, user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Понеділок
    return new Date(d.setDate(diff));
  });

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Отримання кімнат
  useEffect(() => {
    fetch('http://localhost:4000/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        setRooms(data);
        if (data.length > 0) setSelectedRoomId(data[0].id);
      });
  }, []);

  // Отримання бронювань для вибраної кімнати на тиждень
  const fetchBookings = async () => {
    if (!selectedRoomId) return;

    const startOfWeek = new Date(currentWeekStart);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(currentWeekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const res = await fetch(
      `http://localhost:4000/api/bookings?roomId=${selectedRoomId}&start=${startOfWeek.toISOString()}&end=${endOfWeek.toISOString()}`
    );
    const data = await res.json();
    setBookings(data);
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedRoomId, currentWeekStart]);

  // Навігація по тижнях
  const changeWeek = (offsetDays: number) => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + offsetDays);
    setCurrentWeekStart(next);
  };

  // Дні тижня (Пн-Нд)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Слоти з 09:00 до 19:00 (з кроком 30 хв)
  const timeSlots: string[] = [];
  for (let h = 9; h < 19; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>
      {/* Шапка з поясом та навігацією */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <label style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>Переговорна:</label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} (Поверх {r.floor}, capacity: {r.capacity})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => changeWeek(-7)} style={{ padding: '0.5rem', cursor: 'pointer' }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontWeight: 'bold' }}>
            {weekDays[0].toLocaleDateString('uk-UA')} — {weekDays[6].toLocaleDateString('uk-UA')}
          </span>
          <button onClick={() => changeWeek(7)} style={{ padding: '0.5rem', cursor: 'pointer' }}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>
          <div>Офіс: <strong>Europe/Kyiv (UTC+3)</strong></div>
          <div>Твій пояс: <strong>{userTimezone}</strong></div>
        </div>
      </div>

      {/* Сітка тижня */}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem', width: '80px' }}>Час</th>
              {weekDays.map((day) => (
                <th key={day.toISOString()} style={{ padding: '0.75rem', borderLeft: '1px solid #e2e8f0' }}>
                  {day.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.5rem', fontWeight: 'bold', backgroundColor: '#fafafa' }}>{slot}</td>
                {weekDays.map((day) => {
                  const slotDateStr = day.toISOString().split('T')[0];
                  // Перевіряємо, чи є бронювання на цей час
                  const activeBooking = bookings.find((b) => {
                    const bStart = new Date(b.startAt);
                    const bStartSlot = bStart.toISOString().substring(11, 16);
                    const bDate = bStart.toISOString().split('T')[0];
                    return bDate === slotDateStr && bStartSlot === slot;
                  });

                  const isMine = activeBooking?.userId === user?.id;

                  return (
                    <td
                      key={day.toISOString() + slot}
                      style={{
                        borderLeft: '1px solid #e2e8f0',
                        padding: '0.25rem',
                        height: '40px',
                        backgroundColor: activeBooking
                          ? isMine
                            ? '#dbeafe'
                            : '#fee2e2'
                          : 'transparent',
                      }}
                    >
                      {activeBooking && (
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isMine ? '#1e40af' : '#991b1b' }}>
                          {activeBooking.title} ({activeBooking.user.name})
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};