// src/CaregiverProfilePage.js
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
  const [category, setCategory] = useState("caregiver");
  const [isAvailable, setIsAvailable] = useState(true);
  const [workType, setWorkType] = useState("full_time");
  const [shifts, setShifts] = useState([]);
  const [servicesOffered, setServicesOffered] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);

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
      const ref = doc(db, "caregiverProfiles", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || user.displayName || "");
        setLocation(data.location || "");
        setCategory(data.category || "caregiver");
        setIsAvailable(data.isAvailable ?? true);
        setWorkType(data.workType || "full_time");
        setShifts(data.shifts || []);
        setServicesOffered(data.servicesOffered || []);
      } else {
        setName(user.displayName || "");
      }
      setLoading(false);
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
    if (!user) return;

    const finalShifts = workType === "part_time" ? shifts : [];

    const ref = doc(db, "caregiverProfiles", user.uid);
    const payload = {
      uid: user.uid,
      name,
      location,
      category,
      isAvailable,
      workType,
      shifts: finalShifts,
      servicesOffered,
      verified: false,
      status: "pending",
    };

    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, payload);
    }

    alert("Profile saved. Waiting for admin verification.");
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div>
      <h2 className="section-title">Caregiver profile</h2>

      <form onSubmit={handleSave} className="form">
        <label>Full name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label>Location</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          placeholder="e.g., Kathmandu, Lalitpur"
        />

        <label>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="caregiver">Care giver</option>
          <option value="household">Household</option>
        </select>

        {/* Availability with color coding */}
        <label style={{ marginTop: 12 }}>Availability</label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: "1px solid " + (isAvailable ? "#22c55e" : "#e5e7eb"),
              background: isAvailable ? "#22c55e" : "#020617",
              color: isAvailable ? "#f9fafb" : "#e5e7eb",
              cursor: "pointer",
              fontWeight: isAvailable ? "600" : "500",
            }}
            onClick={() => setIsAvailable(true)}
          >
            ✓ Available
          </button>
          <button
            type="button"
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: "1px solid " + (!isAvailable ? "#ef4444" : "#e5e7eb"),
              background: !isAvailable ? "#ef4444" : "#020617",
              color: !isAvailable ? "#f9fafb" : "#e5e7eb",
              cursor: "pointer",
              fontWeight: !isAvailable ? "600" : "500",
            }}
            onClick={() => setIsAvailable(false)}
          >
            ✗ Not available
          </button>
        </div>

        {/* Work type with color coding */}
        <label style={{ marginTop: 12 }}>Work type</label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: "1px solid " + (workType === "full_time" ? "#0ea5e9" : "#e5e7eb"),
              background: workType === "full_time" ? "#0ea5e9" : "#020617",
              color: workType === "full_time" ? "#f9fafb" : "#e5e7eb",
              cursor: "pointer",
              fontWeight: workType === "full_time" ? "600" : "500",
            }}
            onClick={() => {
              setWorkType("full_time");
              setShifts([]);
            }}
          >
            💼 Full time
          </button>
          <button
            type="button"
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: "1px solid " + (workType === "part_time" ? "#fbbf24" : "#e5e7eb"),
              background: workType === "part_time" ? "#fbbf24" : "#020617",
              color: workType === "part_time" ? "#000000" : "#e5e7eb",
              cursor: "pointer",
              fontWeight: workType === "part_time" ? "600" : "500",
            }}
            onClick={() => setWorkType("part_time")}
          >
            ⏰ Part time
          </button>
        </div>

        {/* ONLY show shifts for part-time */}
        {workType === "part_time" && (
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
                  {s === "morning"
                    ? "🌅 Morning"
                    : s === "day"
                    ? "☀️ Day"
                    : "🌙 Night"}
                </label>
              ))}
            </div>
          </>
        )}

        {/* Services offered as checkboxes */}
        <label style={{ marginTop: 12 }}>Services you offer</label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {availableServices.map((s) => (
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
          ))}
        </div>

        <button
          className="btn btn-primary"
          type="submit"
          style={{ marginTop: 16, alignSelf: "flex-start" }}
        >
          Save profile
        </button>
      </form>
    </div>
  );
}
