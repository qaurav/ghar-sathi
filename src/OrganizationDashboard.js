// src/OrganizationDashboard.js
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "./firebaseConfig";
import { useAuth } from "./AuthContext";
import "./OrganizationDashboard.css";

export default function OrganizationDashboard() {
  const { user, userDoc } = useAuth();

  const [activeTab, setActiveTab] = useState("caregivers");
  const [loading, setLoading] = useState(true);
  const [organizationData, setOrganizationData] = useState(null);
  const [caregivers, setCaregivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");

  // Add caregiver
  const [showAddCaregiverForm, setShowAddCaregiverForm] = useState(false);
  const [caregiverName, setCaregiverName] = useState("");
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [caregiverPassword, setCaregiverPassword] = useState("");
  const [caregiverPhone, setCaregiverPhone] = useState("");
  const [caregiverLocation, setCaregiverLocation] = useState("");
  const [caregiverCategory, setCaregiverCategory] = useState("caregiver");
  const [caregiverWorkType, setCaregiverWorkType] = useState("parttime");
  const [caregiverShifts, setCaregiverShifts] = useState([]);
  const [caregiverServices, setCaregiverServices] = useState([]);
  const [caregiverHourlyRate, setCaregiverHourlyRate] = useState(500);
  const [caregiverExperience, setCaregiverExperience] = useState(0);
  const [addingCaregiver, setAddingCaregiver] = useState(false);

  // Services management
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [newServiceLabel, setNewServiceLabel] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("caregiver");
  const [addingService, setAddingService] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editServiceLabel, setEditServiceLabel] = useState("");
  const [editServiceCategory, setEditServiceCategory] =
    useState("caregiver");

  // Blacklist
  const [orgBlacklist, setOrgBlacklist] = useState([]);
  const [showBlacklistForm, setShowBlacklistForm] = useState(false);
  const [selectedCaregiverToBlacklist, setSelectedCaregiverToBlacklist] =
    useState(null);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [blacklistDescription, setBlacklistDescription] = useState("");
  const [blacklisting, setBlacklisting] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError("");

        // Organization info
        const orgSnap = await getDoc(doc(db, "organizations", user.uid));
        if (orgSnap.exists()) {
          setOrganizationData(orgSnap.data());
        }

        // Caregivers (vendors)
        const caregiversQuery = query(
          collection(db, "vendors"),
          where("organizationId", "==", user.uid)
        );
        const caregiversSnap = await getDocs(caregiversQuery);
        const caregiversData = caregiversSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setCaregivers(caregiversData);

        // Bookings for those caregivers (limited in query)
        const caregiverIds = caregiversData.map((c) => c.id);
        if (caregiverIds.length > 0) {
          const bookingsQuery = query(
            collection(db, "bookings"),
            where("caregiverId", "in", caregiverIds.slice(0, 10))
          );
          const bookingsSnap = await getDocs(bookingsQuery);
          const bookingsData = bookingsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setBookings(bookingsData);
        } else {
          setBookings([]);
        }

        // Services (all)
        const servicesSnap = await getDocs(collection(db, "services"));
        const servicesData = servicesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setServices(servicesData);

        // Organization blacklist
        const blacklistQueryRef = query(
          collection(db, "organizationBlacklist"),
          where("organizationId", "==", user.uid)
        );
        const blacklistSnap = await getDocs(blacklistQueryRef);
        const blacklistData = blacklistSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setOrgBlacklist(blacklistData);
      } catch (err) {
        console.error("Error loading data", err);
        setError("Could not load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Add caregiver
  const handleAddCaregiver = async (e) => {
    e.preventDefault();
    setError("");
    setAddingCaregiver(true);

    try {
      const caregiverCred = await createUserWithEmailAndPassword(
        auth,
        caregiverEmail,
        caregiverPassword
      );
      const caregiverUid = caregiverCred.user.uid;

      const caregiverUserData = {
        uid: caregiverUid,
        name: caregiverName,
        email: caregiverEmail,
        role: "caregiver",
        phone: caregiverPhone,
        createdAt: new Date().toISOString(),
        isApproved: false, // org must approve
        isSuspended: false,
        profileComplete: true,
        organizationId: user.uid,
        organizationName: organizationData?.organizationName || "",
        addedBy: user.uid,
        addedByName: userDoc?.name || "",
      };

      await setDoc(doc(db, "users", caregiverUid), caregiverUserData);

      const vendorData = {
        uid: caregiverUid,
        vendorId: caregiverUid,
        name: caregiverName,
        email: caregiverEmail,
        phone: caregiverPhone,
        location: caregiverLocation,
        category: caregiverCategory,
        workType: caregiverWorkType,
        shifts: caregiverWorkType === "parttime" ? caregiverShifts : [],
        servicesOffered: caregiverServices,
        hourlyRate: Number(caregiverHourlyRate) || 0,
        experience: Number(caregiverExperience) || 0,
        bio: "",
        jobsCompleted: 0,
        rating: 5,
        reviewCount: 0,
        verified: false,
        backgroundChecked: false,
        isAvailable: true,
        isApproved: false,
        isSuspended: false,
        totalEarnings: 0,
        pendingEarnings: 0,
        satisfactionRate: 95,
        organizationId: user.uid,
        organizationName: organizationData?.organizationName || "",
        isIndependent: false,
        addedBy: user.uid,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "vendors", caregiverUid), vendorData);

      // link caregiver to org
      const orgRef = doc(db, "organizations", user.uid);
      const orgSnap = await getDoc(orgRef);
      const currentCaregivers = orgSnap.data()?.caregivers || [];
      await updateDoc(orgRef, {
        caregivers: [...currentCaregivers, caregiverUid],
        totalCaregivers: (currentCaregivers.length || 0) + 1,
        updatedAt: new Date().toISOString(),
      });

      alert(
        "Caregiver added successfully! Don't forget to approve them."
      );

      // reset form
      setCaregiverName("");
      setCaregiverEmail("");
      setCaregiverPassword("");
      setCaregiverPhone("");
      setCaregiverLocation("");
      setCaregiverCategory("caregiver");
      setCaregiverWorkType("parttime");
      setCaregiverShifts([]);
      setCaregiverServices([]);
      setCaregiverHourlyRate(500);
      setCaregiverExperience(0);
      setShowAddCaregiverForm(false);

      // reload caregivers
      const caregiversQuery = query(
        collection(db, "vendors"),
        where("organizationId", "==", user.uid)
      );
      const caregiversSnap = await getDocs(caregiversQuery);
      const caregiversData = caregiversSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setCaregivers(caregiversData);
    } catch (err) {
      console.error("Error adding caregiver", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError(err.message || "Could not add caregiver.");
      }
    } finally {
      setAddingCaregiver(false);
    }
  };

  // Approve caregiver
  const handleApproveCaregiver = async (caregiverId) => {
    try {
      await updateDoc(doc(db, "vendors", caregiverId), {
        isApproved: true,
        approvedAt: serverTimestamp(),
        approvedBy: user.uid,
        approvedByName: userDoc?.name || "",
      });
      await updateDoc(doc(db, "users", caregiverId), {
        isApproved: true,
      });
      alert(
        "Caregiver approved! They can now appear in listings and receive bookings."
      );

      const caregiversQuery = query(
        collection(db, "vendors"),
        where("organizationId", "==", user.uid)
      );
      const caregiversSnap = await getDocs(caregiversQuery);
      const caregiversData = caregiversSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setCaregivers(caregiversData);
    } catch (err) {
      console.error("Error approving caregiver", err);
      alert("Could not approve caregiver.");
    }
  };

  // Reject caregiver
  const handleRejectCaregiver = async (caregiverId) => {
    const reason = window.prompt("Enter rejection reason");
    if (!reason) return;
    try {
      await updateDoc(doc(db, "vendors", caregiverId), {
        isApproved: false,
        rejectionReason: reason,
        rejectedAt: serverTimestamp(),
      });
      alert("Caregiver rejected.");

      const caregiversQuery = query(
        collection(db, "vendors"),
        where("organizationId", "==", user.uid)
      );
      const caregiversSnap = await getDocs(caregiversQuery);
      const caregiversData = caregiversSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setCaregivers(caregiversData);
    } catch (err) {
      console.error("Error rejecting caregiver", err);
      alert("Could not reject caregiver.");
    }
  };

  // Delete caregiver
  const handleDeleteCaregiver = async (caregiverId, caregiverNameToShow) => {
    if (
      !window.confirm(
        `Delete ${caregiverNameToShow}? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await deleteDoc(doc(db, "vendors", caregiverId));
      await deleteDoc(doc(db, "users", caregiverId));

      const orgRef = doc(db, "organizations", user.uid);
      const orgSnap = await getDoc(orgRef);
      const currentCaregivers = orgSnap.data()?.caregivers || [];
      await updateDoc(orgRef, {
        caregivers: currentCaregivers.filter((id) => id !== caregiverId),
        totalCaregivers: Math.max(
          0,
          (currentCaregivers.length || 1) - 1
        ),
      });

      setCaregivers((prev) =>
        prev.filter((c) => c.id !== caregiverId)
      );
      alert("Caregiver removed successfully.");
    } catch (err) {
      console.error("Error deleting caregiver", err);
      alert("Could not delete caregiver.");
    }
  };

  // Add service
  const handleAddService = async (e) => {
    e.preventDefault();
    setError("");
    if (!newServiceLabel.trim()) {
      setError("Please enter a service name.");
      return;
    }
    try {
      setAddingService(true);
      const serviceId =
        user.uid +
        "_" +
        newServiceLabel.trim().toLowerCase().replace(/\s+/g, "_");

      await setDoc(doc(db, "services", serviceId), {
        label: newServiceLabel.trim(),
        category: newServiceCategory,
        organizationId: user.uid,
        organizationName: organizationData?.organizationName || "",
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });

      alert("Service added successfully!");
      setNewServiceLabel("");
      setNewServiceCategory("caregiver");
      setShowAddServiceForm(false);

      const servicesSnap = await getDocs(collection(db, "services"));
      const servicesData = servicesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setServices(servicesData);
    } catch (err) {
      console.error("Error adding service", err);
      setError("Could not add service.");
    } finally {
      setAddingService(false);
    }
  };

  const startEditService = (service) => {
    setEditingService(service);
    setEditServiceLabel(service.label);
    setEditServiceCategory(service.category || "caregiver");
  };

  const handleUpdateService = async () => {
    if (!editServiceLabel.trim()) {
      setError("Service name cannot be empty.");
      return;
    }
    try {
      await updateDoc(doc(db, "services", editingService.id), {
        label: editServiceLabel.trim(),
        category: editServiceCategory,
        updatedAt: serverTimestamp(),
      });
      alert("Service updated!");
      setEditingService(null);
      setEditServiceLabel("");
      setEditServiceCategory("caregiver");

      const servicesSnap = await getDocs(collection(db, "services"));
      const servicesData = servicesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setServices(servicesData);
    } catch (err) {
      console.error("Error updating service", err);
      setError("Could not update service.");
    }
  };

  const handleDeleteService = async (serviceId, label) => {
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, "services", serviceId));
      alert("Service deleted!");
      const servicesSnap = await getDocs(collection(db, "services"));
      const servicesData = servicesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setServices(servicesData);
    } catch (err) {
      console.error("Error deleting service", err);
      alert("Could not delete service.");
    }
  };

  // Blacklist
  const openBlacklistForm = (caregiver) => {
    setSelectedCaregiverToBlacklist(caregiver);
    setShowBlacklistForm(true);
    setBlacklistReason("");
    setBlacklistDescription("");
    setError("");
  };

  const handleBlacklistCaregiver = async (e) => {
    e.preventDefault();
    setError("");
    if (!blacklistReason || !blacklistDescription.trim()) {
      setError("Please provide reason and description.");
      return;
    }
    try {
      setBlacklisting(true);
      const blacklistId = user.uid + "_" + selectedCaregiverToBlacklist.id;

      await setDoc(doc(db, "organizationBlacklist", blacklistId), {
        caregiverId: selectedCaregiverToBlacklist.id,
        caregiverName: selectedCaregiverToBlacklist.name,
        caregiverEmail: selectedCaregiverToBlacklist.email,
        organizationId: user.uid,
        organizationName: organizationData?.organizationName || "",
        reason: blacklistReason,
        description: blacklistDescription.trim(),
        blacklistedAt: serverTimestamp(),
        blacklistedBy: user.uid,
        blacklistedByName: userDoc?.name || "",
      });

      // suspend caregiver
      await updateDoc(
        doc(db, "vendors", selectedCaregiverToBlacklist.id),
        {
          isSuspended: true,
          suspendedBy: user.uid,
          suspendedReason: blacklistReason,
          suspendedAt: serverTimestamp(),
        }
      );
      await updateDoc(
        doc(db, "users", selectedCaregiverToBlacklist.id),
        {
          isSuspended: true,
        }
      );

      alert("Caregiver blacklisted and suspended successfully!");
      setShowBlacklistForm(false);
      setSelectedCaregiverToBlacklist(null);
      setBlacklistReason("");
      setBlacklistDescription("");

      const caregiversQuery = query(
        collection(db, "vendors"),
        where("organizationId", "==", user.uid)
      );
      const caregiversSnap = await getDocs(caregiversQuery);
      const caregiversData = caregiversSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setCaregivers(caregiversData);

      const blacklistQueryRef = query(
        collection(db, "organizationBlacklist"),
        where("organizationId", "==", user.uid)
      );
      const blacklistSnap = await getDocs(blacklistQueryRef);
      const blacklistData = blacklistSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setOrgBlacklist(blacklistData);
    } catch (err) {
      console.error("Error blacklisting caregiver", err);
      setError("Could not blacklist caregiver.");
    } finally {
      setBlacklisting(false);
    }
  };

  const handleRemoveFromBlacklist = async (blacklistId, caregiverId) => {
    if (
      !window.confirm(
        "Remove this caregiver from blacklist? They will be unsuspended."
      )
    ) {
      return;
    }
    try {
      await deleteDoc(doc(db, "organizationBlacklist", blacklistId));

      await updateDoc(doc(db, "vendors", caregiverId), {
        isSuspended: false,
        suspendedBy: null,
        suspendedReason: null,
        suspendedAt: null,
      });
      await updateDoc(doc(db, "users", caregiverId), {
        isSuspended: false,
      });

      alert("Caregiver removed from blacklist and unsuspended.");

      const blacklistQueryRef = query(
        collection(db, "organizationBlacklist"),
        where("organizationId", "==", user.uid)
      );
      const blacklistSnap = await getDocs(blacklistQueryRef);
      const blacklistData = blacklistSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setOrgBlacklist(blacklistData);

      const caregiversQuery = query(
        collection(db, "vendors"),
        where("organizationId", "==", user.uid)
      );
      const caregiversSnap = await getDocs(caregiversQuery);
      const caregiversData = caregiversSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setCaregivers(caregiversData);
    } catch (err) {
      console.error("Error removing from blacklist", err);
      alert("Could not remove from blacklist.");
    }
  };

  const toggleShift = (shift) => {
    if (caregiverShifts.includes(shift)) {
      setCaregiverShifts(
        caregiverShifts.filter((s) => s !== shift)
      );
    } else {
      setCaregiverShifts([...caregiverShifts, shift]);
    }
  };

  const toggleService = (serviceId) => {
    if (caregiverServices.includes(serviceId)) {
      setCaregiverServices(
        caregiverServices.filter((s) => s !== serviceId)
      );
    } else {
      setCaregiverServices([...caregiverServices, serviceId]);
    }
  };

  const getTabStyle = (tabName) => ({
    padding: "8px 16px",
    borderRadius: "6px",
    border: activeTab === tabName ? "none" : "1px solid #1f2937",
    background:
      activeTab === tabName
        ? "linear-gradient(135deg, #0ea5e9, #06b6d4)"
        : "#020617",
    color: activeTab === tabName ? "#ffffff" : "#e5e7eb",
    cursor: "pointer",
    fontWeight: activeTab === tabName ? 600 : 500,
    fontSize: 13,
  });

  if (loading) {
    return (
      <p style={{ color: "#9ca3af", textAlign: "center", padding: 20 }}>
        Loading dashboard...
      </p>
    );
  }

  if (!organizationData?.isApproved) {
    return (
      <div style={{ padding: 20 }}>
        <div
          style={{
            background: "#fef3c7",
            color: "#92400e",
            padding: 16,
            borderRadius: 8,
            fontSize: 14,
            border: "1px solid #fcd34d",
            textAlign: "center",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>
            Approval Pending
          </h3>
          <p style={{ margin: 0 }}>
            Your organization is pending approval from Ghar Sathi team.
            You&apos;ll be notified once approved.
          </p>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ color: "#e5e7eb", marginTop: 0 }}>
            Organization Details
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: "8px 0",
            }}
          >
            <strong>Name:</strong>{" "}
            {organizationData?.organizationName}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: "8px 0",
            }}
          >
            <strong>Admin:</strong> {organizationData?.adminName}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: "8px 0",
            }}
          >
            <strong>Email:</strong> {organizationData?.adminEmail}
          </p>
        </div>
      </div>
    );
  }

  const completedBookings = bookings.filter(
    (b) => b.status === "completed"
  ).length;
  const totalRevenue = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const orgEarnings = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (b.vendorEarnings || 0), 0);

  const orgServices = services.filter(
    (s) => s.organizationId === user?.uid
  );
  const globalServices = services.filter((s) => !s.organizationId);

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ color: "#e5e7eb", marginBottom: 8 }}>
        {organizationData?.organizationName} Organization Dashboard
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "#9ca3af",
          marginBottom: 16,
        }}
      >
        Manage your caregiver team, services, and track performance.
      </p>

      {error && <div className="error-message">{error}</div>}

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div className="card" style={{ background: "#0b1120", textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Total Caregivers
          </p>
          <p
            style={{
              fontSize: 24,
              color: "#0ea5e9",
              fontWeight: "bold",
              margin: 0,
            }}
          >
            {caregivers.length}
          </p>
        </div>
        <div className="card" style={{ background: "#0b1120", textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Active Caregivers
          </p>
          <p
            style={{
              fontSize: 24,
              color: "#22c55e",
              fontWeight: "bold",
              margin: 0,
            }}
          >
            {
              caregivers.filter(
                (c) => c.isAvailable && c.isApproved
              ).length
            }
          </p>
        </div>
        <div className="card" style={{ background: "#0b1120", textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Total Bookings
          </p>
          <p
            style={{
              fontSize: 24,
              color: "#10b981",
              fontWeight: "bold",
              margin: 0,
            }}
          >
            {bookings.length}
          </p>
        </div>
        <div className="card" style={{ background: "#0b1120", textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Completed Jobs
          </p>
          <p
            style={{
              fontSize: 24,
              color: "#0ea5e9",
              fontWeight: "bold",
              margin: 0,
            }}
          >
            {completedBookings}
          </p>
        </div>
        <div className="card" style={{ background: "#0b1120", textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Total Revenue
          </p>
          <p
            style={{
              fontSize: 24,
              color: "#fbbf24",
              fontWeight: "bold",
              margin: 0,
            }}
          >
            {totalRevenue}
          </p>
        </div>
        <div className="card" style={{ background: "#0b1120", textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              margin: 0,
            }}
          >
            Org Earnings
          </p>
          <p
            style={{
              fontSize: 24,
              color: "#22c55e",
              fontWeight: "bold",
              margin: 0,
            }}
          >
            {Math.round(orgEarnings)}
          </p>
          <p
            style={{
              fontSize: 10,
              color: "#6b7280",
              margin: 0,
            }}
          >
            After {organizationData?.commissionRate ?? 15}% fee
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="choice-buttons"
        style={{ marginBottom: 24, flexWrap: "wrap" }}
      >
        <button
          type="button"
          style={getTabStyle("caregivers")}
          onClick={() => setActiveTab("caregivers")}
        >
          Caregivers ({caregivers.length})
        </button>
        <button
          type="button"
          style={getTabStyle("bookings")}
          onClick={() => setActiveTab("bookings")}
        >
          Bookings ({bookings.length})
        </button>
        <button
          type="button"
          style={getTabStyle("services")}
          onClick={() => setActiveTab("services")}
        >
          Services ({orgServices.length})
        </button>
        <button
          type="button"
          style={getTabStyle("blacklist")}
          onClick={() => setActiveTab("blacklist")}
        >
          Blacklist ({orgBlacklist.length})
        </button>
        <button
          type="button"
          style={getTabStyle("profile")}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
      </div>

      {/* CAREGIVERS TAB */}
      {activeTab === "caregivers" && (
        <div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowAddCaregiverForm(!showAddCaregiverForm);
              setError("");
            }}
            style={{ marginBottom: 16 }}
          >
            {showAddCaregiverForm
              ? "Cancel"
              : "Add New Caregiver"}
          </button>

          {showAddCaregiverForm && (
            <div
              className="card"
              style={{ marginBottom: 16, background: "#0b1120" }}
            >
              <h3 style={{ color: "#e5e7eb", marginTop: 0 }}>
                Add New Caregiver
              </h3>
              <form
                onSubmit={handleAddCaregiver}
                className="form"
              >
                <label>Full Name</label>
                <input
                  value={caregiverName}
                  onChange={(e) =>
                    setCaregiverName(e.target.value)
                  }
                  required
                  placeholder="Caregiver's full name"
                />

                <label>Email</label>
                <input
                  type="email"
                  value={caregiverEmail}
                  onChange={(e) =>
                    setCaregiverEmail(e.target.value)
                  }
                  required
                  placeholder="caregiver@example.com"
                />

                <label>Password for caregiver login</label>
                <input
                  type="password"
                  value={caregiverPassword}
                  onChange={(e) =>
                    setCaregiverPassword(e.target.value)
                  }
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                />

                <label>Phone Number</label>
                <input
                  type="tel"
                  value={caregiverPhone}
                  onChange={(e) =>
                    setCaregiverPhone(e.target.value)
                  }
                  placeholder="98XXXXXXXX"
                  maxLength={10}
                />

                <label>Location</label>
                <input
                  value={caregiverLocation}
                  onChange={(e) =>
                    setCaregiverLocation(e.target.value)
                  }
                  required
                  placeholder="e.g., Kathmandu"
                />

                <label>Category</label>
                <select
                  value={caregiverCategory}
                  onChange={(e) =>
                    setCaregiverCategory(e.target.value)
                  }
                >
                  <option value="caregiver">
                    Care Giver
                  </option>
                  <option value="household">
                    Household
                  </option>
                  <option value="both">
                    Both Care Giver & Household
                  </option>
                </select>
                <p
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    marginTop: -8,
                  }}
                >
                  {caregiverCategory === "both"
                    ? "This caregiver can provide both care giving and household services."
                    : `This caregiver provides ${
                        caregiverCategory === "caregiver"
                          ? "care giving"
                          : "household"
                      } services only.`}
                </p>

                <label>Work Type</label>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCaregiverWorkType("fulltime");
                      setCaregiverShifts([]);
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border:
                        caregiverWorkType === "fulltime"
                          ? "none"
                          : "1px solid #1f2937",
                      background:
                        caregiverWorkType === "fulltime"
                          ? "#0ea5e9"
                          : "#111827",
                      color:
                        caregiverWorkType === "fulltime"
                          ? "#ffffff"
                          : "#e5e7eb",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Full Time
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCaregiverWorkType("parttime")
                    }
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border:
                        caregiverWorkType === "parttime"
                          ? "none"
                          : "1px solid #1f2937",
                      background:
                        caregiverWorkType === "parttime"
                          ? "#fbbf24"
                          : "#111827",
                      color:
                        caregiverWorkType === "parttime"
                          ? "#000000"
                          : "#e5e7eb",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Part Time
                  </button>
                </div>

                {caregiverWorkType === "parttime" && (
                  <>
                    <label>Shifts</label>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 12,
                      }}
                    >
                      {["morning", "day", "night"].map(
                        (shift) => (
                          <button
                            key={shift}
                            type="button"
                            onClick={() =>
                              toggleShift(shift)
                            }
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              border:
                                caregiverShifts.includes(
                                  shift
                                )
                                  ? "none"
                                  : "1px solid #1f2937",
                              background:
                                caregiverShifts.includes(
                                  shift
                                )
                                  ? "#0ea5e9"
                                  : "#111827",
                              color:
                                caregiverShifts.includes(
                                  shift
                                )
                                  ? "#ffffff"
                                  : "#e5e7eb",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {shift === "morning"
                              ? "Morning"
                              : shift === "day"
                              ? "Day"
                              : "Night"}
                          </button>
                        )
                      )}
                    </div>
                  </>
                )}

                <label>Services Offered</label>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 12,
                  }}
                >
                  {services.length === 0 && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                      }}
                    >
                      No services available. Add services first
                      in the Services tab.
                    </p>
                  )}
                  {services
                    .filter((s) => {
                      if (caregiverCategory === "both") {
                        return (
                          s.organizationId === user.uid ||
                          !s.organizationId
                        );
                      }
                      return (
                        (s.organizationId === user.uid ||
                          !s.organizationId) &&
                        (s.category === caregiverCategory ||
                          s.category === "both")
                      );
                    })
                    .map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() =>
                          toggleService(service.id)
                        }
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border:
                            caregiverServices.includes(
                              service.id
                            )
                              ? "none"
                              : "1px solid #1f2937",
                          background:
                            caregiverServices.includes(
                              service.id
                            )
                              ? "#10b981"
                              : "#111827",
                          color:
                            caregiverServices.includes(
                              service.id
                            )
                              ? "#ffffff"
                              : "#e5e7eb",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {service.label}
                      </button>
                    ))}
                </div>
                {caregiverCategory === "both" &&
                  services.length > 0 && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "#0ea5e9",
                        marginTop: -8,
                      }}
                    >
                      Showing all available services (both
                      caregiver and household).
                    </p>
                  )}

                <label>Hourly Rate</label>
                <input
                  type="number"
                  value={caregiverHourlyRate}
                  onChange={(e) =>
                    setCaregiverHourlyRate(e.target.value)
                  }
                  required
                  min={0}
                  placeholder="500"
                />

                <label>Years of Experience</label>
                <input
                  type="number"
                  value={caregiverExperience}
                  onChange={(e) =>
                    setCaregiverExperience(e.target.value)
                  }
                  min={0}
                  placeholder="0"
                />

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addingCaregiver}
                  style={{ marginTop: 16 }}
                >
                  {addingCaregiver
                    ? "Adding Caregiver..."
                    : "Add Caregiver"}
                </button>
              </form>
            </div>
          )}

          {caregivers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" />
              <p className="empty-state-title">
                No caregivers yet
              </p>
              <p className="empty-state-text">
                Add caregivers to your organization to start
                receiving bookings.
              </p>
            </div>
          ) : (
            caregivers.map((caregiver) => {
              const isBlacklisted = orgBlacklist.some(
                (b) => b.caregiverId === caregiver.id
              );
              return (
                <div
                  key={caregiver.id}
                  className="card"
                  style={{ marginBottom: 12 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          color: "#e5e7eb",
                          fontSize: 16,
                        }}
                      >
                        {caregiver.name || "No name"}
                      </strong>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#9ca3af",
                          marginTop: 4,
                        }}
                      >
                        {caregiver.email || "No email"}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#9ca3af",
                        }}
                      >
                        {caregiver.location || "No location"}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#9ca3af",
                        }}
                      >
                        {caregiver.phone || "No phone"}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexDirection: "column",
                        alignItems: "flex-end",
                      }}
                    >
                      {caregiver.isApproved ? (
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#15803d",
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Approved
                        </span>
                      ) : (
                        <span
                          style={{
                            background: "#fef3c7",
                            color: "#92400e",
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Pending Approval
                        </span>
                      )}
                      {caregiver.isAvailable ? (
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#15803d",
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Available
                        </span>
                      ) : (
                        <span
                          style={{
                            background: "#fee2e2",
                            color: "#991b1b",
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Not Available
                        </span>
                      )}
                      {isBlacklisted && (
                        <span
                          style={{
                            background: "#dc2626",
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Blacklisted
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: "1px solid #1f2937",
                      fontSize: 13,
                      color: "#e5e7eb",
                    }}
                  >
                    <p style={{ margin: "0 0 6px 0" }}>
                      <strong>Category:</strong>{" "}
                      {caregiver.category === "both"
                        ? "Both"
                        : caregiver.category === "caregiver"
                        ? "Care Giver"
                        : "Household"}
                    </p>
                    <p style={{ margin: "0 0 6px 0" }}>
                      <strong>Work Type:</strong>{" "}
                      {caregiver.workType === "fulltime"
                        ? "Full Time"
                        : "Part Time"}
                    </p>
                    <p style={{ margin: "0 0 6px 0" }}>
                      <strong>Shifts:</strong>{" "}
                      {caregiver.shifts?.join(", ") || "NA"}
                    </p>
                    <p style={{ margin: "0 0 6px 0" }}>
                      <strong>Services:</strong>{" "}
                      {caregiver.servicesOffered?.join(", ") ||
                        "None"}
                    </p>
                    <p style={{ margin: "0 0 6px 0" }}>
                      <strong>Hourly Rate:</strong>{" "}
                      {caregiver.hourlyRate}/hour
                    </p>
                    <p style={{ margin: "0 0 6px 0" }}>
                      <strong>Experience:</strong>{" "}
                      {caregiver.experience} years
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Jobs Completed:</strong>{" "}
                      {caregiver.jobsCompleted || 0}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    {!caregiver.isApproved &&
                      !isBlacklisted && (
                        <>
                          <button
                            className="btn btn-primary"
                            onClick={() =>
                              handleApproveCaregiver(
                                caregiver.id
                              )
                            }
                            style={{ flex: 1 }}
                          >
                            Approve Caregiver
                          </button>
                          <button
                            className="btn btn-outline"
                            onClick={() =>
                              handleRejectCaregiver(
                                caregiver.id
                              )
                            }
                            style={{
                              flex: 1,
                              background: "#111827",
                              color: "#e5e7eb",
                              border: "1px solid #1f2937",
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}

                    {caregiver.isApproved && !isBlacklisted && (
                      <button
                        className="btn btn-outline"
                        onClick={() =>
                          openBlacklistForm(caregiver)
                        }
                        style={{
                          flex: 1,
                          background: "#7f1d1d",
                          color: "#fecaca",
                          border: "1px solid #991b1b",
                        }}
                      >
                        Blacklist
                      </button>
                    )}

                    <button
                      className="btn btn-outline"
                      onClick={() =>
                        handleDeleteCaregiver(
                          caregiver.id,
                          caregiver.name || "this caregiver"
                        )
                      }
                      style={{
                        flex: 1,
                        background: "#7f1d1d",
                        color: "#fecaca",
                        border: "1px solid #991b1b",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* BOOKINGS TAB */}
      {activeTab === "bookings" && (
        <div>
          {bookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" />
              <p className="empty-state-title">
                No bookings yet
              </p>
              <p className="empty-state-text">
                Bookings will appear here when customers book your
                caregivers.
              </p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="card"
                style={{ marginBottom: 12 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <strong
                      style={{
                        color: "#e5e7eb",
                        fontSize: 16,
                      }}
                    >
                      {booking.caregiverName}
                    </strong>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        marginTop: 4,
                      }}
                    >
                      Customer: {booking.userName} (
                      {booking.userPhone})
                    </div>
                  </div>
                  <div>
                    <span
                      style={{
                        background:
                          booking.status === "completed"
                            ? "#dcfce7"
                            : booking.status === "accepted"
                            ? "#dbeafe"
                            : booking.status === "pending"
                            ? "#fef3c7"
                            : "#fee2e2",
                        color:
                          booking.status === "completed"
                            ? "#15803d"
                            : booking.status === "accepted"
                            ? "#0369a1"
                            : booking.status === "pending"
                            ? "#92400e"
                            : "#991b1b",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {(booking.status || "pending").toUpperCase()}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid #1f2937",
                    fontSize: 13,
                    color: "#e5e7eb",
                  }}
                >
                  <p style={{ margin: "0 0 6px 0" }}>
                    <strong>Date:</strong>{" "}
                    {booking.date || "NA"}
                  </p>
                  <p style={{ margin: "0 0 6px 0" }}>
                    <strong>Time:</strong>{" "}
                    {booking.time || "NA"}
                  </p>
                  <p style={{ margin: "0 0 6px 0" }}>
                    <strong>Amount:</strong>{" "}
                    {booking.totalAmount || 0}
                  </p>
                  {booking.status === "completed" && (
                    <p
                      style={{
                        margin: 0,
                        color: "#22c55e",
                      }}
                    >
                      <strong>Earnings:</strong>{" "}
                      {Math.round(
                        booking.vendorEarnings || 0
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SERVICES TAB */}
      {activeTab === "services" && (
        <div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowAddServiceForm(!showAddServiceForm);
              setError("");
            }}
            style={{ marginBottom: 16 }}
          >
            {showAddServiceForm ? "Cancel" : "Add New Service"}
          </button>

          {showAddServiceForm && (
            <div
              className="card"
              style={{ marginBottom: 16, background: "#0b1120" }}
            >
              <h3 style={{ color: "#e5e7eb", marginTop: 0 }}>
                Add New Service
              </h3>
              <form
                onSubmit={handleAddService}
                className="form"
              >
                <label>Service Name</label>
                <input
                  type="text"
                  value={newServiceLabel}
                  onChange={(e) =>
                    setNewServiceLabel(e.target.value)
                  }
                  required
                  placeholder="e.g., Elderly Care"
                />

                <label>Category</label>
                <select
                  value={newServiceCategory}
                  onChange={(e) =>
                    setNewServiceCategory(e.target.value)
                  }
                >
                  <option value="caregiver">
                    Care Giver
                  </option>
                  <option value="household">
                    Household
                  </option>
                  <option value="both">Both</option>
                </select>
                <p
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    marginTop: 4,
                  }}
                >
                  Choose whether this service is for caregivers or
                  household workers.
                </p>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addingService}
                  style={{ marginTop: 16 }}
                >
                  {addingService ? "Adding..." : "Add Service"}
                </button>
              </form>
            </div>
          )}

          <h4
            style={{ color: "#e5e7eb", marginBottom: 12 }}
          >
            Your Services ({orgServices.length})
          </h4>
          {orgServices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" />
              <p className="empty-state-title">
                No services yet
              </p>
              <p className="empty-state-text">
                Add services that your caregivers can offer.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 12,
              }}
            >
              {orgServices.map((service) => (
                <div key={service.id} className="card">
                  {editingService?.id === service.id ? (
                    <div className="form">
                      <label>Service Name</label>
                      <input
                        value={editServiceLabel}
                        onChange={(e) =>
                          setEditServiceLabel(e.target.value)
                        }
                      />
                      <label>Category</label>
                      <select
                        value={editServiceCategory}
                        onChange={(e) =>
                          setEditServiceCategory(
                            e.target.value
                          )
                        }
                      >
                        <option value="caregiver">
                          Care Giver
                        </option>
                        <option value="household">
                          Household
                        </option>
                        <option value="both">Both</option>
                      </select>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginTop: 12,
                        }}
                      >
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={handleUpdateService}
                          style={{ flex: 1 }}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-outline"
                          type="button"
                          onClick={() => {
                            setEditingService(null);
                            setEditServiceLabel("");
                            setEditServiceCategory(
                              "caregiver"
                            );
                          }}
                          style={{
                            flex: 1,
                            background: "#111827",
                            color: "#e5e7eb",
                            border: "1px solid #1f2937",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <strong
                        style={{
                          color: "#e5e7eb",
                          fontSize: 14,
                        }}
                      >
                        {service.label}
                      </strong>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#9ca3af",
                          margin: "4px 0 0 0",
                        }}
                      >
                        Category:{" "}
                        {service.category === "both"
                          ? "Both"
                          : service.category === "caregiver"
                          ? "Care Giver"
                          : "Household"}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          margin: "4px 0 12px 0",
                        }}
                      >
                        ID: {service.id}
                      </p>
                      <div
                        style={{ display: "flex", gap: 8 }}
                      >
                        <button
                          className="btn btn-outline"
                          onClick={() =>
                            startEditService(service)
                          }
                          style={{
                            flex: 1,
                            background: "#111827",
                            color: "#e5e7eb",
                            border: "1px solid #1f2937",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() =>
                            handleDeleteService(
                              service.id,
                              service.label
                            )
                          }
                          style={{
                            flex: 1,
                            background: "#7f1d1d",
                            color: "#fecaca",
                            border: "1px solid #991b1b",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Global services read-only */}
          {globalServices.length > 0 && (
            <div
              style={{
                marginTop: 40,
                paddingTop: 24,
                borderTop: "2px solid #1f2937",
              }}
            >
              <h4
                style={{
                  color: "#e5e7eb",
                  marginBottom: 12,
                }}
              >
                Platform Services ({globalServices.length})
              </h4>
              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  marginBottom: 12,
                }}
              >
                These services are available to all organizations.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 12,
                }}
              >
                {globalServices.map((service) => (
                  <div
                    key={service.id}
                    style={{
                      padding: 12,
                      background: "#020617",
                      border: "1px solid #1f2937",
                      borderRadius: 6,
                    }}
                  >
                    <strong
                      style={{
                        color: "#e5e7eb",
                        fontSize: 13,
                      }}
                    >
                      {service.label}
                    </strong>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        margin: "4px 0 0 0",
                      }}
                    >
                      {service.category === "both"
                        ? "Both"
                        : service.category}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* BLACKLIST TAB */}
      {activeTab === "blacklist" && (
        <div>
          <h3
            style={{ color: "#e5e7eb", marginBottom: 12 }}
          >
            Blacklisted Caregivers ({orgBlacklist.length})
          </h3>
          {orgBlacklist.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" />
              <p className="empty-state-title">
                No blacklisted caregivers
              </p>
              <p className="empty-state-text">
                Caregivers you blacklist will be suspended and
                won&apos;t receive jobs.
              </p>
            </div>
          ) : (
            orgBlacklist.map((blacklisted) => (
              <div
                key={blacklisted.id}
                className="card"
                style={{ marginBottom: 12 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <strong
                      style={{
                        color: "#e5e7eb",
                        fontSize: 16,
                      }}
                    >
                      {blacklisted.caregiverName}
                    </strong>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        marginTop: 4,
                      }}
                    >
                      {blacklisted.caregiverEmail}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                      }}
                    >
                      Blacklisted by{" "}
                      {blacklisted.blacklistedByName}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                      }}
                    >
                      {blacklisted.blacklistedAt
                        ?.toDate?.()
                        ?.toLocaleDateString?.() || "NA"}
                    </div>
                  </div>
                  <div>
                    <span
                      style={{
                        background: "#dc2626",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      BLACKLISTED
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid #1f2937",
                    fontSize: 13,
                    color: "#e5e7eb",
                  }}
                >
                  <p style={{ margin: "0 0 6px 0" }}>
                    <strong>Reason:</strong>{" "}
                    {blacklisted.reason}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "#cbd5f5",
                      fontStyle: "italic",
                      borderLeft: "3px solid #dc2626",
                      paddingLeft: 10,
                    }}
                  >
                    <strong>Description:</strong>{" "}
                    {blacklisted.description}
                  </p>
                </div>

                <button
                  className="btn btn-outline"
                  onClick={() =>
                    handleRemoveFromBlacklist(
                      blacklisted.id,
                      blacklisted.caregiverId
                    )
                  }
                  style={{
                    marginTop: 12,
                    background: "#111827",
                    color: "#e5e7eb",
                    border: "1px solid #1f2937",
                  }}
                >
                  Remove from Blacklist
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <div>
          <div
            className="card"
            style={{ background: "#0b1120" }}
          >
            <h3
              style={{
                color: "#e5e7eb",
                marginTop: 0,
              }}
            >
              Organization Information
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "#e5e7eb",
                margin: "12px 0",
              }}
            >
              <strong>Organization Name:</strong>{" "}
              {organizationData?.organizationName}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#e5e7eb",
                margin: "12px 0",
              }}
            >
              <strong>Admin Name:</strong>{" "}
              {organizationData?.adminName}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#e5e7eb",
                margin: "12px 0",
              }}
            >
              <strong>Email:</strong>{" "}
              {organizationData?.adminEmail}
            </p>
            {organizationData?.businessPhone && (
              <p
                style={{
                  fontSize: 13,
                  color: "#e5e7eb",
                  margin: "12px 0",
                }}
              >
                <strong>Phone:</strong>{" "}
                {organizationData.businessPhone}
              </p>
            )}
            {organizationData?.businessAddress && (
              <p
                style={{
                  fontSize: 13,
                  color: "#e5e7eb",
                  margin: "12px 0",
                }}
              >
                <strong>Address:</strong>{" "}
                {organizationData.businessAddress},{" "}
                {organizationData.businessCity}
              </p>
            )}
            <p
              style={{
                fontSize: 13,
                color: "#e5e7eb",
                margin: "12px 0",
              }}
            >
              <strong>Total Caregivers:</strong>{" "}
              {organizationData?.totalCaregivers || 0}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#e5e7eb",
                margin: "12px 0",
              }}
            >
              <strong>Commission Rate:</strong>{" "}
              {organizationData?.commissionRate ?? 15}%
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#e5e7eb",
                margin: "12px 0",
              }}
            >
              <strong>Status:</strong>{" "}
              {organizationData?.isApproved ? (
                <span style={{ color: "#22c55e" }}>
                  Approved
                </span>
              ) : (
                <span style={{ color: "#fbbf24" }}>
                  Pending Approval
                </span>
              )}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#e5e7eb",
                margin: "12px 0",
              }}
            >
              <strong>Joined:</strong>{" "}
              {organizationData?.createdAt
                ? new Date(
                    organizationData.createdAt
                  ).toLocaleDateString()
                : "NA"}
            </p>
          </div>
        </div>
      )}

      {/* Blacklist modal */}
      {showBlacklistForm && selectedCaregiverToBlacklist && (
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
              maxWidth: 500,
              width: "90%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
              border: "1px solid #1f2937",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 8,
                color: "#fecaca",
              }}
            >
              Blacklist Caregiver
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "#e5e7eb",
                marginBottom: 16,
              }}
            >
              Blacklist{" "}
              <strong>
                {selectedCaregiverToBlacklist.name}
              </strong>
              ?
            </p>
            <div
              style={{
                background: "#fef3c7",
                color: "#92400e",
                padding: 12,
                borderRadius: 8,
                fontSize: 12,
                marginBottom: 16,
                border: "1px solid #fcd34d",
              }}
            >
              <strong>Warning:</strong> This will suspend the
              caregiver and prevent them from receiving new jobs.
              Use only for serious violations.
            </div>
            <form
              onSubmit={handleBlacklistCaregiver}
              className="form"
            >
              <label>Reason</label>
              <select
                value={blacklistReason}
                onChange={(e) =>
                  setBlacklistReason(e.target.value)
                }
                required
              >
                <option value="">Select a reason</option>
                <option value="Unprofessional behavior">
                  Unprofessional behavior
                </option>
                <option value="Poor performance">
                  Poor performance
                </option>
                <option value="Frequent absences">
                  Frequent absences
                </option>
                <option value="Customer complaints">
                  Customer complaints
                </option>
                <option value="Violation of policy">
                  Violation of policy
                </option>
                <option value="Theft or fraud">
                  Theft or fraud
                </option>
                <option value="Safety concerns">
                  Safety concerns
                </option>
                <option value="Other">Other</option>
              </select>

              <label>Description</label>
              <textarea
                value={blacklistDescription}
                onChange={(e) =>
                  setBlacklistDescription(e.target.value)
                }
                required
                placeholder="Provide detailed information about the issue..."
                rows={4}
              />

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <button
                  type="submit"
                  className="btn"
                  disabled={blacklisting}
                  style={{
                    flex: 1,
                    background: "#dc2626",
                    color: "#ffffff",
                    border: "none",
                  }}
                >
                  {blacklisting
                    ? "Blacklisting..."
                    : "Blacklist Caregiver"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowBlacklistForm(false);
                    setSelectedCaregiverToBlacklist(null);
                    setBlacklistReason("");
                    setBlacklistDescription("");
                    setError("");
                  }}
                  style={{
                    flex: 1,
                    background: "#111827",
                    color: "#e5e7eb",
                    border: "1px solid #1f2937",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
