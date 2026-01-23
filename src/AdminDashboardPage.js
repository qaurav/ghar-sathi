// src/AdminDashboardPage.js
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

export default function AdminDashboardPage() {
  const [caregivers, setCaregivers] = useState([]);
  const [allCaregivers, setAllCaregivers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [loadingCaregivers, setLoadingCaregivers] = useState(true);

  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingDateFilter, setBookingDateFilter] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("");

  const [services, setServices] = useState([]);
  const [newServiceLabel, setNewServiceLabel] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("caregiver");
  const [servicesKey, setServicesKey] = useState(0);

  const [editingService, setEditingService] = useState(null);
  const [editServiceLabel, setEditServiceLabel] = useState("");
  const [editServiceCategory, setEditServiceCategory] = useState("caregiver");

  const [blacklistReports, setBlacklistReports] = useState([]);
  const [blacklistFilter, setBlacklistFilter] = useState("pending");
  const [blacklist, setBlacklist] = useState([]);

  const [editingCaregiver, setEditingCaregiver] = useState(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCategory, setEditCategory] = useState("caregiver");
  const [editWorkType, setEditWorkType] = useState("full_time");
  const [editShifts, setEditShifts] = useState([]);
  const [editServices, setEditServices] = useState([]);
  const [editAvailable, setEditAvailable] = useState(true);
  const [editVerified, setEditVerified] = useState(false);

  const [searchCaregiverName, setSearchCaregiverName] = useState("");

  const [addName, setAddName] = useState("");
  const [addLocation, setAddLocation] = useState("");
  const [addCategory, setAddCategory] = useState("caregiver");
  const [addWorkType, setAddWorkType] = useState("full_time");
  const [addShifts, setAddShifts] = useState([]);
  const [addServices, setAddServices] = useState([]);

  const [tab, setTab] = useState("caregivers");

  const loadCaregivers = async () => {
    try {
      setLoadingCaregivers(true);
      const snap = await getDocs(collection(db, "caregiverProfiles"));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCaregivers(docs);
      setAllCaregivers(docs);
    } catch (err) {
      console.error("Error loading caregivers:", err);
    } finally {
      setLoadingCaregivers(false);
    }
  };

  const loadBookings = async () => {
    try {
      setLoadingBookings(true);
      const snap = await getDocs(collection(db, "bookings"));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBookings(docs);

      const total = docs.length;
      const byStatus = docs.reduce((acc, b) => {
        const s = b.status || "pending";
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});
      const byDayOfMonth = {};
      docs.forEach((b) => {
        if (b.date) {
          const day = new Date(b.date).getDate();
          byDayOfMonth[day] = (byDayOfMonth[day] || 0) + 1;
        }
      });
      const byLocation = {};
      docs.forEach((b) => {
        const loc = b.caregiverLocation || "Unknown";
        byLocation[loc] = (byLocation[loc] || 0) + 1;
      });
      const byService = {};
      docs.forEach((b) => {
        const servicesArr = b.caregiverShifts || [];
        servicesArr.forEach((s) => {
          byService[s] = (byService[s] || 0) + 1;
        });
      });
      const byTime = {};
      docs.forEach((b) => {
        if (b.time) {
          const hour = b.time.split(":")[0];
          byTime[hour] = (byTime[hour] || 0) + 1;
        }
      });

      setAnalytics({
        total,
        byStatus,
        byDayOfMonth,
        byLocation,
        byService,
        byTime,
      });
    } catch (err) {
      console.error("Error loading bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadServices = async () => {
    try {
      const snap = await getDocs(collection(db, "services"));
      const servicesList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setServices(servicesList);
      setServicesKey((prev) => prev + 1);
    } catch (err) {
      console.error("Error loading services:", err);
    }
  };

  const loadBlacklistReports = async () => {
    try {
      const snap = await getDocs(collection(db, "blacklistReports"));
      setBlacklistReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error loading blacklist reports:", err);
    }
  };

  const loadBlacklist = async () => {
    try {
      const snap = await getDocs(collection(db, "blacklist"));
      setBlacklist(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error loading blacklist:", err);
    }
  };

  useEffect(() => {
    loadCaregivers();
    loadBookings();
    loadServices();
    loadBlacklistReports();
    loadBlacklist();
  }, []);

  const handleUpdateStatus = async (id, verified, status) => {
    try {
      await updateDoc(doc(db, "caregiverProfiles", id), {
        verified,
        status,
      });
    } catch (err) {
      console.error("Error updating caregiver:", err);
      alert("Could not update caregiver status.");
    } finally {
      await loadCaregivers();
    }
  };

  const startEditCaregiver = (caregiver) => {
    setEditingCaregiver(caregiver);
    setEditName(caregiver.name || "");
    setEditLocation(caregiver.location || "");
    setEditCategory(caregiver.category || "caregiver");
    setEditWorkType(caregiver.workType || "full_time");
    setEditShifts(caregiver.shifts || []);
    setEditServices(caregiver.servicesOffered || []);
    setEditAvailable(caregiver.isAvailable ?? true);
    setEditVerified(caregiver.verified ?? false);
  };

  const resetEditForm = () => {
    setEditingCaregiver(null);
    setEditName("");
    setEditLocation("");
    setEditCategory("caregiver");
    setEditWorkType("full_time");
    setEditShifts([]);
    setEditServices([]);
    setEditAvailable(true);
    setEditVerified(false);
  };

  const handleSaveCaregiver = async () => {
    if (!editName || !editLocation) {
      alert("Please fill all required fields.");
      return;
    }
    try {
      const finalShifts = editWorkType === "part_time" ? editShifts : [];

      await updateDoc(doc(db, "caregiverProfiles", editingCaregiver.id), {
        name: editName,
        location: editLocation,
        category: editCategory,
        workType: editWorkType,
        shifts: finalShifts,
        servicesOffered: editServices,
        isAvailable: editAvailable,
        verified: editVerified,
      });

      alert("Caregiver updated successfully!");
      await loadCaregivers();
      resetEditForm();
    } catch (err) {
      console.error("Error updating caregiver:", err);
      alert("Could not update caregiver.");
    }
  };

  const handleAddCaregiver = async (e) => {
    e.preventDefault();
    if (!addName || !addLocation) {
      alert("Please fill all required fields.");
      return;
    }
    try {
      const newId = "manual-" + Date.now();
      const finalShifts = addWorkType === "part_time" ? addShifts : [];

      await setDoc(doc(db, "caregiverProfiles", newId), {
        uid: newId,
        name: addName,
        location: addLocation,
        category: addCategory,
        isAvailable: true,
        workType: addWorkType,
        shifts: finalShifts,
        servicesOffered: addServices,
        verified: true,
        status: "approved",
        createdAt: new Date().toISOString(),
        createdByAdmin: true,
      });

      alert("Caregiver added successfully!");
      setAddName("");
      setAddLocation("");
      setAddCategory("caregiver");
      setAddWorkType("full_time");
      setAddShifts([]);
      setAddServices([]);
      await loadCaregivers();
    } catch (err) {
      console.error("Error adding caregiver:", err);
      alert("Could not add caregiver.");
    }
  };

  const handleDeleteCaregiver = async (id, name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${name}? This action cannot be undone.`,
    );
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "caregiverProfiles", id));
      alert("Caregiver deleted successfully!");
      await loadCaregivers();
    } catch (err) {
      console.error("Error deleting caregiver:", err);
      alert("Could not delete caregiver.");
    }
  };

  // ---- Blacklist actions ----
  const handleBlacklistUser = async (reportId, userId) => {
    try {
      const report = blacklistReports.find((r) => r.id === reportId);
      if (!report) return;

      await setDoc(doc(db, "blacklist", userId), {
        userName: report.userName, // from report
        reportedByName: report.reportedByName, // caregiver name
        reason: report.reason,
        reportedBy: report.reportedBy,
        reportedAt: report.createdAt,
        description: report.description,
        blacklistedAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, "blacklistReports", reportId), {
        status: "blacklisted",
      });

      alert("User blacklisted successfully!");
      await loadBlacklistReports();
      await loadBlacklist();
    } catch (err) {
      console.error("Error blacklisting user:", err);
      alert("Could not blacklist user.");
    }
  };

  const handleRejectReport = async (reportId) => {
    try {
      await updateDoc(doc(db, "blacklistReports", reportId), {
        status: "rejected",
      });
      alert("Report rejected!");
      await loadBlacklistReports();
    } catch (err) {
      console.error("Error rejecting report:", err);
      alert("Could not reject report.");
    }
  };

  const toggleShift = (shift, isEdit = true) => {
    if (isEdit) {
      if (editShifts.includes(shift)) {
        setEditShifts(editShifts.filter((s) => s !== shift));
      } else {
        setEditShifts([...editShifts, shift]);
      }
    } else {
      if (addShifts.includes(shift)) {
        setAddShifts(addShifts.filter((s) => s !== shift));
      } else {
        setAddShifts([...addShifts, shift]);
      }
    }
  };

  const toggleService = (serviceId, isEdit = true) => {
    if (isEdit) {
      if (editServices.includes(serviceId)) {
        setEditServices(editServices.filter((s) => s !== serviceId));
      } else {
        setEditServices([...editServices, serviceId]);
      }
    } else {
      if (addServices.includes(serviceId)) {
        setAddServices(addServices.filter((s) => s !== serviceId));
      } else {
        setAddServices([...addServices, serviceId]);
      }
    }
  };

  const filteredCaregivers = allCaregivers.filter((c) => {
    const matchName = (c.name || "")
      .toLowerCase()
      .includes(searchCaregiverName.toLowerCase());
    const matchLocation =
      !locationFilter ||
      (c.location || "").toLowerCase() === locationFilter.toLowerCase();
    const matchStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "pending"
          ? !c.verified || !c.status
          : c.status === statusFilter;
    return matchName && matchLocation && matchStatus;
  });

  const filteredBookings = bookings.filter((b) => {
    const matchDate = !bookingDateFilter || b.date === bookingDateFilter;
    const matchStatus =
      !bookingStatusFilter || b.status === bookingStatusFilter;
    return matchDate && matchStatus;
  });

  const filteredReports = blacklistReports.filter(
    (r) => r.status === blacklistFilter,
  );

  const getTabButtonStyle = (tabName) => ({
    padding: "8px 16px",
    borderRadius: "999px",
    border: `1px solid ${tab === tabName ? "#0ea5e9" : "#1f2937"}`,
    background:
      tab === tabName ? "linear-gradient(135deg,#0ea5e9,#6366f1)" : "#020617",
    color: tab === tabName ? "#f9fafb" : "#e5e7eb",
    cursor: "pointer",
    fontWeight: tab === tabName ? 600 : 500,
    fontSize: 13,
    transition: "all 0.14s ease",
  });

  const handleRemoveFromBlacklist = async (userId) => {
    const confirmRemove = window.confirm(
      "Remove this user from blacklist? They will be able to use the system again.",
    );
    if (!confirmRemove) return;
    try {
      await deleteDoc(doc(db, "blacklist", userId));
      await loadBlacklist();
    } catch (err) {
      console.error("Error removing from blacklist:", err);
      alert("Could not remove from blacklist.");
    }
  };

  const getCategoryServices = (servicesList, caregiverCategory) => {
    if (!caregiverCategory || caregiverCategory === "both") {
      return servicesList;
    }
    return servicesList.filter((s) => s.category === caregiverCategory);
  };

  // ---- Services actions ----
  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newServiceLabel.trim()) {
      alert("Please enter a service name.");
      return;
    }
    try {
      const id = newServiceLabel.trim().toLowerCase().replace(/\s+/g, "_");

      await setDoc(doc(db, "services", id), {
        label: newServiceLabel.trim(),
        category: newServiceCategory, // caregiver / household / both mapped via category
        createdAt: new Date().toISOString(),
      });

      setNewServiceLabel("");
      setNewServiceCategory("caregiver");
      await loadServices();
    } catch (err) {
      console.error("Error adding service:", err);
      alert("Could not add service.");
    }
  };

  const handleStartEditService = (service) => {
    setEditingService(service);
    setEditServiceLabel(service.label || "");
    setEditServiceCategory(service.category || "caregiver");
  };

  const handleCancelEditService = () => {
    setEditingService(null);
    setEditServiceLabel("");
    setEditServiceCategory("caregiver");
  };

  const handleSaveService = async () => {
    if (!editingService) return;
    if (!editServiceLabel.trim()) {
      alert("Please enter a service name.");
      return;
    }
    try {
      await updateDoc(doc(db, "services", editingService.id), {
        label: editServiceLabel.trim(),
        category: editServiceCategory,
      });
      alert("Service updated successfully!");
      setEditingService(null);
      setEditServiceLabel("");
      setEditServiceCategory("caregiver");
      await loadServices();
    } catch (err) {
      console.error("Error updating service:", err);
      alert("Could not update service.");
    }
  };

  const handleDeleteService = async (id, label) => {
    const confirmDelete = window.confirm(
      `Delete service "${label}"? This cannot be undone.`,
    );
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "services", id));
      await loadServices();
    } catch (err) {
      console.error("Error deleting service:", err);
      alert("Could not delete service.");
    }
  };
  return (
    <div>
      <h2 className="section-title">Admin dashboard</h2>
      <p
        style={{
          fontSize: 13,
          color: "#9ca3af",
          marginTop: -4,
          marginBottom: 16,
        }}
      >
        Manage caregivers, verify applications, review bookings, and system
        settings.
      </p>

      <div className="choice-buttons" style={{ marginBottom: 16 }}>
        <button
          type="button"
          style={getTabButtonStyle("caregivers")}
          onClick={() => setTab("caregivers")}
        >
          Caregivers
        </button>
        <button
          type="button"
          style={getTabButtonStyle("bookings")}
          onClick={() => setTab("bookings")}
        >
          Bookings & analytics
        </button>
        <button
          type="button"
          style={getTabButtonStyle("services")}
          onClick={() => setTab("services")}
        >
          Services
        </button>
        <button
          type="button"
          style={getTabButtonStyle("blacklist")}
          onClick={() => setTab("blacklist")}
        >
          Blacklist
        </button>
      </div>

      {/* ---- Caregivers tab ---- */}
      {tab === "caregivers" && (
        <>
          {loadingCaregivers ? (
            <p>Loading caregiver profiles...</p>
          ) : (
            <>
              <div className="row" style={{ marginBottom: 16 }}>
                <div className="col">
                  <label>Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="unapproved">Unapproved</option>
                  </select>
                </div>
                <div className="col">
                  <label>Location</label>
                  <input
                    placeholder="Filter by location..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>
                <div className="col">
                  <label>Search</label>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchCaregiverName}
                    onChange={(e) => setSearchCaregiverName(e.target.value)}
                  />
                </div>
              </div>

              {/* Add caregiver */}
              <div
                className="card"
                style={{ marginBottom: 16, background: "#0b1120" }}
              >
                <h4 style={{ color: "#e5e7eb", marginTop: 0 }}>
                  Add new caregiver manually
                </h4>
                <form className="form" onSubmit={handleAddCaregiver}>
                  <label>Name</label>
                  <input
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Full name"
                    required
                  />

                  <label>Location</label>
                  <input
                    value={addLocation}
                    onChange={(e) => setAddLocation(e.target.value)}
                    placeholder="City/Area..."
                    required
                  />

                  <label>Category</label>
                  <select
                    value={addCategory}
                    onChange={(e) => {
                      setAddCategory(e.target.value);
                      setAddServices([]);
                    }}
                  >
                    <option value="caregiver">Care giver</option>
                    <option value="household">Household</option>
                    <option value="both">Both</option>
                  </select>

                  <label>Work type</label>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        padding: "8px 16px",
                        borderRadius: "999px",
                        border: `1px solid ${
                          addWorkType === "full_time" ? "#0ea5e9" : "#1f2937"
                        }`,
                        background:
                          addWorkType === "full_time" ? "#0ea5e9" : "#020617",
                        color:
                          addWorkType === "full_time" ? "#f9fafb" : "#e5e7eb",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setAddWorkType("full_time");
                        setAddShifts([]);
                      }}
                    >
                      Full time
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: "8px 16px",
                        borderRadius: "999px",
                        border: `1px solid ${
                          addWorkType === "part_time" ? "#fbbf24" : "#1f2937"
                        }`,
                        background:
                          addWorkType === "part_time" ? "#fbbf24" : "#020617",
                        color:
                          addWorkType === "part_time" ? "#000000" : "#e5e7eb",
                        cursor: "pointer",
                      }}
                      onClick={() => setAddWorkType("part_time")}
                    >
                      Part time
                    </button>
                  </div>

                  {addWorkType === "part_time" && (
                    <>
                      <label style={{ marginTop: 12 }}>Shifts</label>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {["morning", "day", "night"].map((s) => (
                          <button
                            key={s}
                            type="button"
                            style={{
                              padding: "6px 12px",
                              borderRadius: "999px",
                              border: `1px solid ${
                                addShifts.includes(s) ? "#0ea5e9" : "#1f2937"
                              }`,
                              background: addShifts.includes(s)
                                ? "#0ea5e9"
                                : "#020617",
                              color: addShifts.includes(s)
                                ? "#f9fafb"
                                : "#e5e7eb",
                              cursor: "pointer",
                              fontSize: 12,
                            }}
                            onClick={() => toggleShift(s, false)}
                          >
                            {s === "morning"
                              ? "Morning"
                              : s === "day"
                                ? "Day"
                                : "Night"}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <label style={{ marginTop: 12 }}>
                    Services offered (checklist)
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {servicesKey && services.length === 0 && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#9ca3af",
                        }}
                      >
                        No services available. Add services first.
                      </p>
                    )}
                    {getCategoryServices(services, addCategory).map((s) => (
                      <label
                        key={s.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          cursor: "pointer",
                          padding: "6px 12px",
                          borderRadius: "999px",
                          background: addServices.includes(s.id)
                            ? "#10b981"
                            : "#020617",
                          border: `1px solid ${
                            addServices.includes(s.id) ? "#10b981" : "#1f2937"
                          }`,
                          color: addServices.includes(s.id)
                            ? "#f9fafb"
                            : "#e5e7eb",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={addServices.includes(s.id)}
                          onChange={() => toggleService(s.id, false)}
                          style={{ cursor: "pointer" }}
                        />
                        {s.label}
                      </label>
                    ))}
                  </div>

                  <button
                    className="btn btn-primary"
                    type="submit"
                    style={{ marginTop: 16 }}
                  >
                    Add caregiver
                  </button>
                </form>
              </div>

              {/* Edit caregiver */}
              {editingCaregiver && (
                <div
                  className="card"
                  style={{
                    marginBottom: 16,
                    background: "#0b1120",
                  }}
                >
                  <h4
                    style={{
                      color: "#e5e7eb",
                      marginTop: 0,
                    }}
                  >
                    Edit {editingCaregiver.name}
                  </h4>
                  <div className="form">
                    <label>Name</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />

                    <label>Location</label>
                    <input
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                    />

                    <label>Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => {
                        setEditCategory(e.target.value);
                        setEditServices([]);
                      }}
                    >
                      <option value="caregiver">Care giver</option>
                      <option value="household">Household</option>
                      <option value="both">Both</option>
                    </select>

                    <label style={{ marginTop: 12 }}>Availability</label>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          padding: "8px 16px",
                          borderRadius: "999px",
                          border: `1px solid ${
                            editAvailable ? "#22c55e" : "#e5e7eb"
                          }`,
                          background: editAvailable ? "#22c55e" : "#020617",
                          color: editAvailable ? "#f9fafb" : "#e5e7eb",
                          cursor: "pointer",
                        }}
                        onClick={() => setEditAvailable(true)}
                      >
                        Available
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: "8px 16px",
                          borderRadius: "999px",
                          border: `1px solid ${
                            !editAvailable ? "#ef4444" : "#e5e7eb"
                          }`,
                          background: !editAvailable ? "#ef4444" : "#020617",
                          color: !editAvailable ? "#f9fafb" : "#e5e7eb",
                          cursor: "pointer",
                        }}
                        onClick={() => setEditAvailable(false)}
                      >
                        Not available
                      </button>
                    </div>

                    <label style={{ marginTop: 12 }}>Verification status</label>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          padding: "8px 16px",
                          borderRadius: "999px",
                          border: `1px solid ${
                            editVerified ? "#10b981" : "#e5e7eb"
                          }`,
                          background: editVerified ? "#10b981" : "#020617",
                          color: editVerified ? "#f9fafb" : "#e5e7eb",
                          cursor: "pointer",
                        }}
                        onClick={() => setEditVerified(true)}
                      >
                        Verified
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: "8px 16px",
                          borderRadius: "999px",
                          border: `1px solid ${
                            !editVerified ? "#fbbf24" : "#e5e7eb"
                          }`,
                          background: !editVerified ? "#fbbf24" : "#020617",
                          color: !editVerified ? "#000000" : "#e5e7eb",
                          cursor: "pointer",
                        }}
                        onClick={() => setEditVerified(false)}
                      >
                        Not verified
                      </button>
                    </div>

                    <label style={{ marginTop: 12 }}>Work type</label>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          padding: "8px 16px",
                          borderRadius: "999px",
                          border: `1px solid ${
                            editWorkType === "full_time" ? "#0ea5e9" : "#1f2937"
                          }`,
                          background:
                            editWorkType === "full_time"
                              ? "#0ea5e9"
                              : "#020617",
                          color:
                            editWorkType === "full_time"
                              ? "#f9fafb"
                              : "#e5e7eb",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setEditWorkType("full_time");
                          setEditShifts([]);
                        }}
                      >
                        Full time
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: "8px 16px",
                          borderRadius: "999px",
                          border: `1px solid ${
                            editWorkType === "part_time" ? "#fbbf24" : "#1f2937"
                          }`,
                          background:
                            editWorkType === "part_time"
                              ? "#fbbf24"
                              : "#020617",
                          color:
                            editWorkType === "part_time"
                              ? "#000000"
                              : "#e5e7eb",
                          cursor: "pointer",
                        }}
                        onClick={() => setEditWorkType("part_time")}
                      >
                        Part time
                      </button>
                    </div>

                    {editWorkType === "part_time" && (
                      <>
                        <label style={{ marginTop: 12 }}>Shifts</label>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          {["morning", "day", "night"].map((s) => (
                            <button
                              key={s}
                              type="button"
                              style={{
                                padding: "6px 12px",
                                borderRadius: "999px",
                                border: `1px solid ${
                                  editShifts.includes(s) ? "#0ea5e9" : "#1f2937"
                                }`,
                                background: editShifts.includes(s)
                                  ? "#0ea5e9"
                                  : "#020617",
                                color: editShifts.includes(s)
                                  ? "#f9fafb"
                                  : "#e5e7eb",
                                cursor: "pointer",
                                fontSize: 12,
                              }}
                              onClick={() => toggleShift(s, true)}
                            >
                              {s === "morning"
                                ? "Morning"
                                : s === "day"
                                  ? "Day"
                                  : "Night"}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    <label style={{ marginTop: 12 }}>
                      Services offered (checklist)
                    </label>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      {servicesKey && services.length === 0 && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "#9ca3af",
                          }}
                        >
                          No services available.
                        </p>
                      )}
                      {getCategoryServices(services, editCategory).map((s) => (
                        <label
                          key={s.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                            cursor: "pointer",
                            padding: "6px 12px",
                            borderRadius: "999px",
                            background: editServices.includes(s.id)
                              ? "#10b981"
                              : "#020617",
                            border: `1px solid ${
                              editServices.includes(s.id)
                                ? "#10b981"
                                : "#1f2937"
                            }`,
                            color: editServices.includes(s.id)
                              ? "#f9fafb"
                              : "#e5e7eb",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={editServices.includes(s.id)}
                            onChange={() => toggleService(s.id, true)}
                            style={{
                              cursor: "pointer",
                            }}
                          />
                          {s.label}
                        </label>
                      ))}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 16,
                      }}
                    >
                      <button
                        className="btn btn-primary"
                        onClick={handleSaveCaregiver}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={resetEditForm}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Caregiver list */}
              {filteredCaregivers.length === 0 ? (
                <p style={{ color: "#9ca3af" }}>No caregivers found.</p>
              ) : (
                <div>
                  <h4 style={{ color: "#e5e7eb" }}>
                    {filteredCaregivers.length} caregivers found
                  </h4>
                  {filteredCaregivers.map((c) => (
                    <div
                      key={c.id}
                      className="card"
                      style={{ marginBottom: 8 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <strong style={{ color: "#e5e7eb" }}>{c.name}</strong>
                          <span
                            className="badge"
                            style={{
                              marginLeft: 8,
                              background:
                                c.category === "household"
                                  ? "#dbeafe"
                                  : "#dcfce7",
                              color:
                                c.category === "household"
                                  ? "#0369a1"
                                  : "#15803d",
                            }}
                          >
                            {c.category === "household"
                              ? "Household"
                              : "Caregiver"}
                          </span>
                          <span
                            className="badge"
                            style={{
                              marginLeft: 8,
                              background: c.isAvailable ? "#dcfce7" : "#fecaca",
                              color: c.isAvailable ? "#15803d" : "#991b1b",
                            }}
                          >
                            {c.isAvailable ? "Available" : "Not available"}
                          </span>
                          <span
                            className="badge"
                            style={{
                              marginLeft: 8,
                              background: c.verified ? "#10b981" : "#fbbf24",
                              color: c.verified ? "#f9fafb" : "#000000",
                            }}
                          >
                            {c.verified ? "Verified" : "Not verified"}
                          </span>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#9ca3af",
                              marginTop: 6,
                            }}
                          >
                            {c.location}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#9ca3af",
                            }}
                          >
                            {c.workType === "full_time"
                              ? "Full time"
                              : "Part time"}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              marginTop: 4,
                            }}
                          >
                            ID {c.uid || c.id}
                          </div>
                        </div>
                        <div>
                          {c.status && (
                            <span
                              className="badge"
                              style={{
                                background: "#fef3c7",
                                color: "#92400e",
                                textTransform: "capitalize",
                              }}
                            >
                              {c.status}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 13,
                            color: "#cbd5f5",
                            marginTop: 10,
                          }}
                        >
                          Services:{" "}
                          {c.servicesOffered && c.servicesOffered.length
                            ? c.servicesOffered.join(", ")
                            : "None"}
                        </p>
                        {c.shifts && c.shifts.length > 0 && (
                          <p
                            style={{
                              fontSize: 13,
                              color: "#cbd5f5",
                            }}
                          >
                            Shifts: {c.shifts.join(", ")}
                          </p>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginTop: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        {!c.verified && (
                          <>
                            <button
                              className="btn btn-primary"
                              onClick={() =>
                                handleUpdateStatus(c.id, true, "approved")
                              }
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{
                                background: "#7f1d1d",
                                color: "#fecaca",
                                borderColor: "#991b1b",
                              }}
                              onClick={() =>
                                handleUpdateStatus(c.id, false, "unapproved")
                              }
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-outline"
                          onClick={() => startEditCaregiver(c)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{
                            background: "#111827",
                            color: "#e5e7eb",
                            borderColor: "#4b5563",
                          }}
                          onClick={() => handleDeleteCaregiver(c.id, c.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ---- Bookings tab ---- */}
      {tab === "bookings" && (
        <div>
          {loadingBookings ? (
            <p>Loading bookings and analytics...</p>
          ) : (
            <>
              <div className="row" style={{ marginBottom: 16 }}>
                <div className="col">
                  <label>Date</label>
                  <input
                    type="date"
                    value={bookingDateFilter}
                    onChange={(e) => setBookingDateFilter(e.target.value)}
                  />
                </div>
                <div className="col">
                  <label>Status</label>
                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {analytics && (
                <div className="row" style={{ marginBottom: 16 }}>
                  <div className="col card">
                    <h4>Total bookings</h4>
                    <p
                      style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        color: "#e5e7eb",
                      }}
                    >
                      {analytics.total}
                    </p>
                  </div>
                  <div className="col card">
                    <h4>By status</h4>
                    <ul
                      style={{
                        fontSize: 13,
                        color: "#e5e7eb",
                      }}
                    >
                      {Object.entries(analytics.byStatus).map(
                        ([status, count]) => (
                          <li key={status}>
                            {status}: {count}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                  <div className="col card">
                    <h4>By location</h4>
                    <ul
                      style={{
                        fontSize: 13,
                        color: "#e5e7eb",
                      }}
                    >
                      {Object.entries(analytics.byLocation).map(
                        ([loc, count]) => (
                          <li key={loc}>
                            {loc}: {count}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {filteredBookings.length === 0 ? (
                <p style={{ color: "#9ca3af" }}>No bookings found.</p>
              ) : (
                <div>
                  <h4 style={{ color: "#e5e7eb" }}>
                    {filteredBookings.length} bookings found
                  </h4>
                  {filteredBookings.map((b) => (
                    <div
                      key={b.id}
                      className="card"
                      style={{ marginBottom: 8 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              color: "#e5e7eb",
                              marginBottom: 4,
                            }}
                          >
                            Booking ID {b.id}
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              color: "#cbd5f5",
                              margin: 0,
                            }}
                          >
                            User: {b.userName || "Unknown"} (
                            {b.userPhone || "NA"})
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              color: "#cbd5f5",
                              margin: 0,
                            }}
                          >
                            Caregiver: {b.caregiverName || "Not assigned"} (
                            {b.caregiverLocation || "Location NA"})
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              color: "#cbd5f5",
                              margin: 0,
                            }}
                          >
                            Date: {b.date || "NA"} at {b.time || "NA"}
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              color: "#cbd5f5",
                              margin: 0,
                            }}
                          >
                            Service:{" "}
                            {(b.caregiverShifts || []).join(", ") || "NA"}
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              color: "#cbd5f5",
                              margin: 0,
                            }}
                          >
                            Payment:{" "}
                            {b.paymentMethod === "fonepay" ? "Fonepay" : "Cash"}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            className="badge"
                            style={{
                              background: "#eef2ff",
                              color: "#3730a3",
                              textTransform: "capitalize",
                            }}
                          >
                            {b.status || "pending"}
                          </span>
                          {b.createdAt && (
                            <p
                              style={{
                                fontSize: 11,
                                color: "#6b7280",
                                marginTop: 8,
                              }}
                            >
                              Created {new Date(b.createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ---- Services tab ---- */}
      {tab === "services" && (
        <div>
          <div
            className="card"
            style={{ marginBottom: 16, background: "#0b1120" }}
          >
            <h4 style={{ color: "#e5e7eb", marginTop: 0 }}>Manage services</h4>
            <form
              className="form"
              onSubmit={handleAddService}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                value={newServiceLabel}
                onChange={(e) => setNewServiceLabel(e.target.value)}
                placeholder="Service name e.g. Elderly care"
                style={{ flex: 1, minWidth: 200 }}
              />
              <select
                value={newServiceCategory}
                onChange={(e) => setNewServiceCategory(e.target.value)}
              >
                <option value="caregiver">Care giver</option>
                <option value="household">Household</option>
              </select>
              <button className="btn btn-primary" type="submit">
                Add service
              </button>
            </form>
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginTop: 8,
              }}
            >
              These services are shown as options to caregivers and users across
              the app.
            </p>
          </div>

          <div>
            <h4 style={{ color: "#e5e7eb" }}>
              Current services ({services.length})
            </h4>
            {services.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>No services found.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                  marginTop: 8,
                }}
              >
                {services.map((s) => {
                  const isEditing = editingService?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      className="card"
                      style={{ background: "#020617" }}
                    >
                      {isEditing ? (
                        <>
                          <p
                            style={{
                              color: "#e5e7eb",
                              marginBottom: 4,
                            }}
                          >
                            <strong>Edit service</strong>
                          </p>
                          <input
                            value={editServiceLabel}
                            onChange={(e) =>
                              setEditServiceLabel(e.target.value)
                            }
                            placeholder="Service name"
                            style={{
                              width: "100%",
                              marginBottom: 8,
                            }}
                          />
                          <select
                            value={editServiceCategory}
                            onChange={(e) =>
                              setEditServiceCategory(e.target.value)
                            }
                            style={{
                              width: "100%",
                              marginBottom: 8,
                            }}
                          >
                            <option value="caregiver">Care giver</option>
                            <option value="household">Household</option>
                          </select>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#9ca3af",
                              margin: 0,
                              marginBottom: 8,
                            }}
                          >
                            ID{" "}
                            <code
                              style={{
                                background: "#0b1120",
                                padding: "2px 4px",
                                borderRadius: 4,
                              }}
                            >
                              {s.id}
                            </code>
                          </p>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              marginTop: 4,
                            }}
                          >
                            <button
                              className="btn btn-primary"
                              type="button"
                              onClick={handleSaveService}
                              style={{ flex: 1 }}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-outline"
                              type="button"
                              onClick={handleCancelEditService}
                              style={{ flex: 1 }}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p
                            style={{
                              color: "#e5e7eb",
                              marginBottom: 4,
                            }}
                          >
                            <strong>{s.label}</strong>
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#9ca3af",
                              margin: 0,
                            }}
                          >
                            Category:{" "}
                            {s.category === "household"
                              ? "Household"
                              : "Care giver"}
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#9ca3af",
                              margin: 0,
                              marginBottom: 8,
                            }}
                          >
                            ID{" "}
                            <code
                              style={{
                                background: "#0b1120",
                                padding: "2px 4px",
                                borderRadius: 4,
                              }}
                            >
                              {s.id}
                            </code>
                          </p>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              marginTop: 4,
                            }}
                          >
                            <button
                              className="btn btn-outline"
                              type="button"
                              onClick={() => handleStartEditService(s)}
                              style={{ flex: 1 }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-outline"
                              type="button"
                              onClick={() => handleDeleteService(s.id, s.label)}
                              style={{
                                flex: 1,
                                background: "#7f1d1d",
                                color: "#fecaca",
                                borderColor: "#991b1b",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Blacklist tab ---- */}
      {tab === "blacklist" && (
        <div>
          <div className="row" style={{ marginBottom: 16 }}>
            <div className="col">
              <label>Report status</label>
              <select
                value={blacklistFilter}
                onChange={(e) => setBlacklistFilter(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="blacklisted">Blacklisted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Reports */}
          <div
            style={{
              marginBottom: 24,
              borderBottom: "1px solid #1f2937",
              paddingBottom: 16,
            }}
          >
            <h4 style={{ color: "#e5e7eb" }}>
              Reports ({filteredReports.length})
            </h4>
            {filteredReports.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>No reports found.</p>
            ) : (
              filteredReports.map((r) => (
                <div key={r.id} className="card" style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: "#e5e7eb",
                          marginBottom: 4,
                        }}
                      >
                        User:{" "}
                        <strong>{r.userName || r.userId || "Unknown"}</strong>
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#cbd5f5",
                          margin: 0,
                        }}
                      >
                        Booking ID {r.bookingId}
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#cbd5f5",
                          margin: 0,
                        }}
                      >
                        Reported by{" "}
                        <strong>
                          {r.reportedByName ||
                            r.reportedBy ||
                            "Unknown caregiver"}
                        </strong>
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#cbd5f5",
                          margin: 0,
                        }}
                      >
                        Reason: {r.reason || "NA"}
                      </p>
                      {r.description && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "#cbd5f5",
                            marginTop: 4,
                          }}
                        >
                          {r.description}
                        </p>
                      )}
                      <p
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          marginTop: 4,
                        }}
                      >
                        Created{" "}
                        {r.createdAt?.toDate?.()?.toLocaleString?.() || "NA"}
                      </p>
                    </div>
                    <div>
                      <span
                        className="badge"
                        style={{
                          background: "#eef2ff",
                          color: "#3730a3",
                          textTransform: "capitalize",
                        }}
                      >
                        {r.status || "pending"}
                      </span>
                      {r.status === "pending" && (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            className="btn btn-primary"
                            onClick={() => handleBlacklistUser(r.id, r.userId)}
                          >
                            Blacklist user
                          </button>
                          <button
                            className="btn btn-outline"
                            onClick={() => handleRejectReport(r.id)}
                            style={{
                              background: "#111827",
                              color: "#e5e7eb",
                              borderColor: "#4b5563",
                            }}
                          >
                            Reject report
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Blacklisted users */}
          <div>
            <h4 style={{ color: "#e5e7eb" }}>
              Blacklisted users ({blacklist.length})
            </h4>
            {blacklist.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>No users blacklisted.</p>
            ) : (
              blacklist.map((u) => (
                <div key={u.id} className="card" style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: "#e5e7eb",
                          marginBottom: 4,
                        }}
                      >
                        <strong>{u.userName || "Unknown user"}</strong>
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#cbd5f5",
                          margin: 0,
                        }}
                      >
                        Reason: {u.reason || "NA"}
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#cbd5f5",
                          margin: 0,
                        }}
                      >
                        Reported by{" "}
                        <strong>
                          {u.reportedByName || "Unknown caregiver"}
                        </strong>
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          marginTop: 4,
                        }}
                      >
                        Blacklisted{" "}
                        {u.blacklistedAt
                          ? `${new Date(
                              u.blacklistedAt,
                            ).toLocaleDateString()} at ${new Date(
                              u.blacklistedAt,
                            ).toLocaleTimeString()}`
                          : "NA"}
                      </p>
                    </div>
                    <div>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleRemoveFromBlacklist(u.id)}
                        style={{
                          background: "#111827",
                          color: "#e5e7eb",
                          borderColor: "#4b5563",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
