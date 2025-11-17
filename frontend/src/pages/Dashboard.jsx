import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/Authcontext";
import API from "../api";
import Navbar from "../components/Navbar";
import '../styles/Dashboard.css';
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler, // Add Filler plugin
} from "chart.js";
import BudgetManager from "../components/BudgetManager";

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  LineElement, 
  PointElement, 
  Tooltip, 
  Legend,
  Filler // Register Filler plugin
);

const Dashboard = () => {
  const { token } = useContext(AuthContext);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Chart display preferences - only one can be selected
  const [selectedChart, setSelectedChart] = useState('none'); // 'none', 'bar', 'pie'

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all transactions without limit to ensure we get complete data
        const [summaryRes, transactionsRes] = await Promise.all([
          API.get("/transactions/summary/stats"),
          API.get("/transactions") // Remove limit to get all transactions
        ]);
        
        setSummary(summaryRes.data);
        const transactionData = transactionsRes.data.transactions || transactionsRes.data;
        setTransactions(transactionData);
        
        // Calculate summary from actual transaction data as backup
        const calculatedSummary = calculateSummaryFromTransactions(transactionData);
        
        // Use calculated summary if API summary seems incorrect
        if (Math.abs(calculatedSummary.income - summaryRes.data.income) > 0.01 ||
            Math.abs(calculatedSummary.expense - summaryRes.data.expense) > 0.01) {
          setSummary(calculatedSummary);
        }
        
        // Process data for charts
        processMonthlyData(transactionData);
        processCategoryData(transactionData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [token]);

  // Add function to calculate summary from transactions as backup
  const calculateSummaryFromTransactions = (transactions) => {
    const summary = { income: 0, expense: 0, balance: 0 };
    
    transactions.forEach(transaction => {
      const amount = Number(transaction.amount);
      if (transaction.type === 'income') {
        summary.income += amount;
      } else if (transaction.type === 'expense') {
        summary.expense += amount;
      }
    });
    
    summary.balance = summary.income - summary.expense;
    return summary;
  };

  const processMonthlyData = (transactions) => {
    const monthlyMap = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { income: 0, expense: 0 };
      }
      
      // Fix: Ensure correct mapping of transaction types
      if (transaction.type === 'income') {
        monthlyMap[monthKey].income += Number(transaction.amount);
      } else if (transaction.type === 'expense') {
        monthlyMap[monthKey].expense += Number(transaction.amount);
      }
    });
    
    const sortedMonths = Object.keys(monthlyMap).sort();
    const monthlyArray = sortedMonths.map(month => ({
      month,
      ...monthlyMap[month]
    }));
    
    setMonthlyData(monthlyArray);
  };

  const processCategoryData = (transactions) => {
    const categoryMap = {};
    
    transactions.forEach(transaction => {
      if (!categoryMap[transaction.category]) {
        categoryMap[transaction.category] = { income: 0, expense: 0 };
      }
      
      // Fix: Ensure correct mapping of transaction types
      if (transaction.type === 'income') {
        categoryMap[transaction.category].income += Number(transaction.amount);
      } else if (transaction.type === 'expense') {
        categoryMap[transaction.category].expense += Number(transaction.amount);
      }
    });
    
    const categoryArray = Object.keys(categoryMap).map(category => ({
      category,
      ...categoryMap[category],
      total: categoryMap[category].income + categoryMap[category].expense
    })).sort((a, b) => b.total - a.total);
    
    setCategoryData(categoryArray);
  };

  // Chart data configurations - Fix color mapping
  const barData = {
    labels: ["Income", "Expense"],
    datasets: [
      {
        label: "Amount",
        data: [Number(summary.income || 0), Number(summary.expense || 0)],
        backgroundColor: ["#10b981", "#ef4444"], // Green for income, Red for expense
      },
    ],
  };

  const pieData = {
    labels: ["Income", "Expense"],
    datasets: [
      {
        data: [Number(summary.income || 0), Number(summary.expense || 0)],
        backgroundColor: ["#10b981", "#ef4444"], // Green for income, Red for expense
        hoverOffset: 4,
      },
    ],
  };

  const lineData = {
    labels: monthlyData.map(item => {
      const [year, month] = item.month.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Income',
        data: monthlyData.map(item => Number(item.income || 0)),
        borderColor: '#10b981', // Green for income
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Expense',
        data: monthlyData.map(item => Number(item.expense || 0)),
        borderColor: '#ef4444', // Red for expense
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1,
        fill: true,
      }
    ],
  };

  const categoryBarData = {
    labels: categoryData.slice(0, 8).map(item => item.category.charAt(0).toUpperCase() + item.category.slice(1)),
    datasets: [
      {
        label: 'Income',
        data: categoryData.slice(0, 8).map(item => Number(item.income || 0)),
        backgroundColor: '#10b981', // Green for income
      },
      {
        label: 'Expense',
        data: categoryData.slice(0, 8).map(item => Number(item.expense || 0)),
        backgroundColor: '#ef4444', // Red for expense
      }
    ],
  };

  const handleChartSelection = (chartType) => {
    setSelectedChart(chartType === selectedChart ? 'none' : chartType);
  };

  // Add a refresh function that can be called when transactions change
  const refreshDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, transactionsRes] = await Promise.all([
        API.get("/transactions/summary/stats"),
        API.get("/transactions")
      ]);
      
      setSummary(summaryRes.data);
      const transactionData = transactionsRes.data.transactions || transactionsRes.data;
      setTransactions(transactionData);
      
      // Always recalculate to ensure accuracy
      const calculatedSummary = calculateSummaryFromTransactions(transactionData);
      setSummary(calculatedSummary);
      
      processMonthlyData(transactionData);
      processCategoryData(transactionData);
    } catch (err) {
      console.error("Error refreshing dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Listen for storage events to refresh when transactions are added/updated from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'transactionUpdated') {
        refreshDashboardData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events within the same tab
    const handleTransactionUpdate = () => {
      refreshDashboardData();
    };
    
    window.addEventListener('transactionUpdated', handleTransactionUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('transactionUpdated', handleTransactionUpdate);
    };
  }, []);

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">
        <h2 className="dashboard-title">Dashboard</h2>

        {loading ? (
          <p className="loading-message">Loading...</p>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="summary-grid">
              <div className="summary-card income-card">
                <h3>Total Income</h3>
                <p>${Number(summary.income || 0).toFixed(2)}</p>
              </div>
              <div className="summary-card expense-card">
                <h3>Total Expense</h3>
                <p>${Number(summary.expense || 0).toFixed(2)}</p>
              </div>
              <div className="summary-card balance-card">
                <h3>Net Balance</h3>
                <p>${Number(summary.balance || 0).toFixed(2)}</p>
              </div>
            </div>

            {/* Budget Manager */}
            <BudgetManager />

            {/* Main Charts Section */}
            <div className="charts-grid">
              <div className="chart-container large">
                <h4 className="chart-title">Income vs Expense Over Time</h4>
                {monthlyData.length > 0 ? (
                  <Line 
                    data={lineData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { 
                        legend: { position: 'top' },
                        tooltip: {
                          mode: 'index',
                          intersect: false,
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return '$' + value;
                            }
                          }
                        }
                      }
                    }} 
                  />
                ) : (
                  <div className="no-data">No monthly data available</div>
                )}
              </div>

              <div className="chart-container">
                <h4 className="chart-title">Category Spending Analysis</h4>
                {categoryData.length > 0 ? (
                  <Bar 
                    data={categoryBarData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'top' } },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return '$' + value;
                            }
                          }
                        }
                      }
                    }} 
                  />
                ) : (
                  <div className="no-data">No category data available</div>
                )}
              </div>
            </div>

            {/* Chart Display Options */}
            <div className="chart-options">
              <h3>Additional Chart Options</h3>
              <div className="chart-option-boxes">
                <div 
                  className={`chart-option-box ${selectedChart === 'bar' ? 'active' : ''}`}
                  onClick={() => handleChartSelection('bar')}
                >
                  <div className="option-icon">📊</div>
                  <div className="option-content">
                    <h4>Bar Chart</h4>
                    <p>Income vs Expense comparison</p>
                  </div>
                  <div className="option-toggle">
                    <input
                      type="radio"
                      name="chartSelection"
                      checked={selectedChart === 'bar'}
                      onChange={() => handleChartSelection('bar')}
                    />
                  </div>
                </div>
                
                <div 
                  className={`chart-option-box ${selectedChart === 'pie' ? 'active' : ''}`}
                  onClick={() => handleChartSelection('pie')}
                >
                  <div className="option-icon">🥧</div>
                  <div className="option-content">
                    <h4>Pie Chart</h4>
                    <p>Income/Expense distribution</p>
                  </div>
                  <div className="option-toggle">
                    <input
                      type="radio"
                      name="chartSelection"
                      checked={selectedChart === 'pie'}
                      onChange={() => handleChartSelection('pie')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Charts - Conditional Display */}
            {selectedChart !== 'none' && (
              <div className="charts-section" style={{
                gridTemplateColumns: '1fr'
              }}>
                {selectedChart === 'bar' && (
                  <div className="chart-container">
                    <h4 className="chart-title">Income vs Expense (Bar)</h4>
                    <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                  </div>
                )}
                {selectedChart === 'pie' && (
                  <div className="chart-container">
                    <h4 className="chart-title">Income/Expense Distribution (Pie)</h4>
                    <Pie data={pieData} options={{ responsive: true }} />
                  </div>
                )}
              </div>
            )}

            {/* Monthly Summary */}
            {monthlyData.length > 0 && (
              <div className="monthly-summary">
                <h3>Monthly Summary</h3>
                <div className="summary-table">
                  <div className="summary-header">
                    <span>Month</span>
                    <span>Income</span>
                    <span>Expense</span>
                    <span>Net</span>
                  </div>
                  {monthlyData.slice(-6).reverse().map((month, index) => {
                    const netAmount = Number(month.income || 0) - Number(month.expense || 0);
                    return (
                      <div key={month.month} className="summary-row">
                        <span>{new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        <span className="income">${Number(month.income || 0).toFixed(2)}</span>
                        <span className="expense">${Number(month.expense || 0).toFixed(2)}</span>
                        <span className={netAmount >= 0 ? 'income' : 'expense'}>
                          ${netAmount.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;


