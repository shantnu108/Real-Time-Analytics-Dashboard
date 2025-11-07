import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

const SOCKET_URL = 'http://localhost:4000';
const MAX_POINTS = 60;

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [epsData, setEpsData] = useState([]);
  const socketRef = useRef(null);
  const lastSeenRef = useRef(localStorage.getItem('lastSeen'));

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to server');
      setConnected(true);
      socket.emit('hello', { lastSeen: lastSeenRef.current });
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected');
      setConnected(false);
    });

    socket.on('metrics', (msg) => handleIncoming(msg));
    socket.on('replay', (rows) => rows.forEach((r) => handleIncoming(r)));

    return () => socket.disconnect();
  }, []);

  const handleIncoming = (msg) => {
    const ts = new Date(msg.ts).getTime();
    const eps = msg.payload.eps;
    setEpsData((prev) => {
      const data = [...prev, { ts, value: eps }];
      const unique = Array.from(new Map(data.map((p) => [p.ts, p])).values());
      return unique.slice(-MAX_POINTS);
    });
    lastSeenRef.current = ts;
    localStorage.setItem('lastSeen', ts);
  };

  const data = {
    labels: epsData.map((p) => new Date(p.ts).toLocaleTimeString()),
    datasets: [
      {
        label: 'Events/sec',
        data: epsData.map((p) => p.value),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#3b82f6',
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        grid: { color: '#e5e7eb' },
        ticks: { color: '#374151' },
      },
      x: {
        grid: { color: '#f3f4f6' },
        ticks: { color: '#6b7280' },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#111827',
          font: { size: 14, weight: '600' },
        },
      },
    },
  };

  return (
    <div
      style={{
        padding: '2rem',
        background: 'linear-gradient(to right, #eef2ff, #f8fafc)',
        minHeight: '100vh',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'white',
          padding: '1.5rem 2rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        }}
      >
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#1e3a8a',
            textAlign: 'center',
            marginBottom: '0.5rem',
          }}
        >
          ⚡ Real-Time Analytics Dashboard
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: connected ? '#16a34a' : '#dc2626',
            fontWeight: '600',
            marginBottom: '1rem',
          }}
        >
          Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </p>
        <div style={{ height: '400px' }}>
          {epsData.length === 0 ? (
            <p
              style={{
                textAlign: 'center',
                color: '#6b7280',
                fontStyle: 'italic',
                paddingTop: '2rem',
              }}
            >
              Waiting for data...
            </p>
          ) : (
            <Line data={data} options={options} />
          )}
        </div>
      </div>
    </div>
  );
}
