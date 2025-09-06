import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer,Legend } from 'recharts';

// Define colors for the chart slices
const CATEGORY_COLORS = {
  SWIGGY: "#FF5722",        // Orange
  RENT: "#1976D2",          // Blue
  PARENTS: "#4CAF50",       // Green
  INTERNET: "#9C27B0",      // Purple
  MAID: "#FFC107",          // Amber
  DINNER: "#E91E63",        // Pink
  TRAVEL: "#009688",        // Teal
  CAB_SERVICE: "#FF9800",   // Deep Orange
  SALARY: "#3F51B5",        // Indigo
  INTEREST: "#8BC34A",      // Light Green
  SHOPPING: "#F44336",      // Red
  URBANCOMPANY: "#00BCD4",  // Cyan
  SUBSCRIPTIONS: "#673AB7", // Deep Purple
  LIQUOR: "#795548",        // Brown
  INVESTMENT: "#607D8B",    // Blue Grey
  UPI_LITE: "#FFEB3B",      // Yellow
  OASIS_BREEZE: "#8E24AA",   // Dark Purple
  OTHERS: "#73b3d3ff"   // Dark Purple
};

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
            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.transactionType] || "#CCCCCC"} />
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
