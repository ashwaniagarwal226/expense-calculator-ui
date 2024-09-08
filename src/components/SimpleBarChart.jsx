import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { useLocation } from 'react-router-dom';

const SimpleBarChart = () => {
  const location = useLocation();
  const data = location.state?.data || []; // Default to an empty array if data is not provided

  return (
    <div style={{ width: '100%', height: '100vh', padding: '20px', backgroundColor: '#f5f5f5' }}>
      <h2>Monthly Spending Bar Chart</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="totalSpent" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SimpleBarChart;
