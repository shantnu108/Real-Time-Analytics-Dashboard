import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function ChartPanel({ metrics }) {
  const t = metrics.ts;
  const w1 = metrics.windows['1s'];
  const w5 = metrics.windows['5s'];
  const w60 = metrics.windows['60s'];

  const lineData = {
    labels: [t],
    datasets: [
      { label: '1s Events', data: [w1.total], borderWidth: 2 },
      { label: '5s Events', data: [w5.total], borderWidth: 2 },
      { label: '60s Events', data: [w60.total], borderWidth: 2 }
    ]
  };

  const barData = {
    labels: w5.topRoutes.map(r => r[0]),
    datasets: [{ label: 'Top Routes (5s)', data: w5.topRoutes.map(r => r[1]) }]
  };

  return (
    <div>
      <div style={{ width: 800, height: 300 }}>
        <Line data={lineData} options={{ animation: false, responsive: true }} />
      </div>
      <div style={{ width: 600, height: 300, marginTop: 20 }}>
        <Bar data={barData} options={{ animation: false, responsive: true }} />
      </div>
      <div style={{ marginTop: 20 }}>
        <b>Unique Sessions (5s):</b> {w5.uniqueSessions} &nbsp;&nbsp;
        <b>Error Count (60s):</b> {w60.errors}
      </div>
    </div>
  );
}













































