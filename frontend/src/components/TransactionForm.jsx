import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/Authcontext";
import API from "../api";
import { useToast } from "../context/ToastContext";
import '../styles/TransactionForm.css';

export default function TransactionForm({ onSuccess, editTransaction, onCancel }) {
  const { token } = useContext(AuthContext);
  const { showError, showSuccess } = useToast();

  const [form, setForm] = useState({
    amount: "",
    type: "expense",
    category: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: "",
    tags: "",
    isRecurring: false,
    recurringFrequency: "monthly",
    recurringEndDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (editTransaction) {
      setForm({
        amount: editTransaction.amount.toString(),
        type: editTransaction.type,
        category: editTransaction.category,
        description: editTransaction.description,
        date: editTransaction.date.slice(0, 10),
        paymentMethod: editTransaction.paymentMethod || "",
        tags: Array.isArray(editTransaction.tags)
          ? editTransaction.tags.join(", ")
          : editTransaction.tags || "",
        isRecurring: editTransaction.isRecurring || false,
        recurringFrequency: editTransaction.recurringFrequency || "monthly",
        recurringEndDate: editTransaction.recurringEndDate ? editTransaction.recurringEndDate.slice(0, 10) : "",
      });
    } else {
      // Reset form when not editing
      setForm({
        amount: "",
        type: "expense",
        category: "",
        description: "",
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: "",
        tags: "",
        isRecurring: false,
        recurringFrequency: "monthly",
        recurringEndDate: "",
      });
    }
  }, [editTransaction]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
    
    // Reset category when type changes
    if (name === "type") {
      setForm(prev => ({ ...prev, type: value, category: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const transactionData = {
        ...form,
        amount: parseFloat(form.amount),
        tags: form.tags.split(",").map(tag => tag.trim()).filter(tag => tag !== ""),
      };

      if (editTransaction) {
        await API.put(`/transactions/${editTransaction._id}`, transactionData);
        showSuccess("Transaction updated successfully!");
      } else {
        await API.post("/transactions", transactionData);
        showSuccess("Transaction added successfully!");
      }

      // Notify other components that transactions have been updated
      localStorage.setItem('transactionUpdated', Date.now().toString());
      window.dispatchEvent(new CustomEvent('transactionUpdated'));
      
      onSuccess();
    } catch (error) {
      console.error("Transaction operation failed:", error);
      setError(error.response?.data?.message || "Operation failed. Please try again.");
      showError(error.response?.data?.message || "Operation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="transaction-form">
      <h3>{editTransaction ? "Edit Transaction" : "Add New Transaction"}</h3>

      {error && <div className="form-error">{error}</div>}

      <div className="form-row">
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          required
          disabled={loading}
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          required
          disabled={loading}
        >
          <option value="">Select Category</option>
          {form.type === "income" ? (
            <>
              <option value="salary">Salary</option>
              <option value="freelance">Freelance</option>
              <option value="investment">Investment</option>
              <option value="business">Business</option>
              <option value="gift">Gift</option>
              <option value="other-income">Other Income</option>
            </>
          ) : (
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
          )}
        </select>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div className="form-row">
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <select
          name="paymentMethod"
          value={form.paymentMethod}
          onChange={handleChange}
          required
          disabled={loading}
        >
          <option value="">Select Payment Method</option>
          <option value="cash">Cash</option>
          <option value="credit-card">Credit Card</option>
          <option value="debit-card">Debit Card</option>
          <option value="bank-transfer">Bank Transfer</option>
          <option value="digital-wallet">Digital Wallet</option>
          <option value="check">Check</option>
        </select>
        <input
          type="text"
          name="tags"
          placeholder="Tags (comma separated)"
          value={form.tags}
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      {/* Recurring Transaction Section */}
      <div className="recurring-section">
        <div className="recurring-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              name="isRecurring"
              checked={form.isRecurring}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              disabled={loading}
            />
            <span className="toggle-text">Make this a recurring transaction</span>
          </label>
        </div>

        {form.isRecurring && (
          <div className="recurring-options">
            <select
              name="recurringFrequency"
              value={form.recurringFrequency}
              onChange={handleChange}
              required={form.isRecurring}
              disabled={loading}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            
            <input
              type="date"
              name="recurringEndDate"
              placeholder="End Date (optional)"
              value={form.recurringEndDate}
              onChange={handleChange}
              disabled={loading}
              min={form.date}
            />
          </div>
        )}
      </div>

      <div className="form-buttons">
        <button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : editTransaction
            ? "Update Transaction"
            : "Add Transaction"}
        </button>
        <button type="button" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </form>
  );
}
           
