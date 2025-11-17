import { useState } from "react";
import API from "../api";
import { useToast } from "../context/ToastContext";
import "../styles/ExportButton.css";

const ExportButton = ({ filters = {} }) => {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const convertToCSV = (transactions) => {
    if (transactions.length === 0) return "";

    const headers = ["Date", "Description", "Type", "Category", "Amount", "Payment Method", "Tags"];
    const csvContent = [
      headers.join(","),
      ...transactions.map(transaction => [
        new Date(transaction.date).toLocaleDateString(),
        `"${transaction.description}"`,
        transaction.type,
        transaction.category,
        transaction.amount,
        transaction.paymentMethod || "",
        Array.isArray(transaction.tags) ? `"${transaction.tags.join(", ")}"` : `"${transaction.tags || ""}"`
      ].join(","))
    ].join("\n");

    return csvContent;
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      // Fetch all transactions (remove pagination for export)
      const query = new URLSearchParams({ ...filters, limit: 10000 }).toString();
      const res = await API.get(`/transactions?${query}`);
      
      const transactions = res.data.transactions || res.data;
      
      if (transactions.length === 0) {
        showError("No transactions found to export.");
        return;
      }

      const csvContent = convertToCSV(transactions);
      const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadCSV(csvContent, filename);
      showSuccess(`Exported ${transactions.length} transactions successfully!`);
      
    } catch (error) {
      console.error("Export failed:", error);
      showError("Failed to export transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleExport} 
      disabled={loading}
      className="export-btn"
    >
      {loading ? (
        <>
          <span className="loading-spinner"></span>
          Exporting...
        </>
      ) : (
        <>
          <span className="export-icon">📊</span>
          Export CSV
        </>
      )}
    </button>
  );
};

export default ExportButton;
