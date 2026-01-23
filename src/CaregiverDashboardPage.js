// src/CaregiverDashboardPage.js
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

const STATUS_OPTIONS = ["pending", "accepted", "completed", "cancelled"];

export default function CaregiverDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // reports used only to mark jobs as "Reported" vs "Report user"
  const [myReports, setMyReports] = useState([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Bookings for this caregiver
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

          console.log("Bookings loaded:", docs);
          setBookings(docs);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("Error loading bookings:", err);
          setError(err.message);
          setLoading(false);
        },
      );

      // Reports submitted by this caregiver, for "Reported" label
      const reportsQuery = query(
        collection(db, "blacklistReports"),
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
      "Do you really want to report this user to admin? Use this only for serious issues like abuse, non‑payment, or safety concerns.",
    );
    if (!confirmed) return;

    const bookingId = b.id;
    const userId = b.userId || "";
    const employeeId = user?.uid || "";

    console.log("Report user booking:", b.userName, b); // debug

    navigate(
      `/caregiver/reportuser?bookingId=${encodeURIComponent(
        bookingId,
      )}&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(
        b.userName || "",
      )}&employeeId=${encodeURIComponent(employeeId)}`,
    );
  };

  const isBookingReported = (bookingId) => {
    return myReports.some((r) => r.bookingId === bookingId);
  };

  const filtered = bookings.filter((b) =>
    statusFilter ? b.status === statusFilter : true,
  );

  if (loading) return <p style={{ color: "#9ca3af" }}>Loading jobs...</p>;

  if (error)
    return <p style={{ color: "#ef4444" }}>Error loading bookings: {error}</p>;

  return (
    <div>
      <h2 className="section-title">Job dashboard</h2>
      <p
        style={{
          fontSize: 13,
          color: "#9ca3af",
          marginTop: -4,
          marginBottom: 12,
        }}
      >
        View new requests, accept jobs, mark them as completed, and report users
        when needed.
      </p>

      {/* Filter option */}
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="col">
          <label>Status filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-title">
            {bookings.length === 0 ? "No bookings yet" : "No bookings found"}
          </p>
          <p className="empty-state-text">
            {bookings.length === 0
              ? "Waiting for users to book you!"
              : "No bookings match this filter."}
          </p>
        </div>
      )}

      {filtered.map((b) => (
        <div key={b.id} className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <strong style={{ color: "#e5e7eb" }}>
                {b.userName || "User"}
              </strong>
              <div
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  marginTop: 4,
                }}
              >
                📞 {b.userPhone || "N/A"} · 📍 {b.address || "N/A"}
              </div>
            </div>
            <span className="badge badge-accepted">
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
              style={{
                fontSize: 13,
                color: "#e5e7eb",
                marginBottom: 6,
              }}
            >
              <strong>📅 Date:</strong> {b.date || "Not specified"}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#e5e7eb",
                marginBottom: 6,
              }}
            >
              <strong>⏰ Time:</strong> {b.time || "Not specified"}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#e5e7eb",
                marginBottom: 6,
              }}
            >
              <strong>⏱️ Duration:</strong> {b.durationHours || "N/A"} hours
            </p>
            <p style={{ fontSize: 13, color: "#e5e7eb" }}>
              <strong>🏠 Location:</strong> {b.address || "Not specified"}
            </p>
          </div>

          {/* Special notes */}
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

          {/* Payment information */}
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
                <strong>💰 Amount:</strong> ₹{b.totalAmount}
              </p>
              {b.paymentMethod && (
                <p style={{ fontSize: 12, color: "#9ca3af" }}>
                  <strong>Payment method:</strong>{" "}
                  {b.paymentMethod === "fonepay" ? "💳 Fonepay" : "💵 Cash"}
                </p>
              )}
              {b.paymentStatus && (
                <p
                  style={{
                    fontSize: 12,
                    color: b.paymentStatus === "paid" ? "#22c55e" : "#fbbf24",
                  }}
                >
                  <strong>Status:</strong>{" "}
                  {b.paymentStatus === "paid" ? "✓ Paid" : "⏳ Payment pending"}
                </p>
              )}
            </div>
          )}

          {/* Booking ID and created date */}
          <div
            style={{
              fontSize: 11,
              color: "#6b7280",
              marginTop: 10,
            }}
          >
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
                >
                  ✓ Accept
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => updateStatus(b.id, "cancelled")}
                  style={{
                    background: "#7f1d1d",
                    color: "#fecaca",
                    borderColor: "#991b1b",
                  }}
                >
                  ✗ Cancel
                </button>
              </>
            )}

            {b.status === "accepted" && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => updateStatus(b.id, "completed")}
                >
                  ✓ Mark completed
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => updateStatus(b.id, "cancelled")}
                  style={{
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
                      background: "#111827",
                      color: "#fecaca",
                      borderColor: "#991b1b",
                    }}
                  >
                    🚫 Report user
                  </button>
                )}
              </>
            )}

            {b.status === "completed" && (
              <>
                <div
                  style={{
                    fontSize: 13,
                    color: "#22c55e",
                  }}
                >
                  ✓ Job completed
                </div>

                {isBookingReported(b.id) ? (
                  <button
                    className="btn btn-outline"
                    disabled
                    style={{
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
                      background: "#111827",
                      color: "#fecaca",
                      borderColor: "#991b1b",
                    }}
                  >
                    🚫 Report user
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
      ))}

      {/* Summary card */}
      {bookings.length > 0 && (
        <div
          className="card"
          style={{
            marginTop: 20,
            background: "#0b1120",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 12,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              Total jobs
            </p>
            <p
              style={{
                fontSize: 18,
                color: "#0ea5e9",
                fontWeight: "600",
                margin: 0,
              }}
            >
              {bookings.length}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              Pending
            </p>
            <p
              style={{
                fontSize: 18,
                color: "#fbbf24",
                fontWeight: "600",
                margin: 0,
              }}
            >
              {bookings.filter((b) => b.status === "pending").length}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              Accepted
            </p>
            <p
              style={{
                fontSize: 18,
                color: "#0ea5e9",
                fontWeight: "600",
                margin: 0,
              }}
            >
              {bookings.filter((b) => b.status === "accepted").length}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              Completed
            </p>
            <p
              style={{
                fontSize: 18,
                color: "#22c55e",
                fontWeight: "600",
                margin: 0,
              }}
            >
              {bookings.filter((b) => b.status === "completed").length}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                margin: 0,
              }}
            >
              Total earned
            </p>
            <p
              style={{
                fontSize: 18,
                color: "#10b981",
                fontWeight: "600",
                margin: 0,
              }}
            >
              ₹
              {bookings
                .filter((b) => b.status === "completed")
                .reduce((sum, b) => sum + (b.totalAmount || 0), 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
