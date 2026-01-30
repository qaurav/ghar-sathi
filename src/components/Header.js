import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";
import logoSewak from '../logoSewak.jpeg'

export default function Header({ user, userRole, userDoc, onLogout }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  const getRoleIcon = (role) => {
    switch (role) {
      case "user":
        return "👨‍👩‍👧";
      case "caregiver":
        return "👩‍💼";
      case "org_admin":
        return "🏢";
      case "superadmin":
        return "🔐";
      default:
        return "👤";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "user":
        return "Customer";
      case "caregiver":
        return "Caregiver";
      case "org_admin":
        return "Organization";
      case "superadmin":
        return "SuperAdmin";
      default:
        return "User";
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    setShowMenu(false);
  };

  const handleLogout = () => {
    onLogout();
    setShowMenu(false);
    navigate("/browse");
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
       <div
  className="header-logo"
  onClick={() => handleNavigate("/")}
  style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
>
  <img
    src={logoSewak}
    alt="Sewak"
    style={{ height: 40, width: "auto" }}
  />
  <h1 style={{ margin: 0, color: "#0ea5e9", fontSize: 22 }}>Sewak</h1>
</div>

        {/* User Menu */}
        <div className="header-menu">
          <button
            className="header-user-button"
            onClick={() => setShowMenu(!showMenu)}
          >
            <span className="header-user-avatar">{getRoleIcon(userRole)}</span>
            <span className="header-user-name">{userDoc?.name || user.email}</span>
            <span className="header-user-role">{getRoleLabel(userRole)}</span>
            <span style={{ fontSize: 16, marginLeft: 4 }}>{showMenu ? "▲" : "▼"}</span>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="header-backdrop"
                onClick={() => setShowMenu(false)}
              />
              
              <div className="header-dropdown">
                {/* User Info */}
                <div className="dropdown-header">
                  <p style={{ margin: 0, color: "#e5e7eb", fontSize: 13 }}>
                    <strong>{userDoc?.name}</strong>
                  </p>
                  <p style={{ margin: 0, color: "#9ca3af", fontSize: 12 }}>
                    {user.email}
                  </p>
                  {userRole === "caregiver" && userDoc?.organizationName && (
                    <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: 11 }}>
                      🏢 {userDoc.organizationName}
                    </p>
                  )}
                  {userRole === "org_admin" && userDoc?.organizationName && (
                    <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: 11 }}>
                      🏢 {userDoc.organizationName}
                    </p>
                  )}
                </div>

                <div className="dropdown-divider"></div>

                {/* Navigation Items - User/Customer */}
                {userRole === "user" && (
                  <>
                    <button
                      className="dropdown-item"
                      onClick={() => handleNavigate("/user")}
                    >
                      📋 Browse Caregivers
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => handleNavigate("/user/profile")}
                    >
                      👤 My Profile
                    </button>
                  </>
                )}

                {/* Navigation Items - Caregiver */}
                {userRole === "caregiver" && (
                  <>
                    <button
                      className="dropdown-item"
                      onClick={() => handleNavigate("/caregiver")}
                    >
                      📊 Job Dashboard
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => handleNavigate("/caregiver")}
                    >
                      💰 My Earnings
                    </button>
                  </>
                )}

                {/* Navigation Items - Organization Admin */}
                {userRole === "org_admin" && (
                  <>
                    <button
                      className="dropdown-item"
                      onClick={() => handleNavigate("/organization")}
                    >
                      👥 Manage Caregivers
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => handleNavigate("/organization")}
                    >
                      📅 All Bookings
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => handleNavigate("/organization")}
                    >
                      🏢 Organization Profile
                    </button>
                  </>
                )}

                {/* Navigation Items - SuperAdmin */}
                {userRole === "superadmin" && (
                  <>
                    <button
                      className="dropdown-item"
                      onClick={() => handleNavigate("/superadmin")}
                    >
                      🏢 All Organizations
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => handleNavigate("/superadmin")}
                    >
                      👥 All Caregivers
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => handleNavigate("/superadmin")}
                    >
                      📅 All Bookings
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => handleNavigate("/superadmin")}
                    >
                      🛠️ Services
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => handleNavigate("/superadmin")}
                    >
                      🚫 Reports
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => handleNavigate("/superadmin")}
                    >
                      ⚙️ Settings
                    </button>
                  </>
                )}

                <div className="dropdown-divider"></div>

                {/* Logout */}
                <button className="dropdown-item logout" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
