import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Trash2, Calendar as CalendarIcon, Clock, Globe } from 'lucide-react';

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

export interface WeeklyScheduleRef {
  refresh: () => void;
}

export const WeeklySchedule = forwardRef<WeeklyScheduleRef>((_, ref) => {
  const { token, user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Понеділок
    return new Date(d.setDate(diff));
  });

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Завантаження кімнат
  useEffect(() => {
    fetch('http://localhost:4000/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        setRooms(data);
        if (data.length > 0) setSelectedRoomId(data[0].id);
      })
      .catch((err) => console.error('Error loading rooms:', err));
  }, []);

  // Завантаження бронювань
  const fetchBookings = async () => {
    if (!selectedRoomId) return;

    const startOfWeek = new Date(currentWeekStart);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(currentWeekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    try {
      const res = await fetch(
        `http://localhost:4000/api/bookings?roomId=${selectedRoomId}&start=${startOfWeek.toISOString()}&end=${endOfWeek.toISOString()}`
      );
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading bookings:', err);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchBookings,
  }));

  useEffect(() => {
    fetchBookings();
  }, [selectedRoomId, currentWeekStart]);

  const changeWeek = (offsetDays: number) => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + offsetDays);
    setCurrentWeekStart(next);
  };

  const handleConfirmDelete = async () => {
    if (!deleteBookingId) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`http://localhost:4000/api/bookings/${deleteBookingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Не вдалося видалити бронювання');
      }

      setDeleteBookingId(null);
      fetchBookings();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const timeSlots: string[] = [];
  for (let h = 9; h < 19; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '1.5rem' }}>
      {/* Шапка керування сіткою */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' }}>Переговорна:</label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: '500', color: '#0f172a', outline: 'none' }}
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} (Поверх {r.floor}, до {r.capacity} осіб)
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '8px' }}>
          <button onClick={() => changeWeek(-7)} style={{ background: 'none', border: 'none', padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', color: '#475569', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CalendarIcon size={16} color="#0284c7" />
            {weekDays[0].toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })} — {weekDays[6].toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
          <button onClick={() => changeWeek(7)} style={{ background: 'none', border: 'none', padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', color: '#475569', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} /> Офіс: <strong style={{ color: '#0f172a' }}>Europe/Kyiv (UTC+3)</strong></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Globe size={14} /> Ваш пояс: <strong style={{ color: '#0f172a' }}>{userTimezone}</strong></div>
        </div>
      </div>

      {/* Таблична сітка */}
      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem', width: '70px', color: '#64748b', fontWeight: '600' }}>Час</th>
              {weekDays.map((day) => (
                <th key={day.toISOString()} style={{ padding: '0.75rem', borderLeft: '1px solid #e2e8f0', color: '#1e293b', fontWeight: '600' }}>
                  {day.toLocaleDateString('uk-UA', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.4rem', fontWeight: '600', backgroundColor: '#f8fafc', color: '#64748b' }}>{slot}</td>
                {weekDays.map((day) => {
                  const [slotHour, slotMinute] = slot.split(':').map(Number);
                  const slotDate = new Date(day);
                  slotDate.setHours(slotHour, slotMinute, 0, 0);

                  const activeBooking = bookings.find((b) => {
                    const bStart = new Date(b.startAt);
                    const bEnd = new Date(b.endAt);
                    return slotDate >= bStart && slotDate < bEnd;
                  });

                  const isMine = activeBooking?.userId === user?.id;

                  return (
                    <td
                      key={day.toISOString() + slot}
                      style={{
                        borderLeft: '1px solid #e2e8f0',
                        padding: '0.2rem',
                        height: '38px',
                        backgroundColor: activeBooking
                          ? isMine
                            ? '#eff6ff'
                            : '#fef2f2'
                          : 'transparent',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      {activeBooking && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: isMine ? '#dbeafe' : '#fee2e2',
                            borderLeft: `3px solid ${isMine ? '#2563eb' : '#dc2626'}`,
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            height: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: isMine ? '#1e40af' : '#991b1b' }}>
                              {activeBooking.title}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: isMine ? '#3b82f6' : '#ef4444' }}>
                              {activeBooking.user?.name}
                            </div>
                          </div>
                          {isMine && (
                            <button
                              onClick={() => setDeleteBookingId(activeBooking.id)}
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                              title="Скасувати бронювання"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
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

      {/* Модальне вікно скасування */}
      {deleteBookingId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '1.75rem', borderRadius: '12px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Скасування бронювання</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1.5rem 0' }}>Ви дійсно бажаєте скасувати це бронювання? Вільний слот стане доступним для інших користувачів.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setDeleteBookingId(null)}
                disabled={isDeleting}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#white', color: '#334155', cursor: 'pointer', fontWeight: '500' }}
              >
                Ні, залишити
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: '#dc2626', color: 'white', cursor: 'pointer', fontWeight: '500' }}
              >
                {isDeleting ? 'Зачекайте...' : 'Так, скасувати'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});