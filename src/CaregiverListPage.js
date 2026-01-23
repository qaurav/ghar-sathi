// src/CaregiverListPage.js
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";

const SHIFTS = ["morning", "day", "night"];

// Caregiver card component
function CaregiverCard({ caregiver, onSelect, requireLogin }) {
  const getInitials = (name) =>
    (name || "C")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const getRatingStars = (rating) => {
    const stars = Math.round(rating || 0);
    return "★".repeat(stars) + "☆".repeat(5 - stars);
  };

  const handleBookClick = () => {
    if (requireLogin) {
      localStorage.setItem(
        "pendingBookingCaregiver",
        JSON.stringify(caregiver)
      );
      window.location.href = "/auth";
    } else {
      onSelect && onSelect(caregiver);
    }
  };

  return (
    <div className="card">
      {/* Header with avatar */}
      <div className="caregiver-card-header">
        {caregiver.profileImage ? (
          <img
            src={caregiver.profileImage}
            alt={caregiver.name || "Caregiver"}
            className="caregiver-avatar"
          />
        ) : (
          <div className="avatar-placeholder">
            {getInitials(caregiver.name)}
          </div>
        )}

        <div className="caregiver-card-info">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong style={{ fontSize: 16, color: "#e5e7eb" }}>
                {caregiver.name || "Caregiver"}
              </strong>
              {caregiver.verified && (
                <span
                  className="badge badge-accepted"
                  style={{ marginLeft: 8 }}
                >
                  ✓ Verified
                </span>
              )}
              {caregiver.isAvailable === false && (
                <span
                  className="badge"
                  style={{
                    marginLeft: 8,
                    background: "#fef3c7",
                    color: "#92400e",
                  }}
                >
                  Not available
                </span>
              )}
            </div>
          </div>

          {/* Location */}
          <p style={{ margin: "4px 0", fontSize: 12, color: "#9ca3af" }}>
            📍 {caregiver.location || "Location not specified"}
          </p>

          {/* Rating */}
          {typeof caregiver.rating === "number" && (
            <div className="rating">
              <span className="rating-stars">
                {getRatingStars(caregiver.rating)}
              </span>
              <span className="rating-count">
                {caregiver.rating.toFixed(1)} ({caregiver.reviewCount || 0}{" "}
                reviews)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Category */}
      <p className="caregiver-meta-line">
        <span className="caregiver-meta-label">Category:</span>{" "}
        {caregiver.category === "caregiver" ? "🏥 Care giver" : "🏠 Household"}
      </p>

      {/* Work type */}
      <p className="caregiver-meta-line">
        <span className="caregiver-meta-label">Work type:</span>{" "}
        {caregiver.workType === "full_time" ? "💼 Full time" : "⏰ Part time"}
      </p>

      {/* Services */}
      <p className="caregiver-meta-line">
        <span className="caregiver-meta-label">Services:</span>{" "}
        {(caregiver.servicesOffered || [])
          .map((s) =>
            s
              .replace("_", " ")
              .split(" ")
              .map((word) => word[0].toUpperCase() + word.slice(1))
              .join(" ")
          )
          .join(", ") || "Not specified"}
      </p>

      {/* Shifts */}
      <p className="caregiver-meta-line">
        <span className="caregiver-meta-label">Shifts:</span>{" "}
        {(caregiver.shifts || [])
          .map((s) => s[0].toUpperCase() + s.slice(1))
          .join(", ") || "Not specified"}
      </p>

      {/* Stats */}
      <div className="caregiver-stats">
        <div className="stat-item">
          <div className="stat-value">{caregiver.yearsOfExperience || 0}+</div>
          <div className="stat-label">Years exp</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{caregiver.jobsCompleted || 0}+</div>
          <div className="stat-label">Jobs done</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{caregiver.satisfactionRate || 95}%</div>
          <div className="stat-label">Satisfaction</div>
        </div>
      </div>

      {/* Verification badges */}
      <div className="verification-badges">
        <span className="verification-badge">✓ Background checked</span>
        <span className="verification-badge">✓ ID verified</span>
        {caregiver.isCertified && (
          <span className="verification-badge certification-badge">
            🏆 Certified
          </span>
        )}
      </div>

      {/* Pricing */}
      {caregiver.hourlyRate && (
        <div className="pricing-info">💰 ₹{caregiver.hourlyRate}/hour</div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          className="btn btn-primary"
          onClick={handleBookClick}
          style={{ flex: 1 }}
        >
          📅 {requireLogin ? "Sign in to book" : "Book now"}
        </button>
        {caregiver.phone && (
          <a
            href={`https://wa.me/${caregiver.phone.replace(/\D/g, "")}`}
            className="btn btn-whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            style={{ flex: 1 }}
          >
            💬 WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

export default function CaregiverListPage({
  onSelectCaregiver,
  preselectedWorkType = "",
  preselectedShift = "",
  userCategory, // "caregiver", "household", or "both"
  requireLogin = false,
}) {
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState(""); // service id
  const [workTypeFilter, setWorkTypeFilter] = useState(preselectedWorkType);
  const [shiftFilter, setShiftFilter] = useState(preselectedShift);
  const [locationFilter, setLocationFilter] = useState("");

  const [services, setServices] = useState([]); // from Firestore

  // Load caregivers
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "caregiverProfiles"));
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((c) => c.verified);
        setCaregivers(docs);
      } catch (err) {
        console.error("Error loading caregivers:", err);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Load services
  useEffect(() => {
    const loadServices = async () => {
      try {
        const snap = await getDocs(collection(db, "services"));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setServices(list);
      } catch (err) {
        console.error("Error loading services:", err);
      }
    };
    loadServices();
  }, []);

  useEffect(() => {
    if (preselectedWorkType) setWorkTypeFilter(preselectedWorkType);
  }, [preselectedWorkType]);

  useEffect(() => {
    if (preselectedShift) setShiftFilter(preselectedShift);
  }, [preselectedShift]);

  // Filter services shown in dropdown based on userCategory
  const visibleServices = services.filter((s) => {
    if (!userCategory || userCategory === "both") return true;
    if (s.category === "both") return true;
    return s.category === userCategory;
  });

  const filtered = caregivers.filter((c) => {
    // Enforce category so caregiver vs household do not mix
    if (userCategory === "caregiver" && c.category !== "caregiver") {
      return false;
    }
    if (userCategory === "household" && c.category !== "household") {
      return false;
    }

    // Search by name or location
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (
        !(c.name || "").toLowerCase().includes(search) &&
        !(c.location || "").toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    // Filter by availability
    if (c.isAvailable === false) return false;

    // Filter by service (servicesOffered contains service IDs)
    if (serviceFilter && !(c.servicesOffered || []).includes(serviceFilter))
      return false;

    // Filter by work type
    if (workTypeFilter && c.workType !== workTypeFilter) return false;

    // Filter by shift
    if (shiftFilter && !(c.shifts || []).includes(shiftFilter)) return false;

    // Filter by location
    if (
      locationFilter &&
      (c.location || "").toLowerCase() !== locationFilter.toLowerCase()
    )
      return false;

    return true;
  });

  const featured = filtered.filter((c) => (c.rating || 0) >= 4.5);
  const regular = filtered.filter((c) => (c.rating || 0) < 4.5);

  if (loading) {
    return (
      <p style={{ textAlign: "center", color: "#9ca3af", marginTop: 20 }}>
        Loading caregivers...
      </p>
    );
  }

  const categoryLabel =
    userCategory === "caregiver"
      ? "Care giver"
      : userCategory === "household"
      ? "Household"
      : "All";

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Home</span> &gt; <span>{categoryLabel}</span> &gt;{" "}
        <span>
          {workTypeFilter === "full_time"
            ? "Full time"
            : workTypeFilter === "part_time"
            ? "Part time"
            : "Any"}
        </span>{" "}
        &gt; <span>Caregivers</span>
      </div>

      <h2 className="section-title">
        Available caregivers ({filtered.length})
      </h2>

      {/* Search bar */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍 Search caregivers by name or location..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter controls */}
      <div className="row" style={{ marginBottom: 16 }}>
        <div className="col">
          <label>Service</label>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          >
            <option value="">Any service</option>
            {visibleServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col">
          <label>Work type</label>
          <select
            value={workTypeFilter}
            onChange={(e) => setWorkTypeFilter(e.target.value)}
          >
            <option value="">Any</option>
            <option value="full_time">Full time</option>
            <option value="part_time">Part time</option>
          </select>
        </div>

        {workTypeFilter === "part_time" && (
          <div className="col">
            <label>Shift</label>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
            >
              <option value="">Any</option>
              {SHIFTS.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="col">
          <label>Location</label>
          <input
            placeholder="City / area"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Featured section */}
      {featured.length > 0 && (
        <div className="featured-banner">
          ⭐ Featured caregivers
          <div className="featured-banner-subtitle">
            These caregivers have excellent ratings
          </div>
        </div>
      )}

      {featured.map((c) => (
        <CaregiverCard
          key={c.id}
          caregiver={c}
          onSelect={onSelectCaregiver}
          requireLogin={requireLogin}
        />
      ))}

      {regular.map((c) => (
        <CaregiverCard
          key={c.id}
          caregiver={c}
          onSelect={onSelectCaregiver}
          requireLogin={requireLogin}
        />
      ))}

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p className="empty-state-title">No caregivers found</p>
          <p className="empty-state-text">
            Try adjusting your filters or expanding your location
          </p>
          <button
            className="btn btn-outline"
            onClick={() => {
              setSearchTerm("");
              setServiceFilter("");
              setWorkTypeFilter("");
              setShiftFilter("");
              setLocationFilter("");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
