import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { useAuth } from "./AuthContext";
import { collection, getDocs } from "firebase/firestore";

const SHIFT_OPTIONS = ["morning", "day", "night"];

export default function CaregiverProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("caregiver");
  const [isAvailable, setIsAvailable] = useState(true);
  const [workType, setWorkType] = useState("fulltime");
  const [shifts, setShifts] = useState([]);
  const [servicesOffered, setServicesOffered] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [experience, setExperience] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadServices = async () => {
      try {
        const snap = await getDocs(collection(db, "services"));
        const services = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAvailableServices(services);
      } catch (err) {
        console.error("Error loading services:", err);
      }
    };
    loadServices();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const ref = doc(db, "vendors", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || user.displayName || "");
          setLocation(data.location || "");
          setPhone(data.phone || "");
          setBio(data.bio || "");
          setCategory(data.category || "caregiver");
          setIsAvailable(data.isAvailable ?? true);
          setWorkType(data.workType || "fulltime");
          setShifts(data.shifts || []);
          setServicesOffered(data.servicesOffered || []);
          setHourlyRate(data.hourlyRate || 0);
          setExperience(data.experience || 0);
        } else {
          setName(user.displayName || "");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Could not load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const toggleArrayValue = (value, current, setter) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const handleServiceChange = (id) => {
    toggleArrayValue(id, servicesOffered, setServicesOffered);
  };

  const handleShiftChange = (shift) => {
    toggleArrayValue(shift, shifts, setShifts);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("Please sign in");
      return;
    }

    if (!name || !location) {
      setError("Name and location are required");
      return;
    }

    try {
      const finalShifts = workType === "parttime" ? shifts : [];

      const ref = doc(db, "vendors", user.uid);
      const payload = {
        uid: user.uid,
        name,
        location,
        phone,
        bio,
        category,
        isAvailable,
        workType,
        shifts: finalShifts,
        servicesOffered,
        hourlyRate: Number(hourlyRate),
        experience: Number(experience),
        verified: false,
        status: "pending",
        updatedAt: new Date().toISOString(),
      };

      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, payload);
      } else {
        await setDoc(ref, { ...payload, createdAt: new Date().toISOString() });
      }

      // Also update user doc
      await updateDoc(doc(db, "users", user.uid), {
        name,
        location,
        phone,
      });

      setSuccess("Profile saved! Waiting for admin verification.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Could not save profile. Please try again.");
    }
  };

  if (loading)
    return (
      <p style={{ color: "#9ca3af", textAlign: "center", padding: 20 }}>
        Loading profile...
      </p>
    );

  return (
    <div>
      <h2 className="section-title">Your Profile</h2>

      {error && <div className="error-message">{error}</div>}
      {success && (
        <div
          style={{
            background: "#dcfce7",
            color: "#15803d",
            padding: 12,
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
            border: "1px solid #86efac",
          }}
        >
          ✓ {success}
        </div>
      )}

      <form onSubmit={handleSave} className="form">
        <label>Full name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Your full name"
        />

        <label>Phone number</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="98XXXXXXXX"
          type="tel"
        />

        <label>Location *</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          placeholder="e.g., Kathmandu, Lalitpur"
        />

        <label>Bio / About yourself</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell customers about yourself, your experience, and specialties"
          rows={4}
        />

        <label>Hourly rate (₹)</label>
        <input
          type="number"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
          placeholder="500"
          min="0"
        />

        <label>Years of experience</label>
        <input
          type="number"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="0"
          min="0"
        />

        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="caregiver">Care giver</option>
          <option value="household">Household</option>
        </select>

        <label style={{ marginTop: 12 }}>Availability</label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setIsAvailable(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: isAvailable ? "none" : "1px solid #1f2937",
              background: isAvailable ? "#22c55e" : "#020617",
              color: isAvailable ? "white" : "#e5e7eb",
              cursor: "pointer",
              fontWeight: isAvailable ? "600" : "500",
            }}
          >
            ✓ Available
          </button>
          <button
            type="button"
            onClick={() => setIsAvailable(false)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: !isAvailable ? "none" : "1px solid #1f2937",
              background: !isAvailable ? "#ef4444" : "#020617",
              color: !isAvailable ? "white" : "#e5e7eb",
              cursor: "pointer",
              fontWeight: !isAvailable ? "600" : "500",
            }}
          >
            ✗ Not available
          </button>
        </div>

        <label style={{ marginTop: 12 }}>Work type</label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setWorkType("fulltime");
              setShifts([]);
            }}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: workType === "fulltime" ? "none" : "1px solid #1f2937",
              background: workType === "fulltime" ? "#0ea5e9" : "#020617",
              color: workType === "fulltime" ? "white" : "#e5e7eb",
              cursor: "pointer",
              fontWeight: workType === "fulltime" ? "600" : "500",
            }}
          >
                        💼 Full time
          </button>
          <button
            type="button"
            onClick={() => setWorkType("parttime")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: workType === "parttime" ? "none" : "1px solid #1f2937",
              background: workType === "parttime" ? "#fbbf24" : "#020617",
              color: workType === "parttime" ? "black" : "#e5e7eb",
              cursor: "pointer",
              fontWeight: workType === "parttime" ? "600" : "500",
            }}
          >
            ⏰ Part time
          </button>
        </div>

        {/* ONLY show shifts for parttime */}
        {workType === "parttime" && (
          <>
            <label style={{ marginTop: 12 }}>Preferred shifts</label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {SHIFT_OPTIONS.map((s) => (
                <label
                  key={s}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    cursor: "pointer",
                    padding: "6px 12px",
                    borderRadius: "999px",
                    background: shifts.includes(s) ? "#0ea5e9" : "#020617",
                    border: "1px solid " + (shifts.includes(s) ? "#0ea5e9" : "#1f2937"),
                    color: shifts.includes(s) ? "#f9fafb" : "#e5e7eb",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={shifts.includes(s)}
                    onChange={() => handleShiftChange(s)}
                    style={{ cursor: "pointer" }}
                  />
                  {s === "morning" ? "🌅 Morning" : s === "day" ? "☀️ Day" : "🌙 Night"}
                </label>
              ))}
            </div>
          </>
        )}

        {/* Services offered as checkboxes */}
        <label style={{ marginTop: 12 }}>Services you offer</label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {availableServices.length === 0 ? (
            <p style={{ fontSize: 12, color: "#9ca3af" }}>
              No services available yet. Contact admin to add services.
            </p>
          ) : (
            availableServices.map((s) => (
              <label
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  background: servicesOffered.includes(s.id) ? "#10b981" : "#020617",
                  border: "1px solid " + (servicesOffered.includes(s.id) ? "#10b981" : "#1f2937"),
                  color: servicesOffered.includes(s.id) ? "#f9fafb" : "#e5e7eb",
                }}
              >
                <input
                  type="checkbox"
                  checked={servicesOffered.includes(s.id)}
                  onChange={() => handleServiceChange(s.id)}
                  style={{ cursor: "pointer" }}
                />
                {s.label}
              </label>
            ))
          )}
        </div>

        <button
          className="btn btn-primary"
          type="submit"
          style={{ marginTop: 16, alignSelf: "flex-start" }}
        >
          Save profile
        </button>
      </form>

      {/* Profile completion note */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: "#0b1120",
          border: "1px solid #1f2937",
          borderRadius: 8,
        }}
      >
        <h4 style={{ color: "#e5e7eb", marginTop: 0, marginBottom: 8 }}>
          📝 Profile Completion
        </h4>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 8px 0" }}>
          Complete your profile to appear in caregiver listings:
        </p>
        <ul style={{ fontSize: 12, color: "#cbd5f5", paddingLeft: 20, margin: 0 }}>
          <li style={{ color: name ? "#22c55e" : "#9ca3af" }}>
            {name ? "✓" : "○"} Full name
          </li>
          <li style={{ color: location ? "#22c55e" : "#9ca3af" }}>
            {location ? "✓" : "○"} Location
          </li>
          <li style={{ color: phone ? "#22c55e" : "#9ca3af" }}>
            {phone ? "✓" : "○"} Phone number
          </li>
          <li style={{ color: hourlyRate > 0 ? "#22c55e" : "#9ca3af" }}>
            {hourlyRate > 0 ? "✓" : "○"} Hourly rate
          </li>
          <li style={{ color: servicesOffered.length > 0 ? "#22c55e" : "#9ca3af" }}>
            {servicesOffered.length > 0 ? "✓" : "○"} At least one service
          </li>
          <li style={{ color: "#fbbf24" }}>
            ⏳ Admin verification required
          </li>
        </ul>
      </div>
    </div>
  );
}

