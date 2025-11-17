import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/Authcontext";
import { useToast } from "../context/ToastContext";
import API from "../api";
import Navbar from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";
import '../styles/Profile.css';

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const { showSuccess, showError } = useToast();
  
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: ""
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || ""
      });
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.put("/auth/profile", profileForm);
      login(res.data.token); // Update user context with new data
      showSuccess("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update failed:", error);
      showError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      await API.put("/auth/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      showSuccess("Password changed successfully!");
    } catch (error) {
      console.error("Password change failed:", error);
      showError(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await API.delete("/auth/account");
      showSuccess("Account deleted successfully");
      // Logout and redirect would happen here
      window.location.href = "/login";
    } catch (error) {
      console.error("Account deletion failed:", error);
      showError("Failed to delete account");
    }
    setShowDeleteModal(false);
  };

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-content">
        <div className="profile-header">
          <h2 className="profile-title">Account Settings</h2>
          <div className="theme-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Dark Mode</span>
            </label>
          </div>
        </div>

        <div className="settings-grid">
          {/* Profile Information */}
          <div className="settings-card">
            <h3>Profile Information</h3>
            <form onSubmit={handleProfileUpdate} className="profile-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" disabled={loading} className="update-btn">
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </form>
          </div>

          {/* Password Change */}
          <div className="settings-card">
            <h3>Change Password</h3>
            <form onSubmit={handlePasswordChange} className="password-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  disabled={loading}
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                  minLength="6"
                />
              </div>

              <button type="submit" disabled={loading} className="update-btn">
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>

          {/* Account Actions */}
          <div className="settings-card danger-zone">
            <h3>Danger Zone</h3>
            <p>These actions cannot be undone. Please be careful.</p>
            
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="delete-account-btn"
            >
              Delete Account
            </button>
          </div>

          {/* Account Statistics */}
          <div className="settings-card">
            <h3>Account Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Member Since</span>
                <span className="stat-value">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Last Login</span>
                <span className="stat-value">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost."
        confirmText="Delete Account"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Profile;
