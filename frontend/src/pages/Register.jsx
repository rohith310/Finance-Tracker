import { useState, useContext } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/Authcontext";
import { useToast } from "../context/ToastContext";
import '../styles/Register.css';

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Attempting registration..."); // Debug
      const res = await API.post("/auth/register", form);
      console.log("Registration successful, token:", res.data.token); // Debug
      
      login(res.data.token);
      showSuccess("Account created successfully! Welcome to Financial Tracker.");
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration error:", err); // Debug
      const errorMessage = err.response?.data?.message || "Registration failed";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Create Account - Financial Tracker</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="register-form">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <input
          type="password"
          name="password"
          placeholder="Password (min 6 characters)"
          value={form.password}
          onChange={handleChange}
          required
          minLength="6"
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Register"}
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        Already have an account?{" "}
        <a href="/login" style={{ color: "#007bff" }}>
          Login here
        </a>
      </p>
    </div>
  );
}
