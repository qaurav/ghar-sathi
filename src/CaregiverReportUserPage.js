// src/CaregiverReportUserPage.js
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { useAuth } from "./AuthContext";

const REPORT_REASONS = [
  "Abusive behavior",
  "Non-payment",
  "No-show",
  "Harassment",
  "Fraud",
  "Disrespectful conduct",
  "Safety concern",
  "Other",
];

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function CaregiverReportUserPage() {
  const { user } = useAuth();
  const query = useQuery();
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    const qUserId = query.get("userId") || "";
    const qBookingId = query.get("bookingId") || "";
    const qEmployeeId = query.get("employeeId") || "";
    setUserId(qUserId);
    setBookingId(qBookingId);
    setEmployeeId(qEmployeeId);
  }, [query]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId || !reason) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      await addDoc(collection(db, "blacklistReports"), {
        userId,
        bookingId: bookingId || null,
        reason,
        description,
        reportedBy: employeeId || user?.uid || "caregiver",
        reportedByName: user?.displayName || "Caregiver",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("Report submitted successfully! Admin will review it shortly.");

      // Go back to caregiver job dashboard so the button can show “Reported”
      navigate("/caregiver/dashboard"); // make sure this matches your route
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Could not submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-card">
        <div className="app-header">
          <div>
            <h1 className="app-title">Report user</h1>
            <p className="app-subtitle">
              This report will be linked to your booking and reviewed by admin.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <label>User ID (UID)</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            placeholder="Firebase user ID"
          />

          <label>Booking ID</label>
          <input
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            placeholder="Related booking ID"
            readOnly={!!bookingId}
          />

          <label>Reason for report</label>
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

          <label>Additional details (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide more information about the incident..."
            rows="5"
          />

          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "📋 Submit report"}
          </button>
        </form>
      </div>
    </div>
  );
}
