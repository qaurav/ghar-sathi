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
  const [userName, setUserName] = useState("");       // NEW
  const [bookingId, setBookingId] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    const qUserId = query.get("userId") || "";
    const qUserName = query.get("userName") || "";    // NEW
    const qBookingId = query.get("bookingId") || "";
    const qEmployeeId = query.get("employeeId") || "";

    setUserId(qUserId);
    setUserName(qUserName);                           // NEW
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

      const caregiverName =
        user?.displayName ||
        user?.email ||
        user?.phoneNumber ||
        "Caregiver";

      await addDoc(collection(db, "blacklistReports"), {
        userId,
        userName: userName || userId,                 // store name; fallback to uid
        bookingId: bookingId || null,
        reason,
        description,
        reportedBy: employeeId || user?.uid || "caregiver",
        reportedByName: caregiverName,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("Report submitted successfully! Admin will review it shortly.");
      navigate("/caregiver/dashboard");
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
          {/* Show user name instead of UID */}
          <label>User</label>
          <input
            value={userName || userId}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="User name"
          />

          {/* If you still want to keep UID, hide or make read-only */}
          <label>User ID (UID)</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Firebase user ID"
            readOnly
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
