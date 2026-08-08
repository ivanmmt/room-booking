import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, Trash2, Plus, Users } from 'lucide-react';

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
  user: {
    id: string;
    name: string;
    email: string;
  };
  room: Room;
}

export const BookingSystem: React.FC = () => {
  const { token, user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Форма бронювання
  const [title, setTitle] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Завантаження кімнат та бронювань
  const fetchData = async () => {
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch('http://localhost:4000/api/rooms'),
        fetch(`http://localhost:4000/api/bookings?date=${selectedDate}`),
      ]);

      const roomsData = await roomsRes.json();
      const bookingsData = await bookingsRes.json();

      setRooms(roomsData);
      setBookings(bookingsData);
      if (roomsData.length > 0 && !selectedRoomId) {
        setSelectedRoomId(roomsData[0].id);
      }
    } catch (err) {
      setError('Помилка завантаження даних');
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // Створення бронювання
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const startAt = new Date(`${selectedDate}T${startTime}:00.000Z`).toISOString();
    const endAt = new Date(`${selectedDate}T${endTime}:00.000Z`).toISOString();

    try {
      const res = await fetch('http://localhost:4000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          roomId: selectedRoomId,
          startAt,
          endAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Помилка створення бронювання');
      }

      setSuccess('Бронювання успішно створено!');
      setTitle('');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Видалення бронювання
  const handleDeleteBooking = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/bookings/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      {/* Селектор дати */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Calendar size={20} />
        <label><strong>Обрати дату:</strong></label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      {/* Форма бронювання */}
      <div style={{ border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
          <Plus size={18} /> Забронювати кімнату
        </h3>

        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ color: 'green', marginBottom: '1rem' }}>{success}</div>}

        <form onSubmit={handleCreateBooking} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label>Назва зустрічі:</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Наприклад: Daily Standup"
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>

          <div>
            <label>Кімната:</label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} (Поверх {room.floor}, до {room.capacity} осіб)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Час початку (UTC):</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>

          <div>
            <label>Час завершення (UTC):</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            />
          </div>

          <button
            type="submit"
            style={{
              gridColumn: 'span 2',
              padding: '0.75rem',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Забронювати
          </button>
        </form>
      </div>

      {/* Список кімнат та активних бронювань */}
      <h3>Розклад кімнат на {selectedDate}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {rooms.map((room) => {
          const roomBookings = bookings.filter((b) => b.roomId === room.id);

          return (
            <div key={room.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>{room.name}</h4>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
                <span>Поверх: {room.floor}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Users size={14} /> {room.capacity}
                </span>
              </div>

              <div style={{ borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem' }}>Бронювання:</strong>
                {roomBookings.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#888' }}>Немає бронювань</p>
                ) : (
                  roomBookings.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        backgroundColor: '#f8fafc',
                        padding: '0.5rem',
                        marginTop: '0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>{b.title}</div>
                      <div style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} />
                        {new Date(b.startAt).toISOString().substring(11, 16)} - {new Date(b.endAt).toISOString().substring(11, 16)} UTC
                      </div>
                      <div style={{ color: '#777', fontSize: '0.75rem' }}>Організатор: {b.user.name}</div>

                      {user?.id === b.userId && (
                        <button
                          onClick={() => handleDeleteBooking(b.id)}
                          style={{
                            marginTop: '0.25rem',
                            background: 'none',
                            border: 'none',
                            color: 'red',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: 0,
                            fontSize: '0.75rem',
                          }}
                        >
                          <Trash2 size={12} /> Скасувати
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};