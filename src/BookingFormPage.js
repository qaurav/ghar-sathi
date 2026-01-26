import React, { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { useAuth } from "./AuthContext";
import { FONEPAY_CONFIG, generateRefId } from "./fonepayConfig";

export default function BookingFormPage({ caregiver, onBooked }) {
  const { user, userDoc } = useAuth();

  // AUTO-FILL from user profile
  const [fullName, setFullName] = useState(userDoc?.name || "");
  const [phone, setPhone] = useState(userDoc?.phone || "");
  const [address, setAddress] = useState(userDoc?.address || "");
  const [city, setCity] = useState(userDoc?.city || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationHours, setDurationHours] = useState(4);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
   const [paymentMethod, setPaymentMethod] = useState("fonepay");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isBlacklistedModalOpen, setIsBlacklistedModalOpen] = useState(false);
  const [error, setError] = useState("");

  if (!caregiver) {
    return (
      <div style={{ textAlign: "center", color: "#ef4444", padding: 20 }}>
        <p>No caregiver selected. Please go back and select a caregiver.</p>
      </div>
    );
  }

  const hourlyRate = caregiver.hourlyRate || 500;
  const totalAmount = durationHours * hourlyRate;
  const COMMISSION_RATE = 15;
  const platformCommission = (totalAmount * COMMISSION_RATE) / 100;
  const vendorReceives = totalAmount - platformCommission;

  const handlePaymentWithFonepay = async (bookingData) => {
    try {
      setProcessingPayment(true);
      const refId = generateRefId();

      sessionStorage.setItem(
        "pendingBookingData",
        JSON.stringify({
          ...bookingData,
          paymentRefId: refId,
          amount: totalAmount,
        })
      );

      const form = document.createElement("form");
      form.method = "POST";
      form.action = FONEPAY_CONFIG.PAYMENT_GATEWAY_URL;

      const fields = {
        merchantCode: FONEPAY_CONFIG.MERCHANT_CODE,
        amount: totalAmount,
        refId: refId,
        remarks: `Caregiver booking - ${caregiver.name}`,
        returnUrl: `${window.location.origin}/payment-callback`,
      };

      Object.keys(fields).forEach((key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = fields[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error("Payment initiation error:", err);
      setError("Could not initiate payment. Please try again.");
      setProcessingPayment(false);
    }
  };

  const handleCashPayment = async (bookingData) => {
    try {
      setSubmitting(true);

      const docRef = await addDoc(collection(db, "bookings"), {
        ...bookingData,
        paymentMethod: "cash",
        paymentStatus: "pending",
        amountDue: totalAmount,
        createdAt: serverTimestamp(),
      });

      // Update vendor pending earnings
      await updateDoc(doc(db, "vendors", caregiver.id), {
        pendingEarnings: (caregiver.pendingEarnings || 0) + vendorReceives,
      });

      alert(
        `Booking confirmed! Please pay ₹${totalAmount} in cash to the caregiver when they arrive.`
      );
      onBooked && onBooked();
    } catch (err) {
      console.error("Booking error:", err);
      setError("Could not create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("Please sign in to book.");
      return;
    }

    if (!fullName || !phone || !address || !date || !time) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      // Check if user is blacklisted
      const blRef = doc(db, "blacklist", user.uid);
      const blSnap = await getDoc(blRef);

      if (blSnap.exists()) {
        setIsBlacklistedModalOpen(true);
        return;
      }

      const bookingData = {
        userId: user.uid,
        userName: fullName,
        userPhone: phone,
        userEmail: user.email,
        address,
        city: city || userDoc?.city || "",
        date,
        time,
        durationHours,
        notes,
        caregiverId: caregiver.id,
        vendorId: caregiver.id,
        organizationId: caregiver.organizationId || null,
        organizationName: caregiver.organizationName || "",
        caregiverName: caregiver.name || "",
        caregiverLocation: caregiver.location || "",
        caregiverWorkType: caregiver.workType || "",
        caregiverShifts: caregiver.shifts || [],
        caregiverCategory: caregiver.category || "caregiver",
        status: "pending",
        hourlyRate: hourlyRate,
        totalAmount: totalAmount,
        platformCommission: platformCommission,
        vendorEarnings: vendorReceives,
      };

      if (paymentMethod === "fonepay") {
        await handlePaymentWithFonepay(bookingData);
      } else {
        await handleCashPayment(bookingData);
      }
    } catch (err) {
      console.error("Error creating booking:", err);
      setError("Could not create booking. Please try again.");
    }
  };

  return (
    <div>
      <h2 className="section-title">Booking Details</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Profile Auto-fill Notice */}
      <div
        style={{
          background: "#dbeafe",
          color: "#0369a1",
          padding: 12,
          borderRadius: 8,
          fontSize: 12,
          marginBottom: 16,
          border: "1px solid #7dd3fc",
        }}
      >
        ℹ️ Your information has been auto-filled from your profile. You can edit if needed.
      </div>

      {/* Caregiver Info Card */}
      <div
        className="card"
        style={{
          marginBottom: 16,
          background: "#0b1120",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "#0ea5e9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 24,
              fontWeight: "bold",
            }}
          >
            {(caregiver.name || "C")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: "#e5e7eb", margin: "0 0 8px 0" }}>
              {caregiver.name || "Caregiver"}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
              📍 {caregiver.location}
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#cbd5f5" }}>
              {caregiver.category === "caregiver" ? "🏥 Care Giver" : "🏠 Household"}
              {" • "}
              {caregiver.workType === "full_time" ? "💼 Full Time" : "⏰ Part Time"}
            </p>
            {caregiver.organizationName && (
              <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "#9ca3af" }}>
                🏢 {caregiver.organizationName}
              </p>
            )}
          </div>
          {caregiver.verified && (
            <span
              style={{
                background: "#dcfce7",
                color: "#15803d",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: 11,
                fontWeight: "600",
                alignSelf: "flex-start",
              }}
            >
              ✓ Verified
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #1f2937",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            fontSize: 12,
            color: "#9ca3af",
          }}
        >
          <div>
            <p style={{ margin: 0 }}>Rating</p>
            <p style={{ margin: 0, color: "#e5e7eb", fontWeight: "bold" }}>
              ⭐ {caregiver.rating || 5}/5
            </p>
          </div>
          <div>
            <p style={{ margin: 0 }}>Jobs Done</p>
            <p style={{ margin: 0, color: "#e5e7eb", fontWeight: "bold" }}>
              {caregiver.jobsCompleted || 0}
            </p>
          </div>
          <div>
            <p style={{ margin: 0 }}>Hourly Rate</p>
            <p style={{ margin: 0, color: "#0ea5e9", fontWeight: "bold" }}>
              ₹{hourlyRate}/hr
            </p>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="form">
        <label>Your Full Name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="Your full name"
        />

        <label>Phone Number</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          placeholder="98XXXXXXXX"
          type="tel"
        />

        <label>Service Address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          placeholder="House, street, area"
        />

        <label>City</label>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Your city"
        />

        <div className="row">
          <div className="col">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="col">
            <label>Start Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>

        <label>Duration (hours)</label>
        <input
          type="number"
          min={1}
          max={24}
          value={durationHours}
          onChange={(e) => setDurationHours(Number(e.target.value))}
          required
        />

        <label>Special Instructions (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Medical conditions, preferences, gate instructions, etc."
          rows={4}
        />

        {/* Pricing Breakdown */}
        <div
          className="card"
          style={{
            marginTop: 12,
            marginBottom: 12,
            background: "#0b1120",
          }}
        >
          <h4 style={{ color: "#e5e7eb", marginTop: 0, marginBottom: 12 }}>
            Pricing Breakdown
          </h4>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>
            <p style={{ margin: 0 }}>
              {durationHours} hours × ₹{hourlyRate}/hour ={" "}
              <span style={{ color: "#0ea5e9", fontWeight: "bold" }}>
                ₹{totalAmount}
              </span>
            </p>
          </div>
          <div
            style={{
              paddingTop: 12,
              borderTop: "1px solid #1f2937",
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            <p style={{ margin: "0 0 4px 0" }}>
              Platform Commission (15%):{" "}
              <span style={{ color: "#fbbf24" }}>-₹{Math.round(platformCommission)}</span>
            </p>
            <p style={{ margin: 0, marginTop: 8, paddingTop: 8, borderTop: "1px solid #1f2937" }}>
              <strong style={{ color: "#e5e7eb" }}>
                Caregiver Receives: ₹{Math.round(vendorReceives)}
              </strong>
            </p>
          </div>
        </div>

        {/* Payment Method Selection */}
        <label style={{ marginTop: 12 }}>Payment Method</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setPaymentMethod("fonepay")}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "6px",
              border: paymentMethod === "fonepay" ? "none" : "1px solid #1f2937",
              background:
                paymentMethod === "fonepay"
                  ? "linear-gradient(135deg, #0ea5e9, #06b6d4)"
                  : "#111827",
              color: paymentMethod === "fonepay" ? "white" : "#e5e7eb",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            💳 Fonepay
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("cash")}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "6px",
              border: paymentMethod === "cash" ? "none" : "1px solid #1f2937",
              background:
                paymentMethod === "cash"
                  ? "linear-gradient(135deg, #0ea5e9, #06b6d4)"
                  : "#111827",
              color: paymentMethod === "cash" ? "white" : "#e5e7eb",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            💵 Cash on Delivery
          </button>
        </div>

        {/* Payment Method Info */}
        {paymentMethod === "fonepay" && (
          <div
            style={{
              background: "#dbeafe",
              color: "#0369a1",
              padding: 12,
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 12,
              border: "1px solid #7dd3fc",
            }}
          >
            <strong>💳 Secure Payment:</strong> You'll be redirected to Fonepay's secure payment
            gateway. You can pay with any bank card.
          </div>
        )}

               {paymentMethod === "cash" && (
          <div
            style={{
              background: "#fef3c7",
              color: "#92400e",
              padding: 12,
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 12,
              border: "1px solid #fcd34d",
            }}
          >
            <strong>⚠️ Note:</strong> Please pay ₹{totalAmount} in cash directly to the caregiver
            when they arrive.
          </div>
        )}

        {/* Submit Button */}
        <button
          className="btn btn-primary"
          type="submit"
          disabled={submitting || processingPayment}
          style={{ width: "100%" }}
        >
          {processingPayment
            ? "Redirecting to payment..."
            : submitting
            ? "Creating booking..."
            : paymentMethod === "fonepay"
            ? `Proceed to Payment (₹${totalAmount})`
            : `Confirm Booking (₹${totalAmount})`}
        </button>
      </form>

      {/* Blacklist Modal */}
      {isBlacklistedModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "#020617",
              borderRadius: 8,
              padding: 24,
              maxWidth: 420,
              width: "90%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
              border: "1px solid #1f2937",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8, color: "#fecaca" }}>
              🚫 Account Restricted
            </h3>
            <p style={{ fontSize: 14, color: "#e5e7eb", marginBottom: 16 }}>
              Your account has been restricted due to previous reports. You cannot create new
              bookings at this time.
              <br />
              <br />
              Please contact support if you believe this is a mistake.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setIsBlacklistedModalOpen(false)}
              style={{ width: "100%" }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

          

