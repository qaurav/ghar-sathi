// src/BookingFormPage.js
import React, { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { useAuth } from "./AuthContext";
import { FONEPAY_CONFIG, generateRefId } from "./fonepayConfig";

export default function BookingFormPage({ caregiver, onBooked }) {
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationHours, setDurationHours] = useState(4);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("fonepay");
  const [processingPayment, setProcessingPayment] = useState(false);

  const [isBlacklistedModalOpen, setIsBlacklistedModalOpen] =
    useState(false); // NEW

  if (!caregiver) return <p>No caregiver selected.</p>;

  const hourlyRate = caregiver.hourlyRate || 500;
  const totalAmount = durationHours * hourlyRate;

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
      alert("Could not initiate payment. Please try again.");
      setProcessingPayment(false);
    }
  };

  const handleCashPayment = async (bookingData) => {
    try {
      setSubmitting(true);

      await addDoc(collection(db, "bookings"), {
        ...bookingData,
        paymentMethod: "cash",
        paymentStatus: "pending",
        amountDue: totalAmount,
        createdAt: serverTimestamp(),
      });

      alert(
        "Booking confirmed! Please pay ₹" +
          totalAmount +
          " in cash to the caregiver."
      );
      onBooked && onBooked();
    } catch (err) {
      console.error("Booking error:", err);
      alert("Could not create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Please sign in to book.");
      return;
    }

    if (!fullName || !phone || !address || !date || !time) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      // === BLACKLIST CHECK ===
      const blRef = doc(db, "blacklist", user.uid);
      const blSnap = await getDoc(blRef);

      if (blSnap.exists()) {
        // open popup and stop
        setIsBlacklistedModalOpen(true);
        return;
      }

      const bookingData = {
        userId: user.uid,
        userName: fullName,
        userPhone: phone,
        address,
        date,
        time,
        durationHours,
        notes,
        caregiverId: caregiver.id,
        caregiverName: caregiver.name || "",
        caregiverLocation: caregiver.location || "",
        caregiverWorkType: caregiver.workType || "",
        caregiverShifts: caregiver.shifts || [],
        status: "pending",
        hourlyRate: hourlyRate,
        totalAmount: totalAmount,
      };

      if (paymentMethod === "fonepay") {
        await handlePaymentWithFonepay(bookingData);
      } else {
        await handleCashPayment(bookingData);
      }
    } catch (err) {
      console.error("Error checking blacklist / booking:", err);
      alert("Could not create booking. Please try again.");
    }
  };

  return (
    <div>
      <h2 className="section-title">User detail form</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <strong>{caregiver.name || "Caregiver"}</strong>
        <p>Location: {caregiver.location}</p>
        <p>Work type: {caregiver.workType}</p>
        <p>Shifts: {(caregiver.shifts || []).join(", ")}</p>
        <p>Services: {(caregiver.servicesOffered || []).join(", ")}</p>
        <p
          style={{ marginTop: 12, fontSize: 14, color: "#0ea5e9" }}
        >
          <strong>Rate: ₹{hourlyRate}/hour</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <label>Full name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="Your name"
        />

        <label>Phone number</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          placeholder="98XXXXXXXX"
        />

        <label>Service address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          placeholder="House, street, area, city"
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
            <label>Start time</label>
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

        <label>Notes / special instructions</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Medical conditions, preferences, gate instructions, etc."
        />

        <div
          className="card"
          style={{
            marginTop: 12,
            marginBottom: 12,
            background: "#020617",
          }}
        >
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            {durationHours} hours × ₹{hourlyRate}/hour ={" "}
            <strong
              style={{ color: "#e5e7eb", fontSize: 16 }}
            >
              ₹{totalAmount}
            </strong>
          </p>
        </div>

        <label style={{ marginTop: 12 }}>Payment method</label>
        <div
          style={{ display: "flex", gap: 8, marginBottom: 12 }}
        >
          <button
            type="button"
            className={
              "btn btn-outline" +
              (paymentMethod === "fonepay" ? " btn-primary" : "")
            }
            onClick={() => setPaymentMethod("fonepay")}
          >
            💳 Fonepay
          </button>
          <button
            type="button"
            className={
              "btn btn-outline" +
              (paymentMethod === "cash" ? " btn-primary" : "")
            }
            onClick={() => setPaymentMethod("cash")}
          >
            💵 Cash on delivery
          </button>
        </div>

        <button
          className="btn btn-primary"
          type="submit"
          disabled={submitting || processingPayment}
        >
          {processingPayment
            ? "Redirecting to payment..."
            : submitting
            ? "Booking..."
            : paymentMethod === "fonepay"
            ? "Proceed to payment"
            : "Confirm booking"}
        </button>
      </form>

      {/* Blacklist popup */}
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
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 8,
                color: "#fecaca",
              }}
            >
              Account restricted
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "#e5e7eb",
                marginBottom: 16,
              }}
            >
              Your account has been blacklisted due to previous
              reports. You cannot create new bookings at the
              moment. Please contact support if you believe this is
              a mistake.
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
