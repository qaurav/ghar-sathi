// src/AuthPage.js
import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState([]); // Array for multiple selection
  const [loading, setLoading] = useState(false);

  const handleRoleToggle = (role) => {
    if (roles.includes(role)) {
      setRoles(roles.filter((r) => r !== role));
    } else {
      setRoles([...roles, role]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!roles.length) {
          alert("Please select at least one role.");
          setLoading(false);
          return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);

        // Set primary role (if multiple selected, use first one)
        const primaryRole = roles[0];

        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          name: fullName,
          email,
          role: primaryRole,
          availableRoles: roles,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Auth error:", err);
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Left hero */}
      <div className="auth-hero">
        <h1 className="auth-title">Ghar Sathi</h1>
        <p className="auth-tagline">
          Book trusted caregivers and household help in a few clicks.
        </p>
        <ul className="auth-points">
          <li>✔ Verified caregivers reviewed by admins</li>
          <li>✔ Clear timings, locations, and booking history</li>
          <li>✔ Designed for Nepali families and workers</li>
        </ul>
      </div>

      {/* Right form card */}
      <div className="auth-card">
        <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
        <p>
          {mode === "login"
            ? "Sign in to manage your bookings or jobs."
            : "Sign up as a user or caregiver to get started."}
        </p>

                <form className="form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label>Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Your full name"
              />

              <label style={{ marginTop: 12 }}>I want to be</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    cursor: "pointer",
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: roles.includes("user") ? "#0ea5e9" : "#020617",
                    border: "1px solid " + (roles.includes("user") ? "#0ea5e9" : "#1f2937"),
                    color: roles.includes("user") ? "#f9fafb" : "#e5e7eb",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={roles.includes("user")}
                    onChange={() => handleRoleToggle("user")}
                    style={{ cursor: "pointer" }}
                  />
                  👨‍👩‍👧 A user (hiring)
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    cursor: "pointer",
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: roles.includes("caregiver") ? "#10b981" : "#020617",
                    border: "1px solid " + (roles.includes("caregiver") ? "#10b981" : "#1f2937"),
                    color: roles.includes("caregiver") ? "#f9fafb" : "#e5e7eb",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={roles.includes("caregiver")}
                    onChange={() => handleRoleToggle("caregiver")}
                    style={{ cursor: "pointer" }}
                  />
                  👩‍💼 A caregiver (worker)
                </label>
              </div>
            </>
          )}

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="[email protected]"
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="At least 6 characters"
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
              ? "Sign in"
              : "Sign up"}
          </button>
        </form>

        <div style={{ marginTop: 12, fontSize: 12, color: "#9ca3af" }}>
          {mode === "login" ? (
            <>
              New here?{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => setMode("register")}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => setMode("login")}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
