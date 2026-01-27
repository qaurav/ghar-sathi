import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "./firebaseConfig"; // Make sure auth is imported

const STATUS_OPTIONS = ["pending", "accepted", "completed", "cancelled"];
const SHIFT_OPTIONS = ["morning", "day", "night"];

export default function CaregiverDashboardPage() {
  const { user, userDoc } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("jobs");
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [services, setServices] = useState([]);
  // Password Change States
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [earnings, setEarnings] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    commissioned: 0,
  });

  // Profile Edit States
  const [profileData, setProfileData] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCategory, setEditCategory] = useState("caregiver");
  const [editWorkType, setEditWorkType] = useState("part_time");
  const [editShifts, setEditShifts] = useState([]);
  const [editServices, setEditServices] = useState([]);
  const [editHourlyRate, setEditHourlyRate] = useState(0);
  const [editExperience, setEditExperience] = useState(0);
  const [editAvailable, setEditAvailable] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const COMMISSION_RATE = 15;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Load bookings
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("caregiverId", "==", user.uid),
      );

      const unsubBookings = onSnapshot(
        bookingsQuery,
        (snap) => {
          const docs = snap.docs
            .map((d) => ({
              id: d.id,
              ...d.data(),
            }))
            .sort((a, b) => {
              const timeA = a.createdAt?.toDate?.() || new Date(0);
              const timeB = b.createdAt?.toDate?.() || new Date(0);
              return timeB - timeA;
            });

          setBookings(docs);

          // Calculate earnings
          const completed = docs.filter((b) => b.status === "completed");
          const totalEarnings = completed.reduce(
            (sum, b) => sum + (b.totalAmount || 0),
            0,
          );
          const platformCommission = (totalEarnings * COMMISSION_RATE) / 100;
          const vendorEarnings = totalEarnings - platformCommission;

          setEarnings({
            total: totalEarnings,
            pending: docs.filter((b) => b.status === "pending").length,
            completed: completed.length,
            commissioned: vendorEarnings,
          });

          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("Error loading bookings:", err);
          setError(err.message);
          setLoading(false);
        },
      );

      // Load reports
      const reportsQuery = query(
        collection(db, "caregiverReports"),
        where("reportedBy", "==", user.uid),
      );

      const unsubReports = onSnapshot(
        reportsQuery,
        (snap) => {
          const docs = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
              const timeA = a.createdAt?.toDate?.() || new Date(0);
              const timeB = b.createdAt?.toDate?.() || new Date(0);
              return timeB - timeA;
            });
          setMyReports(docs);
        },
        (err) => {
          console.error("Error loading reports:", err);
        },
      );

      return () => {
        unsubBookings();
        unsubReports();
      };
    } catch (err) {
      console.error("Query error:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [user]);

  // Load profile data and services
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        // Load vendor profile
        const vendorSnap = await getDoc(doc(db, "vendors", user.uid));
        if (vendorSnap.exists()) {
          const data = vendorSnap.data();
          setProfileData(data);
          setEditName(data.name || "");
          setEditPhone(data.phone || "");
          setEditLocation(data.location || "");
          setEditBio(data.bio || "");
          setEditCategory(data.category || "caregiver");
          setEditWorkType(data.workType || "part_time");
          setEditShifts(data.shifts || []);
          setEditServices(data.servicesOffered || []);
          setEditHourlyRate(data.hourlyRate || 0);
          setEditExperience(data.experience || 0);
          setEditAvailable(data.isAvailable ?? true);
        }

        // Load services
        const servicesSnap = await getDocs(collection(db, "services"));
        const servicesData = servicesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setServices(servicesData);
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };

    loadProfile();
  }, [user]);

  const updateStatus = async (bookingId, newStatus) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: newStatus,
      });
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Could not update status. Please try again.");
    }
  };

  const handleReportUser = (b) => {
    const confirmed = window.confirm(
      "Report this user to your organization? Use this only for serious issues.",
    );
    if (!confirmed) return;

    navigate(
      `/caregiver/reportuser?bookingId=${encodeURIComponent(
        b.id,
      )}&userId=${encodeURIComponent(b.userId || "")}&userName=${encodeURIComponent(
        b.userName || "",
      )}&caregiverId=${encodeURIComponent(user?.uid || "")}&organizationId=${encodeURIComponent(
        userDoc?.organizationId || "",
      )}`,
    );
  };

  const isBookingReported = (bookingId) => {
    return myReports.some((r) => r.bookingId === bookingId);
  };

  // Profile editing functions
  const toggleShift = (shift) => {
    if (editShifts.includes(shift)) {
      setEditShifts(editShifts.filter((s) => s !== shift));
    } else {
      setEditShifts([...editShifts, shift]);
    }
  };

  const toggleService = (serviceId) => {
    if (editServices.includes(serviceId)) {
      setEditServices(editServices.filter((s) => s !== serviceId));
    } else {
      setEditServices([...editServices, serviceId]);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError(null);

    if (!editName || !editLocation) {
      setError("Name and location are required");
      return;
    }

    try {
      setSavingProfile(true);

      const finalShifts = editWorkType === "part_time" ? editShifts : [];

      await updateDoc(doc(db, "vendors", user.uid), {
        name: editName,
        phone: editPhone,
        location: editLocation,
        bio: editBio,
        category: editCategory,
        workType: editWorkType,
        shifts: finalShifts,
        servicesOffered: editServices,
        hourlyRate: Number(editHourlyRate),
        experience: Number(editExperience),
        isAvailable: editAvailable,
        updatedAt: new Date().toISOString(),
      });

      // Also update user doc
      await updateDoc(doc(db, "users", user.uid), {
        name: editName,
        phone: editPhone,
        location: editLocation,
      });

      alert("Profile updated successfully!");

      // Reload profile
      const vendorSnap = await getDoc(doc(db, "vendors", user.uid));
      if (vendorSnap.exists()) {
        setProfileData(vendorSnap.data());
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Could not save profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const getTabStyle = (tabName) => ({
    padding: "8px 16px",
    borderRadius: "6px",
    border: activeTab === tabName ? "none" : "1px solid #1f2937",
    background:
      activeTab === tabName
        ? "linear-gradient(135deg, #0ea5e9, #06b6d4)"
        : "#020617",
    color: activeTab === tabName ? "white" : "#e5e7eb",
    cursor: "pointer",
    fontWeight: activeTab === tabName ? "600" : "500",
    fontSize: 13,
  });

  const filtered = bookings.filter((b) =>
    statusFilter ? b.status === statusFilter : true,
  );

  if (loading)
    return (
      <p style={{ color: "#9ca3af", textAlign: "center", padding: 20 }}>
        Loading dashboard...
      </p>
    );

  if (error && !profileData)
    return (
      <p style={{ color: "#ef4444", textAlign: "center", padding: 20 }}>
        Error: {error}
      </p>
    );

  return (
    <div>
      <h2 className="section-title">Caregiver Dashboard</h2>
      <p
        style={{
          fontSize: 13,
          color: "#9ca3af",
          marginTop: -4,
          marginBottom: 12,
        }}
      >
        Manage jobs and update your profile
      </p>

      {/* Organization Info */}
      {userDoc?.organizationName && (
        <div
          style={{
            background: "#dbeafe",
            color: "#0369a1",
            padding: 12,
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
            border: "1px solid #7dd3fc",
          }}
        >
          🏢 You're part of <strong>{userDoc.organizationName}</strong>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {/* Tabs */}
      <div className="choice-buttons" style={{ marginBottom: 24 }}>
        <button
          type="button"
          style={getTabStyle("jobs")}
          onClick={() => setActiveTab("jobs")}
        >
          📊 Jobs ({bookings.length})
        </button>
        <button
          type="button"
          style={getTabStyle("profile")}
          onClick={() => setActiveTab("profile")}
        >
          👤 My Profile
        </button>
        <button
          type="button"
          style={getTabStyle("earnings")}
          onClick={() => setActiveTab("earnings")}
        >
          💰 Earnings
        </button>
      </div>

      {/* ========== JOBS TAB ========== */}
      {activeTab === "jobs" && (
        <div>
          {/* Filter */}
          <div className="row" style={{ marginBottom: 12 }}>
            <div className="col">
              <label>Filter by status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All jobs</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bookings List */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-title">
                {bookings.length === 0
                  ? "No bookings yet"
                  : "No bookings found"}
              </p>
              <p className="empty-state-text">
                {bookings.length === 0
                  ? "Waiting for users to book you!"
                  : "No bookings match this filter."}
              </p>
            </div>
          ) : (
            filtered.map((b) => (
              <div key={b.id} className="card" style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <strong style={{ color: "#e5e7eb", fontSize: 14 }}>
                      {b.userName || "User"}
                    </strong>
                    <div
                      style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}
                    >
                      📞 {b.userPhone || "N/A"} · 📍 {b.address || "N/A"}
                    </div>
                  </div>
                  <span
                    style={{
                      background:
                        b.status === "pending"
                          ? "#fef3c7"
                          : b.status === "accepted"
                            ? "#dbeafe"
                            : b.status === "completed"
                              ? "#dcfce7"
                              : "#fee2e2",
                      color:
                        b.status === "pending"
                          ? "#92400e"
                          : b.status === "accepted"
                            ? "#0369a1"
                            : b.status === "completed"
                              ? "#15803d"
                              : "#991b1b",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    {(b.status || "pending").toUpperCase()}
                  </span>
                </div>

                {/* Booking details */}
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px solid #1f2937",
                  }}
                >
                  <p
                    style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 6 }}
                  >
                    <strong>📅 Date:</strong> {b.date || "Not specified"}
                  </p>
                  <p
                    style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 6 }}
                  >
                    <strong>⏰ Time:</strong> {b.time || "Not specified"}
                  </p>
                  <p
                    style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 6 }}
                  >
                    <strong>⏱️ Duration:</strong> {b.durationHours || "N/A"}{" "}
                    hours
                  </p>
                  <p style={{ fontSize: 13, color: "#e5e7eb" }}>
                    <strong>🏠 Location:</strong> {b.address || "Not specified"}
                  </p>
                </div>

                {/* Notes */}
                {b.notes && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#cbd5f5",
                      marginTop: 10,
                      fontStyle: "italic",
                      borderLeft: "3px solid #0ea5e9",
                      paddingLeft: 10,
                    }}
                  >
                    <strong>📝 User notes:</strong> {b.notes}
                  </p>
                )}

                {/* Payment Info */}
                {b.totalAmount && (
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: "1px solid #1f2937",
                      background: "#0b1120",
                      padding: "10px",
                      borderRadius: "8px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        color: "#e5e7eb",
                        marginBottom: 4,
                      }}
                    >
                      <strong>💰 Total Amount:</strong> ₹{b.totalAmount}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#22c55e",
                        marginBottom: 4,
                      }}
                    >
                      <strong>Your Earnings:</strong> ₹
                      {Math.round(b.vendorEarnings || b.totalAmount * 0.85)}
                    </p>
                    <p style={{ fontSize: 11, color: "#fbbf24" }}>
                      Platform fee: ₹
                      {Math.round(b.platformCommission || b.totalAmount * 0.15)}{" "}
                      ({COMMISSION_RATE}%)
                    </p>
                    {b.paymentMethod && (
                      <p
                        style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}
                      >
                        <strong>Payment:</strong>{" "}
                        {b.paymentMethod === "fonepay"
                          ? "💳 Fonepay"
                          : "💵 Cash"}
                      </p>
                    )}
                  </div>
                )}

                {/* Booking ID */}
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 10 }}>
                  Booking ID: {b.id.substring(0, 8)}... · Created:{" "}
                  {b.createdAt?.toDate?.().toLocaleDateString?.() || "N/A"}
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 12,
                    flexWrap: "wrap",
                  }}
                >
                  {b.status === "pending" && (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => updateStatus(b.id, "accepted")}
                        style={{ flex: 1 }}
                      >
                        ✓ Accept
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => updateStatus(b.id, "cancelled")}
                        style={{
                          flex: 1,
                          background: "#7f1d1d",
                          color: "#fecaca",
                          borderColor: "#991b1b",
                        }}
                      >
                        ✗ Decline
                      </button>
                    </>
                  )}

                  {b.status === "accepted" && (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => updateStatus(b.id, "completed")}
                        style={{ flex: 1 }}
                      >
                        ✓ Mark Complete
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => updateStatus(b.id, "cancelled")}
                        style={{
                          flex: 1,
                          background: "#7f1d1d",
                          color: "#fecaca",
                          borderColor: "#991b1b",
                        }}
                      >
                        ✗ Cancel
                      </button>

                      {isBookingReported(b.id) ? (
                        <button
                          className="btn btn-outline"
                          disabled
                          style={{
                            flex: 1,
                            background: "#111827",
                            color: "#9ca3af",
                            borderColor: "#4b5563",
                            cursor: "default",
                          }}
                        >
                          ✅ Reported
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline"
                          onClick={() => handleReportUser(b)}
                          style={{
                            flex: 1,
                            background: "#111827",
                            color: "#fecaca",
                            borderColor: "#991b1b",
                          }}
                        >
                          🚫 Report User
                        </button>
                      )}
                    </>
                  )}

                  {b.status === "completed" && (
                    <>
                      <div style={{ fontSize: 13, color: "#22c55e", flex: 1 }}>
                        ✓ Job completed
                      </div>

                      {!isBookingReported(b.id) && (
                        <button
                          className="btn btn-outline"
                          onClick={() => handleReportUser(b)}
                          style={{
                            flex: 1,
                            background: "#111827",
                            color: "#fecaca",
                            borderColor: "#991b1b",
                          }}
                        >
                          🚫 Report User
                        </button>
                      )}
                    </>
                  )}

                  {b.status === "cancelled" && (
                    <div style={{ fontSize: 13, color: "#ef4444" }}>
                      ✗ Job cancelled
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========== PROFILE TAB ========== */}
      {activeTab === "profile" && (
        <div>
          <h3 style={{ color: "#e5e7eb", marginBottom: 12 }}>
            Edit Your Profile
          </h3>

          <form onSubmit={handleSaveProfile} className="form">
            <label>Full Name *</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              placeholder="Your full name"
            />

            <label>Phone Number</label>
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="98XXXXXXXX"
              maxLength={10}
            />

            <label>Location *</label>
            <input
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              required
              placeholder="e.g., Kathmandu"
            />

            <label>Bio / About Yourself</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Tell customers about yourself, your experience, and specialties"
              rows={4}
            />

            {/* Category - NOW EDITABLE */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  color: "#e5e7eb",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Category *
              </label>

              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid #1f2937",
                  background: "#111827",
                  color: "#e5e7eb",
                  marginTop: "8px",
                  boxSizing: "border-box",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <option value="caregiver">
                  🏥 Care Giver (Only care giving services)
                </option>
                <option value="household">
                  🏠 Household (Only household services)
                </option>
                <option value="both">
                  👥 Both (Care Giver & Household services)
                </option>
              </select>
              <p
                style={{
                  fontSize: "11px",
                  color: "#9ca3af",
                  marginTop: "6px",
                  margin: "6px 0 0 0",
                }}
              >
                {editCategory === "both"
                  ? "✓ You can provide both care giving and household services"
                  : editCategory === "caregiver"
                    ? "You provide care giving services only"
                    : "You provide household services only"}
              </p>
            </div>

            <label>Availability</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setEditAvailable(true)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: editAvailable ? "none" : "1px solid #1f2937",
                  background: editAvailable ? "#22c55e" : "#111827",
                  color: editAvailable ? "white" : "#e5e7eb",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                ✓ Available
              </button>
              <button
                type="button"
                onClick={() => setEditAvailable(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: !editAvailable ? "none" : "1px solid #1f2937",
                  background: !editAvailable ? "#ef4444" : "#111827",
                  color: !editAvailable ? "white" : "#e5e7eb",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                ✗ Not Available
              </button>
            </div>

            <label>Work Type</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setEditWorkType("full_time");
                  setEditShifts([]);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border:
                    editWorkType === "full_time" ? "none" : "1px solid #1f2937",
                  background:
                    editWorkType === "full_time" ? "#0ea5e9" : "#111827",
                  color: editWorkType === "full_time" ? "white" : "#e5e7eb",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                💼 Full Time
              </button>
              <button
                type="button"
                onClick={() => setEditWorkType("part_time")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border:
                    editWorkType === "part_time" ? "none" : "1px solid #1f2937",
                  background:
                    editWorkType === "part_time" ? "#fbbf24" : "#111827",
                  color: editWorkType === "part_time" ? "black" : "#e5e7eb",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                ⏰ Part Time
              </button>
            </div>

            {editWorkType === "part_time" && (
              <>
                <label>Shifts</label>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 12,
                  }}
                >
                  {SHIFT_OPTIONS.map((shift) => (
                    <button
                      key={shift}
                      type="button"
                      onClick={() => toggleShift(shift)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: editShifts.includes(shift)
                          ? "none"
                          : "1px solid #1f2937",
                        background: editShifts.includes(shift)
                          ? "#0ea5e9"
                          : "#111827",
                        color: editShifts.includes(shift) ? "white" : "#e5e7eb",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {shift === "morning"
                        ? "🌅 Morning"
                        : shift === "day"
                          ? "☀️ Day"
                          : "🌙 Night"}
                    </button>
                  ))}
                </div>
              </>
            )}

            <label>Services You Offer</label>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              {services.length === 0 ? (
                <p style={{ fontSize: 12, color: "#9ca3af" }}>
                  No services available
                </p>
              ) : (
                services
                  .filter((s) => {
                    if (editCategory === "both") {
                      return (
                        s.organizationId === userDoc?.organizationId ||
                        !s.organizationId
                      );
                    }
                    return (
                      (s.organizationId === userDoc?.organizationId ||
                        !s.organizationId) &&
                      (s.category === editCategory || s.category === "both")
                    );
                  })
                  .map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(service.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: editServices.includes(service.id)
                          ? "none"
                          : "1px solid #1f2937",
                        background: editServices.includes(service.id)
                          ? "#10b981"
                          : "#111827",
                        color: editServices.includes(service.id)
                          ? "white"
                          : "#e5e7eb",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {service.label}
                    </button>
                  ))
              )}
            </div>

            <label>Hourly Rate (₹)</label>
            <input
              type="number"
              value={editHourlyRate}
              onChange={(e) => setEditHourlyRate(e.target.value)}
              min="0"
              placeholder="500"
            />

            <label>Years of Experience</label>
            <input
              type="number"
              value={editExperience}
              onChange={(e) => setEditExperience(e.target.value)}
              min="0"
              placeholder="0"
            />

            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingProfile}
              style={{ marginTop: 16 }}
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </form>

          {/* Change Password Section */}
          <div
            className="card"
            style={{ marginTop: 24, background: "#0b1120" }}
          >
            <h3 style={{ color: "#e5e7eb", marginTop: 0, marginBottom: 12 }}>
              Change Password
            </h3>

            {!showPasswordSection ? (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowPasswordSection(true)}
                style={{
                  background: "#111827",
                  color: "#e5e7eb",
                  border: "1px solid #1f2937",
                }}
              >
                🔒 Change Password
              </button>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);

                  if (!currentPassword || !newPassword || !confirmPassword) {
                    setError("Please fill all password fields");
                    return;
                  }

                  if (newPassword.length < 6) {
                    setError("New password must be at least 6 characters");
                    return;
                  }

                  if (newPassword !== confirmPassword) {
                    setError("New passwords do not match");
                    return;
                  }

                  try {
                    setChangingPassword(true);

                    // Re-authenticate
                    const credential = EmailAuthProvider.credential(
                      user.email,
                      currentPassword,
                    );
                    await reauthenticateWithCredential(user, credential);

                    // Update password
                    await updatePassword(user, newPassword);

                    alert("Password changed successfully!");
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setShowPasswordSection(false);
                  } catch (err) {
                    console.error("Error changing password:", err);
                    if (err.code === "auth/wrong-password") {
                      setError("Current password is incorrect");
                    } else if (err.code === "auth/requires-recent-login") {
                      setError(
                        "Please log out and log back in before changing password",
                      );
                    } else {
                      setError(err.message || "Could not change password");
                    }
                  } finally {
                    setChangingPassword(false);
                  }
                }}
                className="form"
              >
                <label>Current Password *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                />

                <label>New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                />

                <label>Confirm New Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Re-enter new password"
                />

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={changingPassword}
                    style={{ flex: 1 }}
                  >
                    {changingPassword ? "Changing..." : "Update Password"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setError(null);
                    }}
                    style={{
                      flex: 1,
                      background: "#111827",
                      color: "#e5e7eb",
                      border: "1px solid #1f2937",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Profile Status */}
          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: "#0b1120",
              border: "1px solid #1f2937",
              borderRadius: 8,
            }}
          >
            <h4 style={{ color: "#e5e7eb", marginTop: 0, marginBottom: 12 }}>
              Profile Status
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    color: profileData?.isApproved ? "#22c55e" : "#fbbf24",
                  }}
                >
                  {profileData?.isApproved ? "✓" : "⏳"}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: profileData?.isApproved ? "#22c55e" : "#fbbf24",
                  }}
                >
                  {profileData?.isApproved
                    ? "Approved by organization"
                    : "Pending organization approval"}
                </span>
              </div>
              {!profileData?.isApproved && (
                <p
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    marginLeft: 24,
                    margin: 0,
                  }}
                >
                  Your organization admin needs to approve your profile before
                  you appear in listings
                </p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    color: profileData?.verified ? "#22c55e" : "#9ca3af",
                  }}
                >
                  {profileData?.verified ? "✓" : "○"}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: profileData?.verified ? "#22c55e" : "#9ca3af",
                  }}
                >
                  ID verified
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    color: profileData?.backgroundChecked
                      ? "#22c55e"
                      : "#9ca3af",
                  }}
                >
                  {profileData?.backgroundChecked ? "✓" : "○"}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: profileData?.backgroundChecked
                      ? "#22c55e"
                      : "#9ca3af",
                  }}
                >
                  Background checked
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== EARNINGS TAB ========== */}
      {activeTab === "earnings" && (
        <div>
          <div
            className="card"
            style={{ marginBottom: 16, background: "#0b1120" }}
          >
            <h3 style={{ color: "#e5e7eb", marginTop: 0, marginBottom: 16 }}>
              💰 Your Earnings
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 16,
              }}
            >
              <div>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                  Total Earned
                </p>
                <p
                  style={{
                    fontSize: 20,
                    color: "#0ea5e9",
                    fontWeight: "bold",
                    margin: 0,
                  }}
                >
                  ₹{earnings.total}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                  Your Balance
                </p>
                <p
                  style={{
                    fontSize: 20,
                    color: "#22c55e",
                    fontWeight: "bold",
                    margin: 0,
                  }}
                >
                  ₹{Math.round(earnings.commissioned)}
                </p>
                <p style={{ fontSize: 10, color: "#6b7280", margin: 0 }}>
                  (After {COMMISSION_RATE}% commission)
                </p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                  Completed Jobs
                </p>
                <p
                  style={{
                    fontSize: 20,
                    color: "#10b981",
                    fontWeight: "bold",
                    margin: 0,
                  }}
                >
                  {earnings.completed}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                  Platform Fee
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: "#fbbf24",
                    fontWeight: "bold",
                    margin: 0,
                  }}
                >
                  ₹{Math.round((earnings.total * COMMISSION_RATE) / 100)}
                </p>
                <p style={{ fontSize: 10, color: "#6b7280", margin: 0 }}>
                  ({COMMISSION_RATE}%)
                </p>
              </div>
            </div>
          </div>

          {/* Earnings Breakdown */}
          <h4 style={{ color: "#e5e7eb", marginBottom: 12 }}>
            Earnings Breakdown
          </h4>

          {bookings.filter((b) => b.status === "completed").length === 0 ? (
            <div className="empty-state">
              <p style={{ color: "#9ca3af" }}>No completed jobs yet</p>
            </div>
          ) : (
            <div>
              {bookings
                .filter((b) => b.status === "completed")
                .map((b) => (
                  <div key={b.id} className="card" style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <p
                          style={{ margin: 0, fontSize: 13, color: "#e5e7eb" }}
                        >
                          <strong>{b.userName}</strong>
                        </p>
                        <p
                          style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}
                        >
                          {b.date} · {b.durationHours}h
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 14,
                            color: "#22c55e",
                            fontWeight: "bold",
                          }}
                        >
                          +₹
                          {Math.round(b.vendorEarnings || b.totalAmount * 0.85)}
                        </p>
                        <p
                          style={{ margin: 0, fontSize: 10, color: "#9ca3af" }}
                        >
                          (₹{b.totalAmount} - {COMMISSION_RATE}% fee)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
