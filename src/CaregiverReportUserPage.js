import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";

const REPORT_REASONS = [
  "Non-payment",
  "Abusive behavior",
  "Safety concerns",
  "Cancellation without notice",
  "Inappropriate requests",
  "Other",
];

export default function CaregiverReportUserPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [bookingId, setBookingId] = useState("");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get params from URL
    const bookingIdParam = searchParams.get("bookingId");
    const userIdParam = searchParams.get("userId");
    const userNameParam = searchParams.get("userName");
    const employeeIdParam = searchParams.get("employeeId");

    if (bookingIdParam) setBookingId(bookingIdParam);
    if (userIdParam) setUserId(userIdParam);
    if (userNameParam) setUserName(userNameParam);
    if (employeeIdParam) setEmployeeId(employeeIdParam);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!reason) {
      setError("Please select a reason");
      return;
    }

    if (!description.trim()) {
      setError("Please provide a description");
      return;
    }

    try {
      setSubmitting(true);

      await addDoc(collection(db, "blacklistReports"), {
        bookingId,
        userId,
        userName,
        reportedBy: employeeId,
        reportedByName: "Caregiver",
        reason,
        description: description.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("Report submitted successfully. Admin will review it.");
      navigate("/caregiver");
    } catch (err) {
      console.error("Error submitting report:", err);
      setError("Could not submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-card" style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: "#e5e7eb", fontSize: 24, marginBottom: 8 }}>
            🚫 Report User
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            Submit a report to admin about this user
          </p>
        </div>

        {/* Warning */}
        <div
          style={{
            background: "#fef3c7",
            color: "#92400e",
            padding: 12,
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
            border: "1px solid #fcd34d",
          }}
        >
          <strong>⚠️ Important:</strong> Only use this feature for serious issues like abuse,
          non-payment, or safety concerns. False reports may affect your account.
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* User info */}
        <div className="card" style={{ marginBottom: 16, background: "#0b1120" }}>
          <p style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 6 }}>
            <strong>User:</strong> {userName || "Unknown"}
          </p>
          <p style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 6 }}>
            <strong>User ID:</strong> {userId || "N/A"}
          </p>
          <p style={{ fontSize: 13, color: "#e5e7eb", margin: 0 }}>
            <strong>Booking ID:</strong> {bookingId?.substring(0, 12)}...
          </p>
        </div>

        {/* Report Form */}
        <form onSubmit={handleSubmit} className="form">
          <label>Reason for report *</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          >
            <option value="">Select a reason</option>
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <label>Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Please provide detailed information about the issue. Include dates, times, and specific incidents."
            rows={6}
            style={{ resize: "vertical" }}
          />

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate("/caregiver")}
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

        {/* Disclaimer */}
        <div
          style={{
            marginTop: 24,
            padding: 12,
            background: "#020617",
            border: "1px solid #1f2937",
            borderRadius: 8,
            fontSize: 12,
            color: "#9ca3af",
          }}
        >
          <strong style={{ color: "#e5e7eb" }}>Note:</strong> Your report will be reviewed by an
          admin within 24-48 hours. The user may be blacklisted if the report is verified. You will
          be notified of the decision.
        </div>
      </div>
    </div>
  );
}
