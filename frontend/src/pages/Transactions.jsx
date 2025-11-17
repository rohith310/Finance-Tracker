import { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import TransactionForm from "../components/TransactionForm";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/ConfirmModal";
import ExportButton from "../components/ExportButton";
import '../styles/Transactions.css';

export default function Transactions() {
  const { token } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ 
    type: "", 
    category: "",
    startDate: "",
    endDate: "",
    search: "",
    paymentMethod: ""
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchTransactions();
    if (searchParams.get('add') === 'true') {
      setShowForm(true);
    }
  }, [token, filters, page, searchParams]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      setError("");
      const query = new URLSearchParams({ ...filters, page }).toString();
      const res = await API.get(`/transactions?${query}`);
      
      // Handle both paginated and non-paginated responses
      if (res.data.transactions) {
        setTransactions(res.data.transactions);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setTransactions(res.data);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setError("Failed to load transactions. Please check your connection and try again.");
      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;
    
    try {
      await API.delete(`/transactions/${transactionToDelete._id}`);
      fetchTransactions();
      showSuccess('Transaction deleted successfully!');
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      showError("Failed to delete transaction. Please try again.");
    } finally {
      setShowDeleteModal(false);
      setTransactionToDelete(null);
    }
  };

  const handleEdit = (transaction) => {
    console.log("Editing transaction:", transaction); // Debug log
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    fetchTransactions();
    setShowForm(false);
    setEditingTransaction(null);
    
    // Notify other components that transactions have been updated
    localStorage.setItem('transactionUpdated', Date.now().toString());
    window.dispatchEvent(new CustomEvent('transactionUpdated'));
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/transactions/${id}`);
      fetchTransactions();
      
      // Notify other components that transactions have been updated
      localStorage.setItem('transactionUpdated', Date.now().toString());
      window.dispatchEvent(new CustomEvent('transactionUpdated'));
      
      showSuccess("Transaction deleted successfully!");
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      showError("Failed to delete transaction. Please try again.");
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters({ ...filters, [filterType]: value });
    setPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      category: "",
      startDate: "",
      endDate: "",
      search: "",
      paymentMethod: ""
    });
    setPage(1);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
    setError(""); // Clear any form errors
  };

  if (loading && transactions.length === 0) {
    return <div className="loading-message">Loading transactions...</div>;
  }

  return (
    <div className="transactions-page">
      <Navbar />
      <div className="transactions-content">
        <div className="transactions-header">
          <h2 className="transactions-title">Transactions</h2>
          <div className="header-actions">
            <ExportButton filters={filters} />
            <button 
              onClick={() => setShowForm(!showForm)} 
              className="add-btn"
            >
              {showForm ? "Cancel" : "Add Transaction"}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-row">
            <button 
              onClick={clearFilters}
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
            
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {filters.type === "income" ? (
                <>
                  <option value="salary">Salary</option>
                  <option value="freelance">Freelance</option>
                  <option value="investment">Investment</option>
                  <option value="business">Business</option>
                  <option value="gift">Gift</option>
                  <option value="other-income">Other Income</option>
                </>
              ) : filters.type === "expense" ? (
                <>
                  <option value="food">Food</option>
                  <option value="transportation">Transportation</option>
                  <option value="housing">Housing</option>
                  <option value="utilities">Utilities</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="shopping">Shopping</option>
                  <option value="education">Education</option>
                  <option value="travel">Travel</option>
                  <option value="other-expense">Other Expense</option>
                </>
              ) : (
                <>
                  <option value="salary">Salary</option>
                  <option value="freelance">Freelance</option>
                  <option value="investment">Investment</option>
                  <option value="business">Business</option>
                  <option value="gift">Gift</option>
                  <option value="other-income">Other Income</option>
                  <option value="food">Food</option>
                  <option value="transportation">Transportation</option>
                  <option value="housing">Housing</option>
                  <option value="utilities">Utilities</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="shopping">Shopping</option>
                  <option value="education">Education</option>
                  <option value="travel">Travel</option>
                  <option value="other-expense">Other Expense</option>
                </>
              )}
            </select>

            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="filter-select"
            >
              <option value="">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="credit-card">Credit Card</option>
              <option value="debit-card">Debit Card</option>
              <option value="bank-transfer">Bank Transfer</option>
              <option value="digital-wallet">Digital Wallet</option>
              <option value="check">Check</option>
            </select>
          </div>

          <div className="filter-row">
            <input
              type="text"
              placeholder="Search description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input search-input"
            />
            
            <input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="filter-input date-input"
            />
            
            <input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="filter-input date-input"
            />
          </div>
        </div>

        {/* Transaction Form */}
        {showForm && (
          <TransactionForm 
            onSuccess={handleFormSuccess}
            editTransaction={editingTransaction}
            onCancel={handleCancelForm}
          />
        )}

        {/* Transaction List */}
        <div className="transactions-list">
          {loading ? (
            <div className="loading-overlay">Loading...</div>
          ) : transactions.length === 0 ? (
            <p>No transactions found. Try adjusting your filters or add your first transaction!</p>
          ) : (
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td>{transaction.description}</td>
                    <td className={`type-badge ${transaction.type}`}>
                      {transaction.type}
                    </td>
                    <td>{transaction.category}</td>
                    <td className={`amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="edit-btn"
                        >
                          <span className="btn-icon">✏️</span>
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(transaction)} 
                          className="delete-btn"
                        >
                          <span className="btn-icon">🗑️</span>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="pagination-btn"
            >
              Previous
            </button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${transactionToDelete?.description}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}