// src/App.js
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import AuthPage from "./AuthPage";
import CaregiverProfilePage from "./CaregiverProfilePage";
import CaregiverDashboardPage from "./CaregiverDashboardPage";
import CaregiverListPage from "./CaregiverListPage";
import BookingFormPage from "./BookingFormPage";
import MyBookingsPage from "./MyBookingsPage";
import AdminDashboardPage from "./AdminDashboardPage";
import CaregiverReportUserPage from "./CaregiverReportUserPage";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import "./App.css";

function App() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState(null);
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [caregiverView, setCaregiverView] = useState("dashboard");

  // User-side flow choices
  const [userCategory, setUserCategory] = useState("both");
  const [userWorkType, setUserWorkType] = useState("");
  const [userShift, setUserShift] = useState("");

  useEffect(() => {
    const loadRole = async () => {
      if (!user) {
        setRole(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        setRole(snap.exists() ? snap.data().role : null);
      } catch (err) {
        console.error("Error loading role:", err);
      }
    };
    loadRole();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSelectedCaregiver(null);
      setShowMyBookings(false);
      setRole(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", paddingTop: 50 }}>
        <p>Loading...</p>
      </div>
    );

  // Not logged in: show browse or auth page
  if (!user) {
    return (
      <Routes>
        {/* Public browse route – see caregivers without login */}
        <Route
          path="/browse"
          element={
            <div className="app-shell">
              <div className="app-card">
                <div className="app-header">
                  <div>
                    <h1 className="app-title">Ghar Sathi</h1>
                    <p className="app-subtitle">
                      Find trusted caregivers for your family
                    </p>
                  </div>
                  <div className="app-header-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => (window.location.href = "/auth")}
                    >
                      Sign in to book
                    </button>
                  </div>
                </div>

                {/* User category choice */}
                <div className="choice-group">
                  <h3>What do you need help with?</h3>
                  <div className="choice-buttons">
                    <button
                      type="button"
                      className={`choice-btn ${
                        userCategory === "both" ? "active" : ""
                      }`}
                      onClick={() => setUserCategory("both")}
                    >
                      👥 Both
                    </button>
                    <button
                      type="button"
                      className={`choice-btn ${
                        userCategory === "caregiver" ? "active" : ""
                      }`}
                      onClick={() => setUserCategory("caregiver")}
                    >
                      🏥 Care giver
                    </button>
                    <button
                      type="button"
                      className={`choice-btn ${
                        userCategory === "household" ? "active" : ""
                      }`}
                      onClick={() => setUserCategory("household")}
                    >
                      🏠 Household
                    </button>
                  </div>
                </div>

                {/* Work type choice */}
                <div className="choice-group">
                  <h4>Work type</h4>
                  <div className="choice-buttons">
                    <button
                      type="button"
                      className={`choice-btn ${
                        userWorkType === "full_time" ? "active" : ""
                      }`}
                      onClick={() => {
                        setUserWorkType("full_time");
                        setUserShift("");
                      }}
                    >
                      💼 Full time
                    </button>
                    <button
                      type="button"
                      className={`choice-btn ${
                        userWorkType === "part_time" ? "active" : ""
                      }`}
                      onClick={() => setUserWorkType("part_time")}
                    >
                      ⏰ Part time
                    </button>
                  </div>
                </div>

                {/* Shift choice (only for part-time) */}
                {userWorkType === "part_time" && (
                  <div className="choice-group">
                    <h4>Preferred shift</h4>
                    <div className="choice-buttons">
                      {["morning", "day", "night"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`choice-btn ${
                            userShift === s ? "active" : ""
                          }`}
                          onClick={() => setUserShift(s)}
                        >
                          {s === "morning"
                            ? "🌅 Morning"
                            : s === "day"
                              ? "☀️ Day"
                              : "🌙 Night"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Caregiver list – requires login to book */}
                <CaregiverListPage
                  onSelectCaregiver={() => {
                    window.location.href = "/auth";
                  }}
                  preselectedWorkType={userWorkType}
                  preselectedShift={userShift}
                  userCategory={userCategory}
                  requireLogin={true}
                />
              </div>
            </div>
          }
        />

        {/* Auth page at /auth */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Report user page */}
        <Route path="/caregiver/reportuser" element={<CaregiverReportUserPage />} />

        {/* Fallback: redirect to browse */}
        <Route path="*" element={<Navigate to="/browse" replace />} />
      </Routes>
    );
  }

  // Logged in: define role-based routes
  return (
    <Routes>
      {/* USER ROUTE */}
      {role === "user" && (
        <Route
          path="/user/*"
          element={
            selectedCaregiver ? (
              // Booking screen
              <div className="app-shell">
                <div className="app-card">
                  <div className="app-header">
                    <div>
                      <h1 className="app-title">Ghar Sathi – Booking</h1>
                      <p className="app-subtitle">
                        Confirm service details for your caregiver
                      </p>
                    </div>
                    <div className="app-header-actions">
                      <button
                        className="btn btn-outline"
                        onClick={() => setSelectedCaregiver(null)}
                      >
                        Back to caregivers
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  </div>

                  <BookingFormPage
                    caregiver={selectedCaregiver}
                    onBooked={() => {
                      setSelectedCaregiver(null);
                      setShowMyBookings(true);
                    }}
                  />
                </div>
              </div>
            ) : showMyBookings ? (
              // My bookings (Inbox)
              <div className="app-shell">
                <div className="app-card">
                  <div className="app-header">
                    <div>
                      <h1 className="app-title">Ghar Sathi – My bookings</h1>
                      <p className="app-subtitle">
                        Track caregiver status and timings
                      </p>
                    </div>
                    <div className="app-header-actions">
                      <button
                        className="btn btn-outline"
                        onClick={() => setShowMyBookings(false)}
                      >
                        Back to caregivers
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                  <MyBookingsPage />
                </div>
              </div>
            ) : (
              // Default user caregiver list
              <div className="app-shell">
                <div className="app-card">
                  <div className="app-header">
                    <div>
                      <h1 className="app-title">Ghar Sathi – User</h1>
                      <p className="app-subtitle">
                        Find trusted caregivers for your family
                      </p>
                    </div>
                    <div className="app-header-actions">
                      <button
                        className="btn btn-outline"
                        onClick={() => setShowMyBookings(true)}
                      >
                        My bookings
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  </div>

                  {/* User category choice */}
                  <div className="choice-group">
                    <h3>What do you need help with?</h3>
                    <div className="choice-buttons">
                      <button
                        type="button"
                        className={`choice-btn ${
                          userCategory === "both" ? "active" : ""
                        }`}
                        onClick={() => setUserCategory("both")}
                      >
                        👥 Both
                      </button>
                      <button
                        type="button"
                        className={`choice-btn ${
                          userCategory === "caregiver" ? "active" : ""
                        }`}
                        onClick={() => setUserCategory("caregiver")}
                      >
                        🏥 Care giver
                      </button>
                      <button
                        type="button"
                        className={`choice-btn ${
                          userCategory === "household" ? "active" : ""
                        }`}
                        onClick={() => setUserCategory("household")}
                      >
                        🏠 Household
                      </button>
                    </div>
                  </div>

                  {/* Work type choice */}
                  <div className="choice-group">
                    <h4>Work type</h4>
                    <div className="choice-buttons">
                      <button
                        type="button"
                        className={`choice-btn ${
                          userWorkType === "full_time" ? "active" : ""
                        }`}
                        onClick={() => {
                          setUserWorkType("full_time");
                          setUserShift("");
                        }}
                      >
                        💼 Full time
                      </button>
                      <button
                        type="button"
                        className={`choice-btn ${
                          userWorkType === "part_time" ? "active" : ""
                        }`}
                        onClick={() => setUserWorkType("part_time")}
                      >
                        ⏰ Part time
                      </button>
                    </div>
                  </div>

                  {/* Shift choice (only for part-time) */}
                  {userWorkType === "part_time" && (
                    <div className="choice-group">
                      <h4>Preferred shift</h4>
                      <div className="choice-buttons">
                        {["morning", "day", "night"].map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`choice-btn ${
                              userShift === s ? "active" : ""
                            }`}
                            onClick={() => setUserShift(s)}
                          >
                            {s === "morning"
                              ? "🌅 Morning"
                              : s === "day"
                                ? "☀️ Day"
                                : "🌙 Night"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Caregiver list */}
                  <CaregiverListPage
                    onSelectCaregiver={setSelectedCaregiver}
                    preselectedWorkType={userWorkType}
                    preselectedShift={userShift}
                    userCategory={userCategory}
                    requireLogin={false}
                  />
                </div>
              </div>
            )
          }
        />
      )}

      {/* CAREGIVER ROUTE */}
      {role === "caregiver" && (
        <Route
          path="/caregiver/*"
          element={
            <div className="app-shell">
              <div className="app-card">
                <div className="app-header">
                  <div>
                    <h1 className="app-title">Ghar Sathi – Caregiver</h1>
                    <p className="app-subtitle">
                      Manage your profile and assigned jobs
                    </p>
                  </div>
                  <div className="app-header-actions">
                    <button
                      className="btn btn-outline"
                      onClick={() => setCaregiverView("profile")}
                    >
                      Profile
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => setCaregiverView("dashboard")}
                    >
                      Job dashboard
                    </button>
                    <button className="btn btn-outline" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                </div>

                {caregiverView === "profile" ? (
                  <CaregiverProfilePage />
                ) : (
                  <CaregiverDashboardPage />
                )}
              </div>
            </div>
          }
        />
      )}

      {/* ADMIN ROUTE */}
      {role === "admin" && (
        <Route
          path="/admin/*"
          element={
            <div className="app-shell">
              <div className="app-card">
                <div className="app-header">
                  <div>
                    <h1 className="app-title">Ghar Sathi – Admin</h1>
                    <p className="app-subtitle">
                      Review and verify caregiver profiles
                    </p>
                  </div>
                  <div className="app-header-actions">
                    <button className="btn btn-outline" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                </div>

                <AdminDashboardPage />
              </div>
            </div>
          }
        />
      )}

      {/* Report user page - accessible to caregivers */}
      <Route path="/caregiver/reportuser" element={<CaregiverReportUserPage />} />

      {/* Fallback: redirect to role-based path or browse */}
      <Route
        path="*"
        element={
          role === "admin" ? (
            <Navigate to="/admin" replace />
          ) : role === "caregiver" ? (
            <Navigate to="/caregiver" replace />
          ) : role === "user" ? (
            <Navigate to="/user" replace />
          ) : (
            <Navigate to="/browse" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
