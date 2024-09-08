import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer,Legend } from 'recharts';

// Define colors for the chart slices
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
  '#A28DFF', '#FF637D', '#B8DE6F', '#EF6C00', 
  '#BC5090', '#4A90E2', '#7B8D8E'
];

const PieChartComponent = ({ monthData }) => {
  // Filter out null amounts in the transaction summary
  const data = monthData.transSummary.filter(t => t.totalAmount !== null);

  return (
    <ResponsiveContainer width="100%" height={450}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={150}
          fill="#8884d8"
          dataKey="totalAmount"
          nameKey="transactionType"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          wrapperStyle={{ paddingTop: 20 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieChartComponent;
