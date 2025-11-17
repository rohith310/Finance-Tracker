import { useState, useEffect } from "react";
import API from "../api";
import { useToast } from "../context/ToastContext";
import "../styles/BudgetManager.css";

const BudgetManager = () => {
  const [budgets, setBudgets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "",
    amount: "",
    period: "monthly"
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const categories = [
    "food", "transportation", "housing", "utilities", "healthcare",
    "entertainment", "shopping", "education", "travel", "other-expense"
  ];

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const res = await API.get("/budgets");
      setBudgets(res.data);
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post("/budgets", {
        ...form,
        amount: parseFloat(form.amount)
      });
      
      fetchBudgets();
      setForm({ category: "", amount: "", period: "monthly" });
      setShowForm(false);
      showSuccess("Budget created successfully!");
    } catch (error) {
      console.error("Failed to create budget:", error);
      showError("Failed to create budget. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/budgets/${id}`);
      fetchBudgets();
      showSuccess("Budget deleted successfully!");
    } catch (error) {
      console.error("Failed to delete budget:", error);
      showError("Failed to delete budget. Please try again.");
    }
  };

  return (
    <div className="budget-manager">
      <div className="budget-header">
        <h3>Budget Goals</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="add-budget-btn"
        >
          {showForm ? "Cancel" : "Add Budget"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="budget-form">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
            disabled={loading}
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Budget Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
            disabled={loading}
            min="0"
            step="0.01"
          />

          <select
            value={form.period}
            onChange={(e) => setForm({ ...form, period: e.target.value })}
            required
            disabled={loading}
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="yearly">Yearly</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Budget"}
          </button>
        </form>
      )}

      <div className="budget-list">
        {budgets.map(budget => (
          <BudgetCard 
            key={budget._id} 
            budget={budget} 
            onDelete={() => handleDelete(budget._id)}
          />
        ))}
      </div>
    </div>
  );
};

const BudgetCard = ({ budget, onDelete }) => {
  const [spent, setSpent] = useState(0);

  useEffect(() => {
    fetchSpentAmount();
  }, [budget]);

  const fetchSpentAmount = async () => {
    try {
      const res = await API.get(`/transactions/category/${budget.category}/spent`);
      setSpent(res.data.spent);
    } catch (error) {
      console.error("Failed to fetch spent amount:", error);
    }
  };

  const percentage = (spent / budget.amount) * 100;
  const isOverBudget = spent > budget.amount;

  return (
    <div className={`budget-card ${isOverBudget ? 'over-budget' : ''}`}>
      <div className="budget-info">
        <h4>{budget.category.charAt(0).toUpperCase() + budget.category.slice(1).replace('-', ' ')}</h4>
        <div className="budget-amounts">
          <span className="spent">${spent.toFixed(2)}</span>
          <span className="separator">/</span>
          <span className="total">${budget.amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className={`progress-fill ${isOverBudget ? 'over-budget' : ''}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>

      <div className="budget-footer">
        <span className={`percentage ${isOverBudget ? 'over-budget' : ''}`}>
          {percentage.toFixed(1)}%
        </span>
        <button onClick={onDelete} className="delete-budget-btn">
          Delete
        </button>
      </div>

      {isOverBudget && (
        <div className="budget-warning">
          ⚠️ Over budget by ${(spent - budget.amount).toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default BudgetManager;
