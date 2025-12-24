import { useState, useEffect } from 'react';
import './MonthlyStats.css';


const CATEGORY_STYLES = {
  SWIGGY: { color: "#FF5722", bg: "#FFF4E5", icon: "🍔" },
  RENT: { color: "#1976D2", bg: "#E3F2FD", icon: "🏠" },
  PARENTS: { color: "#4CAF50", bg: "#E8F5E9", icon: "👨‍👩‍👧" },
  INTERNET: { color: "#9C27B0", bg: "#F3E5F5", icon: "🌐" },
  MAID: { color: "#FFC107", bg: "#FFF8E1", icon: "🧹" },
  DINNER: { color: "#E91E63", bg: "#FCE4EC", icon: "🍽️" },
  TRAVEL: { color: "#009688", bg: "#E0F2F1", icon: "✈️" },
  CAB_SERVICE: { color: "#FF9800", bg: "#FFF3E0", icon: "🚕" },
  SALARY: { color: "#3F51B5", bg: "#E8EAF6", icon: "💰" },
  INTEREST: { color: "#8BC34A", bg: "#F1F8E9", icon: "🏦" },
  SHOPPING: { color: "#F44336", bg: "#FFEBEE", icon: "🛍️" },
  URBANCOMPANY: { color: "#00BCD4", bg: "#E0F7FA", icon: "🛠️" },
  SUBSCRIPTIONS: { color: "#673AB7", bg: "#EDE7F6", icon: "📺" },
  LIQUOR: { color: "#795548", bg: "#EFEBE9", icon: "🍷" },
  INVESTMENT: { color: "#607D8B", bg: "#ECEFF1", icon: "📈" },
  UPI_LITE: { color: "#FFEB3B", bg: "#FFFDE7", icon: "📱" },
  OASIS_BREEZE: { color: "#8E24AA", bg: "#F3E5F5", icon: "🏢" },
  OTHERS: { color: "#73b3d3", bg: "#E1F5FE", icon: "📦" }
};

const MonthlyStats = ({ monthlyData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // When data loads, default to the first month (usually the latest)
  useEffect(() => {
    setCurrentIndex(0);
  }, [monthlyData]);

  if (!monthlyData || monthlyData.length === 0) return null;

  const currentMonth = monthlyData[currentIndex];

  const handleNext = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handlePrev = () => {
    if (currentIndex < monthlyData.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filter out nulls and sort by amount (highest spend first)
  const validTransactions = currentMonth.transSummary
    .filter(t => t.totalAmount !== null && t.totalAmount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return (
    <div className="dashboard-container">
      
      {/* Updated Navigation Header */}
    <div className="pagination-header">
      <button 
        className="nav-btn" 
        onClick={handlePrev} 
        disabled={currentIndex === monthlyData.length - 1}
      >
        <span>←</span> Prev
      </button>
      
      <div className="month-title">
        <span className="month-name">{currentMonth.month}</span>
        <span className="year-number">{currentMonth.year}</span>
      </div>

      <button 
        className="nav-btn" 
        onClick={handleNext} 
        disabled={currentIndex === 0}
      >
        Next <span>→</span>
      </button>
    </div>
    {/* 3. Footer Total */}
      <div className="total-bar">
        <span className="total-label">TOTAL SPENT </span>
        <span className="total-amount">{formatCurrency(currentMonth.totalSpent)}</span>
      </div>

      {/* 2. Tiles Grid */}
      <div className="bento-grid">
        {validTransactions.map((item, index) => {
          const style = CATEGORY_STYLES[item.transactionType] || CATEGORY_STYLES.OTHERS;
          const percentage = ((item.totalAmount / currentMonth.totalSpent) * 100).toFixed(1);

          return (
            <div 
              key={index} 
              className="stat-card"
              style={{ backgroundColor: style.bg }} // Apply pastel background
            >
              <div className="card-header">
                <div className="icon-box" style={{ backgroundColor: style.color }}>
                  {style.icon}
                </div>
                <span className="percentage-badge">{percentage}%</span>
              </div>
              
              <div className="card-content">
                <h3>{item.transactionType.replace('_', ' ')}</h3>
                <p className="amount">{formatCurrency(item.totalAmount)}</p>
              </div>
            </div>
          );
        })}
      </div>


    </div>
  );
};

export default MonthlyStats;