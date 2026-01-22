// src/MyBookingsPage.js
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

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState(""); // empty = all
  const [paymentFilter, setPaymentFilter] = useState(""); // empty = all
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Query bookings where userId matches current user
      const q = query(
        collection(db, "bookings"),
        where("userId", "==", user.uid)
      );

      const unsub = onSnapshot(
        q,
        (snap) => {
          const docs = snap.docs
            .map((d) => ({
              id: d.id,
              ...d.data(),
            }))
            // Sort by createdAt in descending order (newest first)
            .sort((a, b) => {
              const timeA = a.createdAt?.toDate?.() || new Date(0);
              const timeB = b.createdAt?.toDate?.() || new Date(0);
              return timeB - timeA;
            });

          console.log("User bookings loaded:", docs);
          setBookings(docs);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("Error loading user bookings:", err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (err) {
      console.error("Query error:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [user]);

  const cancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this booking?"
    );
    if (!confirmCancel) return;

    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: "cancelled",
      });
      alert("Booking cancelled.");
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert("Could not cancel booking. Please try again.");
    }
  };

  const filtered = bookings.filter((b) => {
    const matchStatus = statusFilter ? b.status === statusFilter : true;
    const matchPayment = paymentFilter ? b.paymentStatus === paymentFilter : true;
    return matchStatus && matchPayment;
  });

  if (loading)
    return (
      <p style={{ color: "#9ca3af" }}>Loading your bookings...</p>
    );

  if (error)
    return (
      <p style={{ color: "#ef4444" }}>Error loading bookings: {error}</p>
    );

  return (
    <div>
      <h2 className="section-title">My bookings</h2>
      <p style={{ fontSize: 13, color: "#9ca3af", marginTop: -4, marginBottom: 12 }}>
        Track your caregiver bookings, payments, and status
      </p>

      {/* Filters */}
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="col">
          <label>Booking status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All bookings</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="col">
          <label>Payment status</label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-title">No bookings</p>
          <p className="empty-state-text">
            {bookings.length === 0
              ? "You haven't booked any caregivers yet. Start browsing!"
              : "No bookings match this filter."}
          </p>
        </div>
      )}

      {filtered.map((b) => (
        <div key={b.id} className="card">
          {/* Header: Caregiver name + status badges */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <strong style={{ fontSize: 16, color: "#e5e7eb" }}>
                {b.caregiverName || "Caregiver"}
              </strong>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                📍 {b.caregiverLocation || "Location not specified"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {/* Booking status badge */}
              <span className="badge badge-accepted">
                {(b.status || "pending").toUpperCase()}
              </span>

              {/* Payment method + status badge with colors */}
              {b.paymentMethod === "fonepay" && (
                <span
                  className="badge"
                  style={{
                    background: b.paymentStatus === "paid" ? "#dcfce7" : "#fef3c7",
                    color: b.paymentStatus === "paid" ? "#15803d" : "#92400e",
                    border: "1px solid " + (b.paymentStatus === "paid" ? "#86efac" : "#fcd34d"),
                  }}
                >
                  💳 Fonepay {b.paymentStatus === "paid" ? "✓ Paid" : "⏳ Pending"}
                </span>
              )}

              {b.paymentMethod === "cash" && (
                <span
                  className="badge"
                  style={{
                    background: "#dbeafe",
                    color: "#0369a1",
                    border: "1px solid #7dd3fc",
                  }}
                >
                  💵 Cash on delivery
                </span>
              )}
            </div>
          </div>

          {/* Service details */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #1f2937" }}>
            <p style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 6 }}>
              <strong>📅 Date:</strong> {b.date || "Not specified"}
            </p>
            <p style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 6 }}>
              <strong>⏰ Time:</strong> {b.time || "Not specified"}
            </p>
            <p style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 6 }}>
              <strong>⏱️ Duration:</strong> {b.durationHours || "N/A"} hours
            </p>
            <p style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 6 }}>
              <strong>🏠 Service address:</strong> {b.address || "Not specified"}
            </p>
          </div>

          {/* Work type and shifts */}
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 13, color: "#cbd5f5", marginBottom: 4 }}>
              <strong>Work type:</strong>{" "}
              {b.caregiverWorkType === "full_time" ? "💼 Full time" : "⏰ Part time"}
            </p>
            {b.caregiverShifts && b.caregiverShifts.length > 0 && (
              <p style={{ fontSize: 13, color: "#cbd5f5", marginBottom: 4 }}>
                <strong>Shifts:</strong> {b.caregiverShifts.join(", ")}
              </p>
            )}
          </div>

          {/* Payment details card */}
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              paddingBottom: 12,
              paddingLeft: 12,
              paddingRight: 12,
              borderTop: "1px solid #1f2937",
              background: "#0b1120",
              borderRadius: "8px",
            }}
          >
            <p style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 6 }}>
              <strong>💰 Amount:</strong> ₹{b.totalAmount || b.amountDue || "N/A"}
            </p>

            {b.paymentMethod === "fonepay" && (
              <>
                <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>
                  <strong>Payment method:</strong> Fonepay
                </p>
                {b.transactionId && (
                  <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>
                    <strong>Transaction ID:</strong> {b.transactionId.substring(0, 20)}...
                  </p>
                )}
                {b.paymentDate && (
                  <p style={{ fontSize: 12, color: "#9ca3af" }}>
                    <strong>Payment date:</strong>{" "}
                    {b.paymentDate?.toDate?.().toLocaleDateString?.() || "N/A"}
                  </p>
                )}
              </>
            )}

            {b.paymentMethod === "cash" && (
              <p style={{ fontSize: 12, color: "#fbbf24" }}>
                <strong>⚠️ Note:</strong> Please pay ₹{b.amountDue || b.totalAmount} in cash to the caregiver during service
              </p>
            )}
          </div>

          {/* Special notes */}
          {b.notes && (
            <p style={{ fontSize: 13, color: "#cbd5f5", marginTop: 10, fontStyle: "italic", borderLeft: "3px solid #0ea5e9", paddingLeft: 10 }}>
              <strong>📝 Your notes:</strong> {b.notes}
            </p>
          )}

          {/* Booking ID and created date */}
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 10 }}>
            Booking ID: {b.id.substring(0, 8)}... · Created:{" "}
            {b.createdAt?.toDate?.().toLocaleDateString?.() || "N/A"}
          </div>

          {/* Actions based on status */}
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {b.status === "pending" && (
              <>
                <button
                  className="btn btn-outline"
                  onClick={() => cancelBooking(b.id)}
                >
                  Cancel booking
                </button>
                <span style={{ fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>
                  ⏳ Waiting for caregiver to accept...
                </span>
              </>
            )}

            {b.status === "accepted" && (
              <>
                <button
                  className="btn btn-outline"
                  onClick={() => cancelBooking(b.id)}
                >
                  Cancel booking
                </button>
                <span style={{ fontSize: 12, color: "#22c55e", alignSelf: "center" }}>
                  ✓ Caregiver accepted – job will start soon
                </span>
              </>
            )}

            {b.status === "completed" && (
              <div>
                <div style={{ fontSize: 13, color: "#22c55e", marginBottom: 8 }}>
                  ✓ Job completed successfully
                </div>
                {b.paymentStatus === "paid" && b.paymentMethod === "fonepay" && (
                  <div style={{ fontSize: 12, color: "#0ea5e9" }}>
                    ✓ Payment received via Fonepay
                  </div>
                )}
                {b.paymentStatus === "pending" && b.paymentMethod === "cash" && (
                  <div style={{ fontSize: 12, color: "#fbbf24" }}>
                    ⚠️ Cash payment pending
                  </div>
                )}
              </div>
            )}

            {b.status === "cancelled" && (
              <div style={{ fontSize: 13, color: "#ef4444" }}>
                ✗ Booking cancelled
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
            paddingTop: 14,
            paddingBottom: 14,
          }}
        >
          <p style={{ fontSize: 14, color: "#e5e7eb", marginBottom: 10 }}>
            <strong>📊 Your Booking Summary</strong>
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af" }}>Total bookings</p>
              <p style={{ fontSize: 18, color: "#0ea5e9", fontWeight: "600" }}>
                {bookings.length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af" }}>Completed</p>
              <p style={{ fontSize: 18, color: "#22c55e", fontWeight: "600" }}>
                {bookings.filter((b) => b.status === "completed").length}
              </p>
            </div>
                        <div>
              <p style={{ fontSize: 12, color: "#9ca3af" }}>Pending</p>
              <p style={{ fontSize: 18, color: "#fbbf24", fontWeight: "600" }}>
                {bookings.filter((b) => b.status === "pending").length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af" }}>Total spent</p>
              <p style={{ fontSize: 18, color: "#0ea5e9", fontWeight: "600" }}>
                ₹
                {bookings
                  .filter((b) => b.paymentStatus === "paid" || b.status === "completed")
                  .reduce((sum, b) => sum + (b.totalAmount || b.amountPaid || 0), 0)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af" }}>Paid via Fonepay</p>
              <p style={{ fontSize: 18, color: "#10b981", fontWeight: "600" }}>
                ₹
                {bookings
                  .filter((b) => b.paymentMethod === "fonepay" && b.paymentStatus === "paid")
                  .reduce((sum, b) => sum + (b.amountPaid || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
