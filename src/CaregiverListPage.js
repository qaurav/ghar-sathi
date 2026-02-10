import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebaseConfig";

const SHIFTS = ["morning", "day", "night"];

// Helper – extract readable service name from vendors data
const getServiceNameFromVendorData = (serviceString) => {
  if (!serviceString) return "";
  const parts = serviceString.split(" ");
  if (parts.length >= 2) {
    return parts
      .slice(1)
      .join(" ")
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  }
  return serviceString;
};

// Normalize servicesOffered entries (your vendors store IDs or labels)
const normalizeServiceId = (s) =>
  (s || "")
    .trim()
    .toLowerCase();

function CaregiverCard({ caregiver, onSelect, requireLogin, hasPaid }) {
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
        JSON.stringify(caregiver),
      );
      window.location.href = "/auth";
    } else {
      onSelect && onSelect(caregiver);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        {caregiver.profileImage ? (
          <img
            src={caregiver.profileImage}
            alt={caregiver.name || "Caregiver"}
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
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
            {getInitials(caregiver.name)}
          </div>
        )}

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <strong style={{ fontSize: 16, color: "#e5e7eb" }}>
                {caregiver.name || "Caregiver"}
              </strong>
              {caregiver.verified && (
                <span
                  style={{
                    marginLeft: 8,
                    background: "#dcfce7",
                    color: "#15803d",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  ✓ Verified
                </span>
              )}
            </div>
          </div>

          <p style={{ margin: "4px 0", fontSize: 12, color: "#9ca3af" }}>
            📍 {caregiver.location || "Location not specified"}
          </p>

          {caregiver.organizationName && (
            <p
              style={{
                margin: "4px 0",
                fontSize: 12,
                color: "#0ea5e9",
                fontWeight: "500",
              }}
            >
              🏢 {caregiver.organizationName}
            </p>
          )}

          {typeof caregiver.rating === "number" && (
            <div style={{ marginTop: 4 }}>
              <span style={{ color: "#fbbf24", fontSize: 13 }}>
                {getRatingStars(caregiver.rating)}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  marginLeft: 8,
                }}
              >
                {caregiver.rating.toFixed(1)} ({caregiver.reviewCount || 0}{" "}
                reviews)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Category, work type, services, shifts */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid #1f2937",
        }}
      >
        <p style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 6 }}>
          <span style={{ color: "#9ca3af" }}>Category:</span>{" "}
          {caregiver.category === "caregiver"
            ? "🏥 Care giver"
            : caregiver.category === "household"
            ? "🏠 Household"
            : "👥 Both"}
        </p>

        <p style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 6 }}>
          <span style={{ color: "#9ca3af" }}>Work type:</span>{" "}
          {caregiver.workType === "fulltime"
            ? "💼 Full time"
            : caregiver.workType === "parttime"
            ? "⏰ Part time"
            : "Not specified"}
        </p>

        <p style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 6 }}>
          <span style={{ color: "#9ca3af" }}>Services:</span>{" "}
          {(caregiver.servicesOffered || []).length > 0
            ? (caregiver.servicesOffered || [])
                .map((service) => getServiceNameFromVendorData(service))
                .join(", ")
            : "Not specified"}
        </p>

        <p style={{ fontSize: 13, color: "#e5e7eb" }}>
          <span style={{ color: "#9ca3af" }}>Shifts:</span>{" "}
          {(caregiver.shifts || [])
            .map((s) => s[0].toUpperCase() + s.slice(1))
            .join(", ") || "Not specified"}
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          margin: "12px 0",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: 8,
            background: "#020617",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: "#0ea5e9",
              fontWeight: "bold",
            }}
          >
            {caregiver.experience || 0}+
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Years exp</div>
        </div>
        <div
          style={{
            textAlign: "center",
            padding: 8,
            background: "#020617",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: "#0ea5e9",
              fontWeight: "bold",
            }}
          >
            {caregiver.jobsCompleted || 0}+
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Jobs done</div>
        </div>
        <div
          style={{
            textAlign: "center",
            padding: 8,
            background: "#020617",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: "#0ea5e9",
              fontWeight: "bold",
            }}
          >
            {caregiver.satisfactionRate || 95}%
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Satisfaction</div>
        </div>
      </div>

      {/* Verification badges */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          margin: "12px 0",
        }}
      >
        {caregiver.backgroundChecked && (
          <span
            style={{
              background: "#dbeafe",
              color: "#0369a1",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: 11,
              fontWeight: "600",
            }}
          >
            ✓ Background checked
          </span>
        )}
        {caregiver.verified && (
          <span
            style={{
              background: "#dbeafe",
              color: "#0369a1",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: 11,
              fontWeight: "600",
            }}
          >
            ✓ ID verified
          </span>
        )}
        {caregiver.isCertified && (
          <span
            style={{
              background: "#fef3c7",
              color: "#92400e",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: 11,
              fontWeight: "600",
            }}
          >
            🏆 Certified
          </span>
        )}
      </div>

      {/* Pricing */}
      {caregiver.hourlyRate && (
        <div
          style={{
            fontSize: 13,
            color: "#0ea5e9",
            marginTop: 8,
            fontWeight: 600,
            padding: "8px 12px",
            background: "#020617",
            borderRadius: "6px",
            border: "1px solid #0ea5e9",
          }}
        >
          💰 ₹{caregiver.hourlyRate}/hour
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          className="btn btn-primary"
          onClick={handleBookClick}
          style={{ flex: 1 }}
          disabled={caregiver.isSuspended || !caregiver.isApproved}
        >
          📅 {requireLogin ? "Sign in to book" : "Book now"}
        </button>

        {hasPaid && caregiver.phone && (
          <a
            href={`https://wa.me/${caregiver.phone.replace(/\D/g, "")}`}
            className="btn"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              background: "#25D366",
              color: "white",
              border: "none",
              textDecoration: "none",
            }}
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
  userCategory = "",
  onChangeUserCategory,
  onChangeWorkType,
  onChangeShift,
  requireLogin = false,
  hasPaid = false,
}) {
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [workTypeFilter, setWorkTypeFilter] = useState(preselectedWorkType || "");
  const [shiftFilter, setShiftFilter] = useState(preselectedShift || "");
  const [locationFilter, setLocationFilter] = useState("");
  const [services, setServices] = useState([]);

  useEffect(() => {
    if (preselectedWorkType) setWorkTypeFilter(preselectedWorkType);
  }, [preselectedWorkType]);

  useEffect(() => {
    if (preselectedShift) setShiftFilter(preselectedShift);
  }, [preselectedShift]);

  // Load caregivers (approved + not suspended)
  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, "vendors"),
          where("isApproved", "==", true),
          where("isSuspended", "==", false),
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCaregivers(docs);
      } catch (err) {
        console.error("Error loading caregivers:", err);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Load services (used for dropdown)
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

  // Service dropdown options depend on userCategory
  const visibleServices = services.filter((s) => {
    if (!userCategory || userCategory === "both") return true;
    if (s.category === "both") return true;
    return s.category === userCategory;
  });

  // Apply all filters
  const filtered = caregivers.filter((c) => {
    // Category filter: “both” should show everyone
    if (userCategory === "caregiver" && c.category !== "caregiver") return false;
    if (userCategory === "household" && c.category !== "household") return false;
    // if userCategory is "both" or "", we do not restrict c.category

    // Search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (
        !(c.name || "").toLowerCase().includes(search) &&
        !(c.location || "").toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    // Availability
    if (c.isAvailable === false) return false;

    // Service filter: compare normalized IDs
    if (serviceFilter) {
      const offered = (c.servicesOffered || []).map(normalizeServiceId);
      if (!offered.includes(normalizeServiceId(serviceFilter))) return false;
    }

    // Work type filter – your vendors store "fulltime" / "parttime"
    if (workTypeFilter && c.workType !== workTypeFilter) return false;

    // Shift filter
    if (shiftFilter && !(c.shifts || []).includes(shiftFilter)) return false;

    // Location filter
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
      : userCategory === "both"
      ? "Both"
      : "All";

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>
        <span>Home</span> &gt; <span>{categoryLabel}</span> &gt;{" "}
        <span>
          {workTypeFilter === "fulltime"
            ? "Full time"
            : workTypeFilter === "parttime"
            ? "Part time"
            : "Any"}
        </span>{" "}
        &gt; <span>Caregivers</span>
      </div>

      <h2 className="section-title">Available caregivers ({filtered.length})</h2>

      {/* Search bar */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍 Search caregivers by name or location..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#0f2847",
            outline: "none",
          }}
        />
      </div>

      {/* Dropdown filters */}
      <div className="row" style={{ marginBottom: 16 }}>
        <div className="col">
          <label>Category</label>
          <select
            value={userCategory}
            onChange={(e) =>
              onChangeUserCategory && onChangeUserCategory(e.target.value)
            }
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#0f2847",
            }}
          >
            <option value="">All</option>
            <option value="caregiver">Care giver</option>
            <option value="household">Household</option>
            <option value="both">Both (Caregiver & Household)</option>
          </select>
        </div>

        <div className="col">
          <label>Work type</label>
          <select
            value={workTypeFilter}
            onChange={(e) => {
              const v = e.target.value;
              setWorkTypeFilter(v);
              if (onChangeWorkType) onChangeWorkType(v);
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#0f2847",
            }}
          >
            <option value="">Any</option>
            <option value="fulltime">Full time</option>
            <option value="parttime">Part time</option>
          </select>
        </div>

        {workTypeFilter === "parttime" && (
          <div className="col">
            <label>Shift</label>
            <select
              value={shiftFilter}
              onChange={(e) => {
                const v = e.target.value;
                setShiftFilter(v);
                if (onChangeShift) onChangeShift(v);
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f2847",
              }}
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
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#0f2847",
            }}
          />
        </div>
      </div>

      {/* Service filter dropdown (optional, if you use it in UI) */}
      {/* 
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, color: "#e5e7eb" }}>
          Service
        </label>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #1f2937",
            background: "#111827",
            color: "#e5e7eb",
          }}
        >
          <option value="">Any</option>
          {visibleServices.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label || s.serviceName}
            </option>
          ))}
        </select>
      </div>
      */}

      {/* Featured section */}
      {featured.length > 0 && (
        <div
          style={{
            background: "#0b1120",
            border: "1px solid #1f2937",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: 16,
            color: "#fbbf24",
            fontWeight: 600,
          }}
        >
          ⭐ Featured caregivers
          <div
            style={{
              fontSize: 12,
              color: "#9ca3af",
              fontWeight: "normal",
              marginTop: 4,
            }}
          >
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
          hasPaid={hasPaid}
        />
      ))}

      {regular.map((c) => (
        <CaregiverCard
          key={c.id}
          caregiver={c}
          onSelect={onSelectCaregiver}
          requireLogin={requireLogin}
          hasPaid={hasPaid}
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
              if (onChangeWorkType) onChangeWorkType("");
              if (onChangeShift) onChangeShift("");
            }}
            style={{
              padding: "10px 16px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#1e40af",
              cursor: "pointer",
              marginTop: 12,
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
