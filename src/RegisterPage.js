import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Create user in Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(cred.user, { displayName: name });

      // Prepare user data
      let userData = {
        uid: cred.user.uid,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
        isApproved: role === "admin" || role === "superadmin" ? true : false,
        isSuspended: false,
      };

      // If caregiver, add vendor fields
      if (role === "caregiver") {
        userData = {
          ...userData,
          category: "caregiver",
          services: [],
          servicesOffered: [],
          workType: "part_time",
          shifts: [],
          location: "",
          bio: "",
          experience: 0,
          jobsCompleted: 0,
          rating: 5,
          reviewCount: 0,
          hourlyRate: 0,
          verified: false,
          backgroundChecked: false,
          totalEarnings: 0,
          pendingEarnings: 0,
          vendorId: cred.user.uid,
          phone: "",
          isAvailable: true,
          satisfactionRate: 95,
        };

        // Create vendor profile
        await setDoc(doc(db, "vendors", cred.user.uid), userData);
      }

      // Create user document
      await setDoc(doc(db, "users", cred.user.uid), userData);

      // Redirect handled by AuthContext
    } catch (err) {
      console.error("Registration error:", err);
      
      // Handle specific errors
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please log in instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters long.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2 style={{ color: "#e5e7eb", marginBottom: 8 }}>Create your account</h2>
        <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 20 }}>
          Join Ghar Sathi as a user or service provider
        </p>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="form">
          <label>Full name</label>
          <input
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <label>I am registering as a...</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="user">👨‍👩‍👧 Family / User (Hiring)</option>
            <option value="caregiver">👩‍💼 Caregiver / Service Provider</option>
          </select>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: "100%", marginTop: 8 }}
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
          Already have an account?{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => (window.location.href = "/auth")}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
