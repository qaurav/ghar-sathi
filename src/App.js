import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import AuthPage from "./AuthPage";
import UserProfilePage from "./UserProfilePage";
import CaregiverProfilePage from "./CaregiverProfilePage";
import CaregiverDashboardPage from "./CaregiverDashboardPage";
import CaregiverListPage from "./CaregiverListPage";
import BookingFormPage from "./BookingFormPage";
import MyBookingsPage from "./MyBookingsPage";
import AdminDashboardPage from "./AdminDashboardPage";
import OrganizationDashboard from "./OrganizationDashboard";
import CaregiverReportUserPage from "./CaregiverReportUserPage";
import Header from "./components/Header";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import "./App.css";
import logoSewak from "./logoSewak.jpeg";

function App() {
  const { user, loading, userRole, userDoc } = useAuth();
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [userCategory, setUserCategory] = useState("");
  const [userWorkType, setUserWorkType] = useState("");
  const [userShift, setUserShift] = useState("");
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSelectedCaregiver(null);
      setShowMyBookings(false);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    if (!user || !userRole) return;

    const path = window.location.pathname;

    // Only auto-redirect from neutral pages
    if (path === "/" || path === "/browse" || path === "/auth") {
      if (userRole === "org_admin") {
        navigate("/organization/profile", { replace: true });
      } else if (userRole === "user") {
        navigate("/user/profile", { replace: true });
      }
    }
  }, [user, userRole, navigate]);

  // Global loading state while Firebase auth initializes
  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: 50, color: "#9ca3af" }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Prevent routing until Firestore userRole is known
  if (user && !userRole) {
    return (
      <div style={{ textAlign: "center", paddingTop: 50, color: "#9ca3af" }}>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // NOT LOGGED IN - PUBLIC ROUTES
  if (!user) {
    return (
      <Routes>
        <Route
          path="/browse"
          element={
            <div className="app-shell">
              <div className="app-card">
                <div className="app-header">
                  <div
                    className="header-logo"
                    onClick={() => navigate("/")}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <img
                      src={logoSewak}
                      alt="Sewak"
                      style={{ height: 40, width: "auto" }}
                    />
                    <h1 style={{ margin: 0, color: "#0ea5e9", fontSize: 22 }}>
                      Sewak
                    </h1>
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
                      🏥 Care Giver
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

                <CaregiverListPage
                  onSelectCaregiver={() => (window.location.href = "/auth")}
                  preselectedWorkType={userWorkType}
                  preselectedShift={userShift}
                  userCategory={userCategory}
                  onChangeUserCategory={setUserCategory}
                  requireLogin={true}
                />
              </div>
            </div>
          }
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/caregiver/reportuser"
          element={<CaregiverReportUserPage />}
        />
        <Route path="*" element={<Navigate to="/browse" replace />} />
      </Routes>
    );
  }

  // LOGGED IN - FORCE PROFILE COMPLETION FOR NORMAL USERS
  if (userRole === "user" && !userDoc?.profileComplete) {
    return (
      <>
        <Header
          user={user}
          userRole={userRole}
          userDoc={userDoc}
          onLogout={handleLogout}
        />
        <Routes>
          <Route path="/user/profile" element={<UserProfilePage />} />
          <Route path="*" element={<Navigate to="/user/profile" replace />} />
        </Routes>
      </>
    );
  }

  // LOGGED IN - ROUTES BY ROLE
  return (
    <>
      <Header
        user={user}
        userRole={userRole}
        userDoc={userDoc}
        onLogout={handleLogout}
      />
      <Routes>
        {/* USER ROUTES */}
        {userRole === "user" && (
          <>
            <Route path="/user/profile" element={<UserProfilePage />} />
            <Route
              path="/user/*"
              element={
                selectedCaregiver ? (
                  <div className="app-shell">
                    <div className="app-card">
                      <div className="app-header">
                        <div>
                          <h1 className="app-title">Sewak – Booking</h1>
                          <p className="app-subtitle">
                            Confirm service details
                          </p>
                        </div>
                        <div className="app-header-actions">
                          <button
                            className="btn btn-outline"
                            onClick={() => setSelectedCaregiver(null)}
                          >
                            Back
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
                  <div className="app-shell">
                    <div className="app-card">
                      <div className="app-header">
                        <div>
                          <h1 className="app-title">My Bookings</h1>
                        </div>
                        <div className="app-header-actions">
                          <button
                            className="btn btn-outline"
                            onClick={() => setShowMyBookings(false)}
                          >
                            Browse Caregivers
                          </button>
                        </div>
                      </div>
                      <MyBookingsPage />
                    </div>
                  </div>
                ) : (
                  <div className="app-shell">
                    <div className="app-card">
                      <div className="app-header">
                        <div>
                          <h1 className="app-title">Sewak</h1>
                          <p className="app-subtitle">
                            Find trusted caregivers
                          </p>
                        </div>
                        <div className="app-header-actions">
                          <button
                            className="btn btn-outline"
                            onClick={() => setShowMyBookings(true)}
                          >
                            My Bookings
                          </button>
                        </div>
                      </div>

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
                            🏥 Care Giver
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

                      <CaregiverListPage
                        onSelectCaregiver={setSelectedCaregiver}
                        preselectedWorkType={userWorkType}
                        preselectedShift={userShift}
                        userCategory={userCategory}
                        onChangeUserCategory={setUserCategory}
                        requireLogin={false}
                      />
                    </div>
                  </div>
                )
              }
            />
          </>
        )}

        {/* ORGANIZATION ADMIN ROUTES */}
        {userRole === "org_admin" && (
          <Route
            path="/organization/*"
            element={
              <div className="app-shell">
                <div className="app-card">
                  <OrganizationDashboard />
                </div>
              </div>
            }
          />
        )}

        {/* CAREGIVER ROUTES */}
        {userRole === "caregiver" && (
          <Route
            path="/caregiver/*"
            element={
              <div className="app-shell">
                <div className="app-card">
                  <CaregiverDashboardPage />
                </div>
              </div>
            }
          />
        )}

        {/* SUPERADMIN ROUTES */}
        {userRole === "superadmin" && (
          <Route
            path="/superadmin/*"
            element={
              <div className="app-shell">
                <div className="app-card">
                  <AdminDashboardPage />
                </div>
              </div>
            }
          />
        )}

        {/* Report user page */}
        <Route
          path="/caregiver/reportuser"
          element={<CaregiverReportUserPage />}
        />

        {/* Fallback redirects */}
        <Route
          path="*"
          element={
            userRole === "superadmin" ? (
              <Navigate to="/superadmin" replace />
            ) : userRole === "org_admin" ? (
              <Navigate to="/organization" replace />
            ) : userRole === "caregiver" ? (
              <Navigate to="/caregiver" replace />
            ) : userRole === "user" ? (
              userDoc?.profileComplete ? (
                <Navigate to="/user" replace />
              ) : (
                <Navigate to="/user/profile" replace />
              )
            ) : (
              <Navigate to="/browse" replace />
            )
          }
        />
      </Routes>
    </>
  );
}

export default App;
