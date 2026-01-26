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
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
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
      alert("Booking cancelled successfully.");
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
      <p style={{ color: "#9ca3af", textAlign: "center", padding: 20 }}>
        Loading your bookings...
      </p>
    );

  if (error)
    return (
      <p style={{ color: "#ef4444", textAlign: "center", padding: 20 }}>
        Error loading bookings: {error}
      </p>
    );

  const totalSpent = bookings
    .filter((b) => b.status === "completed" || b.paymentStatus === "paid")
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const completedCount = bookings.filter((b) => b.status === "completed").length;

  return (
    <div>
      <h2 className="section-title">My Bookings</h2>
      <p style={{ fontSize: 13, color: "#9ca3af", marginTop: -4, marginBottom: 12 }}>
        Track your service bookings and payments
      </p>

      {/* Summary Cards */}
      {bookings.length > 0 && (
        <div className="card" style={{ marginBottom: 16, background: "#0b1120" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Total Bookings</p>
              <p style={{ fontSize: 20, color: "#0ea5e9", fontWeight: "bold", margin: 0 }}>
                {bookings.length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Completed</p>
              <p style={{ fontSize: 20, color: "#22c55e", fontWeight: "bold", margin: 0 }}>
                {completedCount}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Total Spent</p>
              <p style={{ fontSize: 20, color: "#10b981", fontWeight: "bold", margin: 0 }}>
                ₹{totalSpent}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Pending</p>
              <p style={{ fontSize: 20, color: "#fbbf24", fontWeight: "bold", margin: 0 }}>
                {bookings.filter((b) => b.status === "pending").length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="col">
          <label>Booking Status</label>
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
          <label>Payment Status</label>
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

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-title">No bookings</p>
          <p className="empty-state-text">
            {bookings.length === 0
              ? "You haven't booked any caregivers yet"
              : "No bookings match this filter"}
          </p>
        </div>
      ) : (
        filtered.map((b) => (
          <div key={b.id} className="card" style={{ marginBottom: 12 }}>
            {/* Header */}
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
                <span
                  style={{
                    background: "#dcfce7",
                    color: "#15803d",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  {(b.status || "pending").toUpperCase()}
                </span>
                {b.paymentMethod === "fonepay" && (
                  <span
                    style={{
                      background: b.paymentStatus === "paid" ? "#dcfce7" : "#fef3c7",
                      color: b.paymentStatus === "paid" ? "#15803d" : "#92400e",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    💳 {b.paymentStatus === "paid" ? "Paid" : "Pending"}
                  </span>
                )}
                {b.paymentMethod === "cash" && (
                  <span
                    style={{
                      background: "#dbeafe",
                      color: "#0369a1",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    💵 Cash
                  </span>
                )}
              </div>
            </div>

            {/* Details */}
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
              <p style={{ fontSize: 13, color: "#e5e7eb" }}>
                <strong>🏠 Address:</strong> {b.address || "Not specified"}
              </p>
            </div>

            {/* Work Type */}
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 13, color: "#cbd5f5", marginBottom: 4 }}>
                <strong>Work Type:</strong> {b.caregiverWorkType === "full_time" ? "💼 Full Time" : "⏰ Part Time"}
              </p>
            </div>

            {/* Payment Card */}
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
                    <strong>Payment Method:</strong> Fonepay
                  </p>
                  {b.transactionId && (
                    <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>
                      <strong>Transaction ID:</strong> {b.transactionId.substring(0, 20)}...
                    </p>
                  )}
                </>
              )}
              {b.paymentMethod === "cash" && (
                <p style={{ fontSize: 12, color: "#fbbf24" }}>
                  <strong>⚠️ Note:</strong> Please pay ₹{b.totalAmount} in cash to the caregiver
                </p>
              )}
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
                                <strong>📝 Notes:</strong> {b.notes}
              </p>
            )}

            {/* Booking Info */}
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 10 }}>
              Booking ID: {b.id.substring(0, 8)}... · Created:{" "}
              {b.createdAt?.toDate?.().toLocaleDateString?.() || "N/A"}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              {b.status === "pending" && (
                <>
                  <button
                    className="btn btn-outline"
                    onClick={() => cancelBooking(b.id)}
                    style={{
                      background: "#111827",
                      color: "#e5e7eb",
                      border: "1px solid #1f2937",
                      flex: 1,
                    }}
                  >
                    Cancel
                  </button>
                  <span style={{ fontSize: 12, color: "#9ca3af", alignSelf: "center", flex: 1 }}>
                    ⏳ Waiting for acceptance...
                  </span>
                </>
              )}

              {b.status === "accepted" && (
                <>
                  <button
                    className="btn btn-outline"
                    onClick={() => cancelBooking(b.id)}
                    style={{
                      background: "#111827",
                      color: "#e5e7eb",
                      border: "1px solid #1f2937",
                      flex: 1,
                    }}
                  >
                    Cancel
                  </button>
                  <span style={{ fontSize: 12, color: "#22c55e", alignSelf: "center", flex: 1 }}>
                    ✓ Accepted - will start soon
                  </span>
                </>
              )}

              {b.status === "completed" && (
                <div>
                  <div style={{ fontSize: 13, color: "#22c55e", marginBottom: 8 }}>
                    ✓ Completed successfully
                  </div>
                  {b.paymentStatus === "paid" && b.paymentMethod === "fonepay" && (
                    <div style={{ fontSize: 12, color: "#0ea5e9" }}>
                      ✓ Payment received
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
                <div style={{ fontSize: 13, color: "#ef4444" }}>✗ Cancelled</div>
              )}
            </div>
          </div>
        ))
      )}

      {/* Summary Card */}
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
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Total bookings</p>
              <p style={{ fontSize: 18, color: "#0ea5e9", fontWeight: "600", margin: 0 }}>
                {bookings.length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Completed</p>
              <p style={{ fontSize: 18, color: "#22c55e", fontWeight: "600", margin: 0 }}>
                {bookings.filter((b) => b.status === "completed").length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Pending</p>
              <p style={{ fontSize: 18, color: "#fbbf24", fontWeight: "600", margin: 0 }}>
                {bookings.filter((b) => b.status === "pending").length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Total spent</p>
              <p style={{ fontSize: 18, color: "#0ea5e9", fontWeight: "600", margin: 0 }}>
                ₹
                {bookings
                  .filter((b) => b.paymentStatus === "paid" || b.status === "completed")
                  .reduce((sum, b) => sum + (b.totalAmount || b.amountPaid || 0), 0)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Paid via Fonepay</p>
              <p style={{ fontSize: 18, color: "#10b981", fontWeight: "600", margin: 0 }}>
                ₹
                {bookings
                  .filter((b) => b.paymentMethod === "fonepay" && b.paymentStatus === "paid")
                  .reduce((sum, b) => sum + (b.amountPaid || 0), 0)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Cash pending</p>
              <p style={{ fontSize: 18, color: "#fbbf24", fontWeight: "600", margin: 0 }}>
                ₹
                {bookings
                  .filter((b) => b.paymentMethod === "cash" && b.paymentStatus === "pending")
                  .reduce((sum, b) => sum + (b.totalAmount || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

