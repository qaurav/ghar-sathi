import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "./firebaseConfig";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("organizations");
  
  // Organizations
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [orgStatusFilter, setOrgStatusFilter] = useState("all");
  const [searchOrg, setSearchOrg] = useState("");

  // Add Organization Form
  const [showAddOrgForm, setShowAddOrgForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgAdminName, setNewOrgAdminName] = useState("");
  const [newOrgEmail, setNewOrgEmail] = useState("");
  const [newOrgPassword, setNewOrgPassword] = useState("");
  const [newOrgPhone, setNewOrgPhone] = useState("");
  const [newOrgAddress, setNewOrgAddress] = useState("");
  const [newOrgCity, setNewOrgCity] = useState("");
  const [newOrgCommission, setNewOrgCommission] = useState(15);
  const [addingOrg, setAddingOrg] = useState(false);

  // Add SuperAdmin Form
  const [showAddSuperAdminForm, setShowAddSuperAdminForm] = useState(false);
  const [newSuperAdminName, setNewSuperAdminName] = useState("");
  const [newSuperAdminEmail, setNewSuperAdminEmail] = useState("");
  const [newSuperAdminPassword, setNewSuperAdminPassword] = useState("");
  const [addingSuperAdmin, setAddingSuperAdmin] = useState(false);

  // Vendors/Caregivers
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [vendorStatusFilter, setVendorStatusFilter] = useState("all");
  const [searchVendor, setSearchVendor] = useState("");

  // Bookings
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("");
  const [bookingDateFilter, setBookingDateFilter] = useState("");

  // Services
  const [services, setServices] = useState([]);
  const [newServiceLabel, setNewServiceLabel] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("caregiver");
  const [editingService, setEditingService] = useState(null);
  const [editServiceLabel, setEditServiceLabel] = useState("");
  const [editServiceCategory, setEditServiceCategory] = useState("caregiver");

  // Blacklist Reports
  const [blacklistReports, setBlacklistReports] = useState([]);
  const [blacklistFilter, setBlacklistFilter] = useState("pending");
  const [blacklist, setBlacklist] = useState([]);

  // Settings
  const [globalCommissionRate, setGlobalCommissionRate] = useState(15);
  const [editingCommission, setEditingCommission] = useState(false);

  // SuperAdmins list
  const [superAdmins, setSuperAdmins] = useState([]);

  // Analytics
  const [analytics, setAnalytics] = useState({
    totalOrganizations: 0,
    approvedOrganizations: 0,
    totalCaregivers: 0,
    approvedCaregivers: 0,
    totalBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    platformEarnings: 0,
  });

  const [error, setError] = useState("");

  // Load all data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      // Load Organizations
      setLoadingOrganizations(true);
      const orgSnap = await getDocs(collection(db, "organizations"));
      const orgsData = orgSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrganizations(orgsData);
      setLoadingOrganizations(false);

      // Load Vendors/Caregivers
      setLoadingVendors(true);
      const vendorSnap = await getDocs(collection(db, "vendors"));
      const vendorsData = vendorSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setVendors(vendorsData);
      setLoadingVendors(false);

      // Load Bookings
      setLoadingBookings(true);
      const bookingSnap = await getDocs(collection(db, "bookings"));
      const bookingsData = bookingSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBookings(bookingsData);
      setLoadingBookings(false);

      // Load Services
      const servicesSnap = await getDocs(collection(db, "services"));
      const servicesData = servicesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setServices(servicesData);

      // Load Blacklist Reports
      const reportsSnap = await getDocs(collection(db, "blacklistReports"));
      setBlacklistReports(reportsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Load Blacklist
      const blacklistSnap = await getDocs(collection(db, "blacklist"));
      setBlacklist(blacklistSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Load SuperAdmins
      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const superAdminsList = allUsers.filter((u) => u.role === "superadmin");
      setSuperAdmins(superAdminsList);

      // Load global commission
      const settingsSnap = await getDoc(doc(db, "settings", "commission"));
      if (settingsSnap.exists()) {
        setGlobalCommissionRate(settingsSnap.data().rate || 15);
      }

      // Calculate Analytics
      const totalRevenue = bookingsData
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const platformEarnings = bookingsData
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + (b.platformCommission || 0), 0);

      setAnalytics({
        totalOrganizations: orgsData.length,
        approvedOrganizations: orgsData.filter((o) => o.isApproved).length,
        totalCaregivers: vendorsData.length,
        approvedCaregivers: vendorsData.filter((v) => v.isApproved).length,
        totalBookings: bookingsData.length,
        completedBookings: bookingsData.filter((b) => b.status === "completed").length,
        totalRevenue,
        platformEarnings,
      });
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  // Handle create organization
  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    setError("");
    setAddingOrg(true);

    try {
      const orgCred = await createUserWithEmailAndPassword(
        auth,
        newOrgEmail,
        newOrgPassword
      );

      const orgUid = orgCred.user.uid;

      const userData = {
        uid: orgUid,
        name: newOrgAdminName,
        email: newOrgEmail,
        role: "org_admin",
        organizationName: newOrgName,
        organizationId: orgUid,
        businessPhone: newOrgPhone,
        businessAddress: newOrgAddress,
        businessCity: newOrgCity,
        createdAt: new Date().toISOString(),
        isApproved: true,
        isSuspended: false,
        profileComplete: true,
        createdBy: "superadmin",
      };

      await setDoc(doc(db, "users", orgUid), userData);

      const orgData = {
        organizationId: orgUid,
        organizationName: newOrgName,
        adminUid: orgUid,
        adminName: newOrgAdminName,
        adminEmail: newOrgEmail,
        businessPhone: newOrgPhone,
        businessAddress: newOrgAddress,
        businessCity: newOrgCity,
        caregivers: [],
        totalCaregivers: 0,
        totalEarnings: 0,
        totalBookings: 0,
        commissionRate: Number(newOrgCommission),
        isApproved: true,
        verified: true,
        createdAt: new Date().toISOString(),
        createdBy: "superadmin",
      };

      await setDoc(doc(db, "organizations", orgUid), orgData);

      alert("Organization created successfully!");
      
      setNewOrgName("");
      setNewOrgAdminName("");
      setNewOrgEmail("");
      setNewOrgPassword("");
      setNewOrgPhone("");
      setNewOrgAddress("");
      setNewOrgCity("");
      setNewOrgCommission(15);
      setShowAddOrgForm(false);

      loadAllData();
    } catch (err) {
      console.error("Error creating organization:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered");
      } else {
        setError(err.message || "Could not create organization");
      }
    } finally {
      setAddingOrg(false);
    }
  };

  // Handle create superadmin
  const handleCreateSuperAdmin = async (e) => {
    e.preventDefault();
    setError("");
    setAddingSuperAdmin(true);

    try {
      const superAdminCred = await createUserWithEmailAndPassword(
        auth,
        newSuperAdminEmail,
        newSuperAdminPassword
      );

      const superAdminUid = superAdminCred.user.uid;

      const userData = {
        uid: superAdminUid,
        name: newSuperAdminName,
        email: newSuperAdminEmail,
        role: "superadmin",
        createdAt: new Date().toISOString(),
        isApproved: true,
        isSuspended: false,
        profileComplete: true,
        createdBy: "superadmin",
      };

      await setDoc(doc(db, "users", superAdminUid), userData);

      alert("SuperAdmin created successfully!");
      
      setNewSuperAdminName("");
      setNewSuperAdminEmail("");
      setNewSuperAdminPassword("");
      setShowAddSuperAdminForm(false);

      loadAllData();
    } catch (err) {
      console.error("Error creating superadmin:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered");
      } else {
        setError(err.message || "Could not create superadmin");
      }
    } finally {
      setAddingSuperAdmin(false);
    }
  };

  // Handle approve organization
  const handleApproveOrganization = async (orgId) => {
    try {
      await updateDoc(doc(db, "organizations", orgId), {
        isApproved: true,
        approvedAt: serverTimestamp(),
        approvedBy: "superadmin",
      });
      
      await updateDoc(doc(db, "users", orgId), {
        isApproved: true,
      });

      alert("Organization approved successfully!");
      loadAllData();
    } catch (err) {
      console.error("Error approving organization:", err);
      alert("Could not approve organization");
    }
  };

  // Handle reject organization
  const handleRejectOrganization = async (orgId) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      await updateDoc(doc(db, "organizations", orgId), {
        isApproved: false,
        rejectionReason: reason,
        rejectedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", orgId), {
        isApproved: false,
      });

      alert("Organization rejected");
      loadAllData();
    } catch (err) {
      console.error("Error rejecting organization:", err);
      alert("Could not reject organization");
    }
  };

  // Handle suspend organization
  const handleSuspendOrganization = async (orgId, isSuspended) => {
    try {
      await updateDoc(doc(db, "organizations", orgId), {
        isSuspended: !isSuspended,
        suspendedAt: !isSuspended ? serverTimestamp() : null,
      });

      await updateDoc(doc(db, "users", orgId), {
        isSuspended: !isSuspended,
      });

      alert(`Organization ${!isSuspended ? "suspended" : "unsuspended"}`);
      loadAllData();
    } catch (err) {
      console.error("Error updating organization:", err);
      alert("Could not update organization");
    }
  };

  // Handle approve caregiver
  const handleApproveCaregiver = async (caregiverId) => {
    try {
      await updateDoc(doc(db, "vendors", caregiverId), {
        isApproved: true,
        approvedAt: serverTimestamp(),
        approvedBy: "superadmin",
      });

      await updateDoc(doc(db, "users", caregiverId), {
        isApproved: true,
      });

      alert("Caregiver approved!");
      loadAllData();
    } catch (err) {
      console.error("Error approving caregiver:", err);
      alert("Could not approve caregiver");
    }
  };

  // Handle reject caregiver
  const handleRejectCaregiver = async (caregiverId) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      await updateDoc(doc(db, "vendors", caregiverId), {
        isApproved: false,
        rejectionReason: reason,
        rejectedAt: serverTimestamp(),
      });

      alert("Caregiver rejected");
      loadAllData();
    } catch (err) {
            console.error("Error rejecting caregiver:", err);
      alert("Could not reject caregiver");
    }
  };

  // Handle suspend caregiver
  const handleSuspendCaregiver = async (caregiverId, isSuspended) => {
    try {
      await updateDoc(doc(db, "vendors", caregiverId), {
        isSuspended: !isSuspended,
        suspendedAt: !isSuspended ? serverTimestamp() : null,
      });

      await updateDoc(doc(db, "users", caregiverId), {
        isSuspended: !isSuspended,
      });

      alert(`Caregiver ${!isSuspended ? "suspended" : "unsuspended"}`);
      loadAllData();
    } catch (err) {
      console.error("Error suspending caregiver:", err);
      alert("Could not update caregiver");
    }
  };

  // Handle add service
  const handleAddService = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!newServiceLabel.trim()) {
      setError("Please enter a service name");
      return;
    }

    try {
      const id = newServiceLabel.trim().toLowerCase().replace(/\s+/g, "_");
      await setDoc(doc(db, "services", id), {
        label: newServiceLabel.trim(),
        category: newServiceCategory,
        createdAt: serverTimestamp(),
        createdBy: "superadmin",
      });

      setNewServiceLabel("");
      setNewServiceCategory("caregiver");
      alert("Service added!");
      loadAllData();
    } catch (err) {
      console.error("Error adding service:", err);
      setError("Could not add service");
    }
  };

  // Handle edit service
  const startEditService = (service) => {
    setEditingService(service);
    setEditServiceLabel(service.label);
    setEditServiceCategory(service.category);
  };

  const handleUpdateService = async () => {
    if (!editServiceLabel.trim()) {
      setError("Service name cannot be empty");
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
      loadAllData();
    } catch (err) {
      console.error("Error updating service:", err);
      setError("Could not update service");
    }
  };

  // Handle delete service
  const handleDeleteService = async (serviceId, label) => {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, "services", serviceId));
      alert("Service deleted");
      loadAllData();
    } catch (err) {
      console.error("Error deleting service:", err);
      alert("Could not delete service");
    }
  };

  // Handle blacklist user
  const handleBlacklistUser = async (reportId, userId) => {
    try {
      const report = blacklistReports.find((r) => r.id === reportId);
      if (!report) return;

      await setDoc(doc(db, "blacklist", userId), {
        userName: report.userName,
        userId: userId,
        reason: report.reason,
        description: report.description,
        reportedBy: report.reportedBy,
        reportedByName: report.reportedByName,
        blacklistedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "blacklistReports", reportId), {
        status: "blacklisted",
      });

      alert("User blacklisted successfully!");
      loadAllData();
    } catch (err) {
      console.error("Error blacklisting user:", err);
      alert("Could not blacklist user");
    }
  };

  // Handle reject report
  const handleRejectReport = async (reportId) => {
    try {
      await updateDoc(doc(db, "blacklistReports", reportId), {
        status: "rejected",
      });

      alert("Report rejected");
      loadAllData();
    } catch (err) {
      console.error("Error rejecting report:", err);
      alert("Could not reject report");
    }
  };

  // Handle remove from blacklist
  const handleRemoveFromBlacklist = async (userId) => {
    if (!window.confirm("Remove this user from blacklist?")) return;

    try {
      await deleteDoc(doc(db, "blacklist", userId));
      alert("User removed from blacklist");
      loadAllData();
    } catch (err) {
      console.error("Error removing from blacklist:", err);
      alert("Could not remove from blacklist");
    }
  };

  // Get tab style
  const getTabStyle = (tabName) => ({
    padding: "8px 16px",
    borderRadius: "6px",
    border: activeTab === tabName ? "none" : "1px solid #1f2937",
    background:
      activeTab === tabName
        ? "linear-gradient(135deg, #0ea5e9, #06b6d4)"
        : "#020617",
    color: activeTab === tabName ? "white" : "#e5e7eb",
    cursor: "pointer",
    fontWeight: activeTab === tabName ? "600" : "500",
    fontSize: 13,
    transition: "all 0.2s ease",
  });

  // Filter organizations
  const filteredOrganizations = organizations.filter((org) => {
    const matchSearch =
      org.organizationName?.toLowerCase().includes(searchOrg.toLowerCase()) ||
      org.adminName?.toLowerCase().includes(searchOrg.toLowerCase()) ||
      org.adminEmail?.toLowerCase().includes(searchOrg.toLowerCase());

    const matchStatus =
      orgStatusFilter === "all" ? true :
      orgStatusFilter === "pending" ? !org.isApproved :
      orgStatusFilter === "approved" ? org.isApproved && !org.isSuspended :
      orgStatusFilter === "suspended" ? org.isSuspended : true;

    return matchSearch && matchStatus;
  });

  // Filter vendors
  const filteredVendors = vendors.filter((vendor) => {
    const matchSearch =
      vendor.name?.toLowerCase().includes(searchVendor.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchVendor.toLowerCase()) ||
      vendor.organizationName?.toLowerCase().includes(searchVendor.toLowerCase());

    const matchStatus =
      vendorStatusFilter === "all" ? true :
      vendorStatusFilter === "pending" ? !vendor.isApproved :
      vendorStatusFilter === "approved" ? vendor.isApproved && !vendor.isSuspended :
      vendorStatusFilter === "suspended" ? vendor.isSuspended : true;

    return matchSearch && matchStatus;
  });

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchStatus = !bookingStatusFilter || b.status === bookingStatusFilter;
    const matchDate = !bookingDateFilter || b.date === bookingDateFilter;
    return matchStatus && matchDate;
  });

  // Filter reports
  const filteredReports = blacklistReports.filter(
    (r) => r.status === blacklistFilter
  );

  // Get global services (not org-specific)
  const globalServices = services.filter((s) => !s.organizationId);
  const orgSpecificServices = services.filter((s) => s.organizationId);

  return (
    <div>
      <h1 style={{ color: "#e5e7eb", marginBottom: 8 }}>SuperAdmin Dashboard</h1>
      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
        Ghar Sathi Platform Management - Full control over all platform activities
      </p>

      {/* Analytics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div className="card" style={{ background: "#0b1120", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Total Organizations</p>
          <p style={{ fontSize: 24, color: "#0ea5e9", fontWeight: "bold", margin: 0 }}>
            {analytics.totalOrganizations}
          </p>
          <p style={{ fontSize: 10, color: "#6b7280", margin: 0 }}>
            {analytics.approvedOrganizations} approved
          </p>
        </div>
        <div className="card" style={{ background: "#0b1120", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Total Caregivers</p>
          <p style={{ fontSize: 24, color: "#10b981", fontWeight: "bold", margin: 0 }}>
            {analytics.totalCaregivers}
          </p>
          <p style={{ fontSize: 10, color: "#6b7280", margin: 0 }}>
            {analytics.approvedCaregivers} approved
          </p>
        </div>
        <div className="card" style={{ background: "#0b1120", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Total Bookings</p>
          <p style={{ fontSize: 24, color: "#fbbf24", fontWeight: "bold", margin: 0 }}>
            {analytics.totalBookings}
          </p>
          <p style={{ fontSize: 10, color: "#6b7280", margin: 0 }}>
            {analytics.completedBookings} completed
          </p>
        </div>
        <div className="card" style={{ background: "#0b1120", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Total Revenue</p>
          <p style={{ fontSize: 24, color: "#22c55e", fontWeight: "bold", margin: 0 }}>
            ₹{analytics.totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="card" style={{ background: "#0b1120", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Platform Earnings</p>
          <p style={{ fontSize: 24, color: "#0ea5e9", fontWeight: "bold", margin: 0 }}>
            ₹{Math.round(analytics.platformEarnings).toLocaleString()}
          </p>
          <p style={{ fontSize: 10, color: "#6b7280", margin: 0 }}>
            {globalCommissionRate}% commission
          </p>
        </div>
        <div className="card" style={{ background: "#0b1120", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>SuperAdmins</p>
          <p style={{ fontSize: 24, color: "#6366f1", fontWeight: "bold", margin: 0 }}>
            {superAdmins.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="choice-buttons" style={{ marginBottom: 24, flexWrap: "wrap" }}>
        <button
          type="button"
          style={getTabStyle("organizations")}
          onClick={() => setActiveTab("organizations")}
        >
          🏢 Organizations ({filteredOrganizations.length})
        </button>
        <button
          type="button"
          style={getTabStyle("caregivers")}
          onClick={() => setActiveTab("caregivers")}
        >
          👥 Caregivers ({filteredVendors.length})
        </button>
        <button
          type="button"
          style={getTabStyle("bookings")}
          onClick={() => setActiveTab("bookings")}
        >
          📅 Bookings ({filteredBookings.length})
        </button>
        <button
          type="button"
          style={getTabStyle("services")}
          onClick={() => setActiveTab("services")}
        >
          🛠️ Services ({globalServices.length})
        </button>
        <button
          type="button"
          style={getTabStyle("reports")}
          onClick={() => setActiveTab("reports")}
        >
          🚫 Reports ({filteredReports.length})
        </button>
        <button
          type="button"
          style={getTabStyle("settings")}
          onClick={() => setActiveTab("settings")}
        >
          ⚙️ Settings
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* ORGANIZATIONS TAB */}
      {activeTab === "organizations" && (
        <div>
          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowAddOrgForm(!showAddOrgForm);
                setShowAddSuperAdminForm(false);
              }}
            >
              {showAddOrgForm ? "Cancel" : "+ Create Organization"}
            </button>
            <button
              className="btn"
              onClick={() => {
                setShowAddSuperAdminForm(!showAddSuperAdminForm);
                setShowAddOrgForm(false);
              }}
              style={{
                background: "#6366f1",
                color: "white",
                border: "none",
              }}
            >
              {showAddSuperAdminForm ? "Cancel" : "+ Add SuperAdmin"}
            </button>
          </div>

          {/* Add Organization Form */}
          {showAddOrgForm && (
            <div className="card" style={{ marginBottom: 16, background: "#0b1120" }}>
              <h3 style={{ color: "#e5e7eb", marginTop: 0 }}>Create New Organization</h3>
              
              <form onSubmit={handleCreateOrganization} className="form">
                <label>Organization Name *</label>
                <input
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  required
                  placeholder="e.g., ABC Care Services Pvt. Ltd."
                />

                <label>Admin Name *</label>
                <input
                  value={newOrgAdminName}
                  onChange={(e) => setNewOrgAdminName(e.target.value)}
                  required
                  placeholder="Organization admin's name"
                />

                <label>Admin Email *</label>
                <input
                  type="email"
                  value={newOrgEmail}
                  onChange={(e) => setNewOrgEmail(e.target.value)}
                  required
                  placeholder="admin@organization.com"
                />

                <label>Admin Password *</label>
                <input
                                    type="password"
                  value={newOrgPassword}
                  onChange={(e) => setNewOrgPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                />

                <label>Business Phone</label>
                <input
                  type="tel"
                  value={newOrgPhone}
                  onChange={(e) => setNewOrgPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                />

                <label>Business Address</label>
                <input
                  value={newOrgAddress}
                  onChange={(e) => setNewOrgAddress(e.target.value)}
                  placeholder="Office address"
                />

                <label>City</label>
                <select
                  value={newOrgCity}
                  onChange={(e) => setNewOrgCity(e.target.value)}
                >
                  <option value="">Select city</option>
                  <option value="Kathmandu">Kathmandu</option>
                  <option value="Lalitpur">Lalitpur</option>
                  <option value="Bhaktapur">Bhaktapur</option>
                  <option value="Pokhara">Pokhara</option>
                  <option value="Other">Other</option>
                </select>

                <label>Commission Rate (%)</label>
                <input
                  type="number"
                  value={newOrgCommission}
                  onChange={(e) => setNewOrgCommission(e.target.value)}
                  min="0"
                  max="100"
                  placeholder="15"
                />
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: -8 }}>
                  Platform takes this percentage from each booking
                </p>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addingOrg}
                  style={{ marginTop: 16 }}
                >
                  {addingOrg ? "Creating Organization..." : "Create Organization"}
                </button>
              </form>
            </div>
          )}

          {/* Add SuperAdmin Form */}
          {showAddSuperAdminForm && (
            <div className="card" style={{ marginBottom: 16, background: "#0b1120", border: "2px solid #6366f1" }}>
              <h3 style={{ color: "#e5e7eb", marginTop: 0 }}>Add New SuperAdmin</h3>
              
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
                <strong>⚠️ Warning:</strong> SuperAdmins have full access to the platform. Only add trusted team members.
              </div>

              <form onSubmit={handleCreateSuperAdmin} className="form">
                <label>Full Name *</label>
                <input
                  value={newSuperAdminName}
                  onChange={(e) => setNewSuperAdminName(e.target.value)}
                  required
                  placeholder="SuperAdmin's full name"
                />

                <label>Email *</label>
                <input
                  type="email"
                  value={newSuperAdminEmail}
                  onChange={(e) => setNewSuperAdminEmail(e.target.value)}
                  required
                  placeholder="superadmin@gharsathi.com"
                />

                <label>Password *</label>
                <input
                  type="password"
                  value={newSuperAdminPassword}
                  onChange={(e) => setNewSuperAdminPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                />

                <button
                  type="submit"
                  className="btn"
                  disabled={addingSuperAdmin}
                  style={{
                    marginTop: 16,
                    background: "#6366f1",
                    color: "white",
                    border: "none",
                  }}
                >
                  {addingSuperAdmin ? "Creating SuperAdmin..." : "Create SuperAdmin"}
                </button>
              </form>

              {/* Current SuperAdmins List */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #1f2937" }}>
                <h4 style={{ color: "#e5e7eb", fontSize: 14, marginBottom: 12 }}>
                  Current SuperAdmins ({superAdmins.length})
                </h4>
                {superAdmins.map((sa) => (
                  <div
                    key={sa.id}
                    style={{
                      padding: "8px 12px",
                      background: "#020617",
                      borderRadius: 6,
                      marginBottom: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 13, color: "#e5e7eb" }}>
                        <strong>{sa.name}</strong>
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
                        {sa.email}
                      </p>
                    </div>
                    <span
                      style={{
                        background: "#6366f1",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      🔐 SuperAdmin
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="row" style={{ marginBottom: 16 }}>
            <div className="col">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchOrg}
                onChange={(e) => setSearchOrg(e.target.value)}
              />
            </div>
            <div className="col">
              <label>Status</label>
              <select
                value={orgStatusFilter}
                onChange={(e) => setOrgStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {loadingOrganizations ? (
            <p style={{ color: "#9ca3af" }}>Loading organizations...</p>
          ) : filteredOrganizations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏢</div>
              <p className="empty-state-title">No organizations found</p>
              <p className="empty-state-text">
                {organizations.length === 0 
                  ? "Create your first organization to get started"
                  : "No organizations match your filters"}
              </p>
            </div>
          ) : (
            <div>
              {filteredOrganizations.map((org) => (
                <div key={org.id} className="card" style={{ marginBottom: 12 }}>
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
                      <strong style={{ color: "#e5e7eb", fontSize: 18 }}>
                        {org.organizationName}
                      </strong>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                        👤 Admin: {org.adminName}
                      </div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        📧 {org.adminEmail}
                      </div>
                      {org.businessPhone && (
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>
                          📞 {org.businessPhone}
                        </div>
                      )}
                      {org.businessAddress && (
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>
                          📍 {org.businessAddress}, {org.businessCity}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        📅 Joined: {new Date(org.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexDirection: "column", alignItems: "flex-end" }}>
                      {org.isApproved ? (
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#15803d",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: 11,
                            fontWeight: "600",
                          }}
                        >
                          ✓ Approved
                        </span>
                      ) : (
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
                          ⏳ Pending
                        </span>
                      )}
                      {org.isSuspended && (
                        <span
                          style={{
                            background: "#dc2626",
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: 11,
                            fontWeight: "600",
                          }}
                        >
                          🚫 Suspended
                        </span>
                      )}
                      {org.createdBy === "superadmin" && (
                        <span
                          style={{
                            background: "#6366f1",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: 11,
                            fontWeight: "600",
                          }}
                        >
                          Created by Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Organization Stats */}
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: "1px solid #1f2937",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: 12,
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Total Caregivers</p>
                      <p style={{ fontSize: 16, color: "#0ea5e9", fontWeight: "bold", margin: 0 }}>
                        {org.totalCaregivers || 0}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Total Bookings</p>
                      <p style={{ fontSize: 16, color: "#10b981", fontWeight: "bold", margin: 0 }}>
                        {org.totalBookings || 0}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Total Earnings</p>
                      <p style={{ fontSize: 16, color: "#22c55e", fontWeight: "bold", margin: 0 }}>
                        ₹{org.totalEarnings || 0}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Commission Rate</p>
                      <p style={{ fontSize: 16, color: "#fbbf24", fontWeight: "bold", margin: 0 }}>
                        {org.commissionRate || 15}%
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    {!org.isApproved && (
                      <>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleApproveOrganization(org.id)}
                          style={{ flex: 1 }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => handleRejectOrganization(org.id)}
                          style={{
                            flex: 1,
                            background: "#7f1d1d",
                            color: "#fecaca",
                            border: "1px solid #991b1b",
                          }}
                        >
                          ✗ Reject
                        </button>
                      </>
                    )}

                    <button
                      className="btn btn-outline"
                      onClick={() => handleSuspendOrganization(org.id, org.isSuspended)}
                      style={{
                        flex: 1,
                        background: org.isSuspended ? "#111827" : "#7f1d1d",
                        color: org.isSuspended ? "#e5e7eb" : "#fecaca",
                        border: `1px solid ${org.isSuspended ? "#1f2937" : "#991b1b"}`,
                      }}
                    >
                      {org.isSuspended ? "Unsuspend" : "Suspend"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CAREGIVERS TAB */}
      {activeTab === "caregivers" && (
        <div>
          <div
            style={{
              background: "#dbeafe",
              color: "#0369a1",
              padding: 12,
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
              border: "1px solid #7dd3fc",
            }}
          >
            ℹ️ Caregivers are approved by their respective organizations. You can view all caregivers here.
          </div>

          {/* Filters */}
          <div className="row" style={{ marginBottom: 16 }}>
            <div className="col">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search caregivers..."
                value={searchVendor}
                onChange={(e) => setSearchVendor(e.target.value)}
              />
            </div>
            <div className="col">
              <label>Status</label>
              <select
                value={vendorStatusFilter}
                onChange={(e) => setVendorStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {loadingVendors ? (
            <p style={{ color: "#9ca3af" }}>Loading caregivers...</p>
          ) : filteredVendors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <p className="empty-state-title">No caregivers found</p>
            </div>
          ) : (
            <div>
              {filteredVendors.map((vendor) => (
                <div key={vendor.id} className="card" style={{ marginBottom: 12 }}>
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
                      <strong style={{ color: "#e5e7eb", fontSize: 16 }}>
                        {vendor.name}
                      </strong>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                        📧 {vendor.email}
                      </div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        📍 {vendor.location}
                      </div>
                      {vendor.organizationName && (
                        <div style={{ fontSize: 12, color: "#0ea5e9", marginTop: 4 }}>
                          🏢 {vendor.organizationName}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        💰 ₹{vendor.hourlyRate}/hour
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexDirection: "column", alignItems: "flex-end" }}>
                      {vendor.isApproved ? (
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#15803d",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: 11,
                            fontWeight: "600",
                          }}
                        >
                          ✓ Approved
                        </span>
                      ) : (
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
                          ⏳ Pending (Org Approval)
                        </span>
                      )}
                      {vendor.isSuspended && (
                        <span
                          style={{
                            background: "#dc2626",
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: 11,
                            fontWeight: "600",
                          }}
                        >
                          🚫 Suspended
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Caregiver Details */}
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
                      <strong>Category:</strong> {vendor.category === "caregiver" ? "Care Giver" : vendor.category === "household" ? "Household" : "Both"}
                    </p>
                    <p style={{ margin: "0 0 6px 0" }}>
                      <strong>Work Type:</strong> {vendor.workType === "full_time" ? "Full Time" : "Part Time"}
                    </p>
                    <p style={{ margin: "0 0 6px 0" }}>
                      <strong>Services:</strong> {(vendor.servicesOffered || []).join(", ") || "None"}
                    </p>
                    <p style={{ margin: "0 0 6px 0" }}>
                      <strong>Experience:</strong> {vendor.experience || 0} years
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Jobs Completed:</strong> {vendor.jobsCompleted || 0}
                    </p>
                  </div>

                  {/* View Only - No Actions */}
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      background: "#020617",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "#9ca3af",
                    }}
                  >
                    💡 This caregiver is managed by <strong style={{ color: "#0ea5e9" }}>{vendor.organizationName || "their organization"}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* BOOKINGS TAB */}
      {activeTab === "bookings" && (
        <div>
          {/* Filters */}
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
                <option value="accepted">Accepted</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {loadingBookings ? (
            <p style={{ color: "#9ca3af" }}>Loading bookings...</p>
          ) : filteredBookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <p className="empty-state-title">No bookings found</p>
              <p className="empty-state-text">
                {bookings.length === 0 
                  ? "No bookings in the system yet"
                  : "No bookings match your filters"}
              </p>
            </div>
          ) : (
            <div>
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="card" style={{ marginBottom: 12 }}>
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
                      <strong style={{ color: "#e5e7eb", fontSize: 16 }}>
                        {booking.userName} → {booking.caregiverName}
                      </strong>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                        📞 {booking.userPhone}
                      </div>
                      {booking.organizationName && (
                        <div style={{ fontSize: 12, color: "#0ea5e9" }}>
                          🏢 {booking.organizationName}
                        </div>
                      )}
                    </div>

                    <span
                      style={{
                        background:
                          booking.status === "completed" ? "#dcfce7" :
                          booking.status === "accepted" ? "#dbeafe" :
                          booking.status === "pending" ? "#fef3c7" : "#fee2e2",
                        color:
                          booking.status === "completed" ? "#15803d" :
                          booking.status === "accepted" ? "#0369a1" :
                          booking.status === "pending" ? "#92400e" : "#991b1b",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      {(booking.status || "pending").toUpperCase()}
                    </span>
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
                      <strong>📅 Date:</strong> {booking.date}
                    </p>
                    <p style={{ margin: "0 0 6px 0" }}>
                      <strong>⏰ Time:</strong> {booking.time}
                    </p>
                    <p style={{ margin: "0 0 6px 0" }}>
                      <strong>💰 Total:</strong> ₹{booking.totalAmount}
                    </p>
                    <p style={{ margin: "0 0 6px 0" }}>
                      <strong>Platform Fee:</strong> ₹{Math.round(booking.platformCommission || 0)}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Payment:</strong> {booking.paymentMethod === "fonepay" ? "💳 Fonepay" : "💵 Cash"} - {booking.paymentStatus || "pending"}
                    </p>
                  </div>

                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 10 }}>
                    ID: {booking.id.substring(0, 12)}... · Created: {booking.createdAt?.toDate?.().toLocaleDateString?.() || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SERVICES TAB */}
      {activeTab === "services" && (
        <div>
          <div
            style={{
              background: "#dbeafe",
              color: "#0369a1",
              padding: 12,
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
              border: "1px solid #7dd3fc",
            }}
          >
            ℹ️ Services are managed by individual organizations. You can view all services here.
          </div>

          {/* Global Services (View Only) */}
          <h4 style={{ color: "#e5e7eb", marginBottom: 12 }}>
            All Services in Platform ({services.length})
          </h4>

          {services.length === 0 ? (
            <div className="empty-state">
              <p style={{ color: "#9ca3af" }}>No services yet</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 12,
              }}
            >
              {services.map((service) => (
                <div key={service.id} className="card">
                  <strong style={{ color: "#e5e7eb" }}>{service.label}</strong>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0 0" }}>
                    Category: {service.category === "both" ? "Both" : service.category === "caregiver" ? "Care Giver" : "Household"}
                  </p>
                  {service.organizationName && (
                    <p style={{ fontSize: 11, color: "#0ea5e9", margin: "4px 0 0 0" }}>
                      🏢 {service.organizationName}
                    </p>
                  )}
                  <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0 0" }}>
                    ID: {service.id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <div>
          {/* Filter */}
          <div style={{ marginBottom: 16 }}>
            <label>Report Status</label>
            <select
              value={blacklistFilter}
              onChange={(e) => setBlacklistFilter(e.target.value)}
              style={{ maxWidth: 200 }}
            >
              <option value="pending">Pending</option>
              <option value="blacklisted">Blacklisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <h4 style={{ color: "#e5e7eb", marginBottom: 12 }}>
            User Reports ({filteredReports.length})
          </h4>

          {filteredReports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚫</div>
              <p className="empty-state-title">No reports found</p>
              <p className="empty-state-text">
                {blacklistReports.length === 0 
                  ? "No user reports submitted yet"
                  : "No reports match this filter"}
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: 40 }}>
              {filteredReports.map((report) => (
                <div key={report.id} className="card" style={{ marginBottom: 12 }}>
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
                      <strong style={{ color: "#e5e7eb", fontSize: 16 }}>
                        Report: {report.userName}
                      </strong>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                        📝 Reason: {report.reason}
                      </div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        👤 Reported by: {report.reportedByName}
                      </div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        📅 {report.createdAt?.toDate?.().toLocaleString?.() || "N/A"}
                      </div>
                    </div>

                    <span
                      style={{
                        background:
                          report.status === "pending" ? "#fef3c7" :
                          report.status === "blacklisted" ? "#dcfce7" : "#fee2e2",
                        color:
                          report.status === "pending" ? "#92400e" :
                          report.status === "blacklisted" ? "#15803d" : "#991b1b",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      {report.status?.toUpperCase()}
                    </span>
                  </div>

                  {report.description && (
                    <p
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: "1px solid #1f2937",
                        fontSize: 13,
                        color: "#cbd5f5",
                        fontStyle: "italic",
                        borderLeft: "3px solid #fbbf24",
                        paddingLeft: 10,
                      }}
                    >
                      <strong>Description:</strong> {report.description}
                    </p>
                  )}

                  {report.status === "pending" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleBlacklistUser(report.id, report.userId)}
                        style={{ flex: 1 }}
                      >
                        🚫 Blacklist User
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleRejectReport(report.id)}
                        style={{
                          flex: 1,
                          background: "#111827",
                          color: "#e5e7eb",
                          border: "1px solid #1f2937",
                        }}
                      >
                        Reject Report
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Blacklisted Users */}
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "2px solid #1f2937" }}>
            <h4 style={{ color: "#e5e7eb", marginBottom: 12 }}>
              Blacklisted Users ({blacklist.length})
            </h4>

            {blacklist.length === 0 ? (
              <div className="empty-state">
                <p style={{ color: "#9ca3af" }}>No blacklisted users</p>
              </div>
            ) : (
              <div>
                {blacklist.map((user) => (
                  <div key={user.id} className="card" style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <strong style={{ color: "#e5e7eb" }}>{user.userName}</strong>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                          User ID: {user.userId || user.id}
                        </div>
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>
                          Reason: {user.reason}
                        </div>
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>
                          Reported by: {user.reportedByName}
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                          Blacklisted: {user.blacklistedAt?.toDate?.().toLocaleString?.() || "N/A"}
                        </div>
                      </div>

                      <span
                        style={{
                          background: "#dc2626",
                          color: "#fff",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        BLACKLISTED
                      </span>
                    </div>

                    {user.description && (
                      <p
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: "1px solid #1f2937",
                          fontSize: 13,
                          color: "#cbd5f5",
                        }}
                      >
                        <strong>Description:</strong> {user.description}
                      </p>
                    )}

                    <button
                      className="btn btn-outline"
                      onClick={() => handleRemoveFromBlacklist(user.id)}
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
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "settings" && (
        <div>
          <div className="card" style={{ background: "#0b1120" }}>
            <h3 style={{ color: "#e5e7eb", marginTop: 0 }}>Platform Settings</h3>

            {/* Commission Rate */}
            <div style={{ marginBottom: 24 }}>
              <label>Global Commission Rate (%)</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <input
                  type="number"
                  value={globalCommissionRate}
                  onChange={(e) => setGlobalCommissionRate(Number(e.target.value))}
                  disabled={!editingCommission}
                  min="0"
                  max="100"
                  style={{
                    width: 100,
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #1f2937",
                    background: editingCommission ? "#111827" : "#020617",
                    color: "#e5e7eb",
                  }}
                />
                <span style={{ fontSize: 13, color: "#9ca3af" }}>%</span>
                {editingCommission ? (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        try {
                          await setDoc(doc(db, "settings", "commission"), {
                            rate: globalCommissionRate,
                            updatedAt: serverTimestamp(),
                          });
                          alert("Commission rate updated!");
                          setEditingCommission(false);
                        } catch (err) {
                          console.error("Error updating commission:", err);
                          alert("Could not update commission");
                        }
                      }}
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setGlobalCommissionRate(15);
                        setEditingCommission(false);
                      }}
                      type="button"
                      style={{
                        background: "#111827",
                        color: "#e5e7eb",
                        border: "1px solid #1f2937",
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-outline"
                    onClick={() => setEditingCommission(true)}
                    type="button"
                    style={{
                      background: "#111827",
                      color: "#e5e7eb",
                      border: "1px solid #1f2937",
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
                This commission applies to all new bookings. Current: {globalCommissionRate}%
              </p>
            </div>

            {/* Platform Info */}
            <div
              style={{
                padding: 16,
                background: "#020617",
                borderRadius: 8,
                border: "1px solid #1f2937",
              }}
            >
              <h4 style={{ color: "#e5e7eb", marginTop: 0, marginBottom: 12 }}>
                                Platform Information
              </h4>
              <p style={{ fontSize: 13, color: "#e5e7eb", margin: "8px 0" }}>
                <strong>Platform Name:</strong> Ghar Sathi
              </p>
              <p style={{ fontSize: 13, color: "#e5e7eb", margin: "8px 0" }}>
                <strong>Version:</strong> 1.0.0 Multi-Vendor
              </p>
              <p style={{ fontSize: 13, color: "#e5e7eb", margin: "8px 0" }}>
                <strong>Total Organizations:</strong> {organizations.length}
              </p>
              <p style={{ fontSize: 13, color: "#e5e7eb", margin: "8px 0" }}>
                <strong>Total Caregivers:</strong> {vendors.length}
              </p>
              <p style={{ fontSize: 13, color: "#e5e7eb", margin: "8px 0" }}>
                <strong>Total Bookings:</strong> {bookings.length}
              </p>
              <p style={{ fontSize: 13, color: "#e5e7eb", margin: "8px 0" }}>
                <strong>Total Revenue:</strong> ₹{analytics.totalRevenue.toLocaleString()}
              </p>
              <p style={{ fontSize: 13, color: "#e5e7eb", margin: "8px 0" }}>
                <strong>Platform Earnings:</strong> ₹{Math.round(analytics.platformEarnings).toLocaleString()}
              </p>
              <p style={{ fontSize: 13, color: "#e5e7eb", margin: "8px 0" }}>
                <strong>Active SuperAdmins:</strong> {superAdmins.length}
              </p>
            </div>

            {/* Additional Settings */}
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: "2px solid #1f2937" }}>
              <h4 style={{ color: "#e5e7eb", marginTop: 0, marginBottom: 12 }}>
                Additional Settings
              </h4>
              
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                <p style={{ margin: "8px 0" }}>
                  <strong style={{ color: "#e5e7eb" }}>Default Commission:</strong> {globalCommissionRate}%
                </p>
                <p style={{ margin: "8px 0" }}>
                  <strong style={{ color: "#e5e7eb" }}>Organizations can override:</strong> Yes
                </p>
                <p style={{ margin: "8px 0" }}>
                  <strong style={{ color: "#e5e7eb" }}>Auto-approve organizations:</strong> No (Manual)
                </p>
                <p style={{ margin: "8px 0" }}>
                  <strong style={{ color: "#e5e7eb" }}>Auto-approve caregivers:</strong> No (Manual)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

                



