// src/AdminDashboardPage.js
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
  query,
  where,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "./firebaseConfig";
import "./OrganizationDashboard.css";
import { saveOrganizationRecord } from "./saveOrganizationRecord";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("organizations");

  // Organizations
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [orgStatusFilter, setOrgStatusFilter] = useState("all");
  const [searchOrg, setSearchOrg] = useState("");
  const [selectedOrg, setSelectedOrg] = useState(null);

  // Org details modal caregivers list
  const [orgCaregivers, setOrgCaregivers] = useState([]);

  // Edit organization modal
  const [editingOrg, setEditingOrg] = useState(null);

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

  // Edit caregiver modal
  const [editingCaregiver, setEditingCaregiver] = useState(null);
  const [editCaregiverData, setEditCaregiverData] = useState({
    name: "",
    location: "",
    hourlyRate: "",
    workType: "",
    category: "",
    services: [],
    experience: "",
  });

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
    const loadAllData = async () => {
      try {
        // Organizations
        setLoadingOrganizations(true);
        try {
          const orgSnap = await getDocs(collection(db, "organizations"));
          const orgsData = orgSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setOrganizations(orgsData);
        } catch (err) {
          console.error("Error loading organizations:", err);
          setOrganizations([]);
        }
        setLoadingOrganizations(false);

        // Vendors
        setLoadingVendors(true);
        try {
          const vendorSnap = await getDocs(collection(db, "vendors"));
          const vendorsData = vendorSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setVendors(vendorsData);
        } catch (err) {
          console.error("Error loading vendors:", err);
          setVendors([]);
        }
        setLoadingVendors(false);

        // Bookings
        setLoadingBookings(true);
        let bookingsData = [];
        try {
          const bookingSnap = await getDocs(collection(db, "bookings"));
          bookingsData = bookingSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setBookings(bookingsData);
        } catch (err) {
          console.error("Error loading bookings:", err);
          setBookings([]);
        }
        setLoadingBookings(false);

        // Services
        try {
          const servicesSnap = await getDocs(collection(db, "services"));
          const servicesData = servicesSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setServices(servicesData);
        } catch (err) {
          console.error("Error loading services:", err);
          setServices([]);
        }

        // Blacklist reports
        try {
          const reportsSnap = await getDocs(collection(db, "blacklistReports"));
          setBlacklistReports(
            reportsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          );
        } catch (err) {
          console.error("Error loading blacklist reports:", err);
          setBlacklistReports([]);
        }

        // Blacklist
        try {
          const blacklistSnap = await getDocs(collection(db, "blacklist"));
          setBlacklist(
            blacklistSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          );
        } catch (err) {
          console.error("Error loading blacklist:", err);
          setBlacklist([]);
        }

        // SuperAdmins
        try {
          const usersSnap = await getDocs(collection(db, "users"));
          const allUsers = usersSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setSuperAdmins(allUsers.filter((u) => u.role === "superadmin"));
        } catch (err) {
          console.error("Error loading superadmins:", err);
          setSuperAdmins([]);
        }

        // Global commission
        try {
          const settingsSnap = await getDoc(doc(db, "settings", "commission"));
          if (settingsSnap.exists()) {
            setGlobalCommissionRate(settingsSnap.data().rate ?? 15);
          }
        } catch (err) {
          console.error("Error loading commission settings:", err);
        }

        // Get the most recent data for analytics
        let latestOrgsData = [];
        let latestVendorsData = [];
        let latestBookingsData = bookingsData;
        try {
          const orgSnap = await getDocs(collection(db, "organizations"));
          latestOrgsData = orgSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
        } catch (err) {
          console.error("Error reloading organizations for analytics:", err);
        }

        try {
          const vendorSnap = await getDocs(collection(db, "vendors"));
          latestVendorsData = vendorSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
        } catch (err) {
          console.error("Error reloading vendors for analytics:", err);
        }

        // Analytics
        const totalRevenueCalc = latestBookingsData
          .filter((b) => b.status === "completed")
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const platformEarningsCalc = latestBookingsData
          .filter((b) => b.status === "completed")
          .reduce((sum, b) => sum + (b.platformCommission || 0), 0);

        setAnalytics({
          totalOrganizations: latestOrgsData.length,
          approvedOrganizations: latestOrgsData.filter((o) => o.isApproved).length,
          totalCaregivers: latestVendorsData.length,
          approvedCaregivers: latestVendorsData.filter((v) => v.isApproved).length,
          totalBookings: latestBookingsData.length,
          completedBookings: latestBookingsData.filter(
            (b) => b.status === "completed",
          ).length,
          totalRevenue: totalRevenueCalc,
          platformEarnings: platformEarningsCalc,
        });

        setError(""); // Clear any previous errors
      } catch (err) {
        console.error("Unexpected error loading admin dashboard data:", err);
        console.error("Error details:", err.message, err.code);
        setError(`Could not load admin dashboard data: ${err.message}`);
      }
    };

    loadAllData();
  }, []);

  const handleOrgClick = async (org) => {
    setSelectedOrg(org);
    try {
      const q = query(
        collection(db, "vendors"),
        where("organizationId", "==", org.id),
      );
      const snap = await getDocs(q);
      setOrgCaregivers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error loading caregivers", err);
    }
  };

  const handleApproveCaregiverClick = async (caregiverId) => {
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
      if (selectedOrg) {
        await handleOrgClick(selectedOrg);
      }
    } catch (err) {
      console.error("Error approving caregiver", err);
    }
  };

  const handleRejectCaregiverClick = async (caregiverId) => {
    const reason = window.prompt("Enter rejection reason");
    if (!reason) return;
    try {
      await updateDoc(doc(db, "vendors", caregiverId), {
        isApproved: false,
        rejectionReason: reason,
        rejectedAt: serverTimestamp(),
      });
      alert("Caregiver rejected!");
      if (selectedOrg) {
        await handleOrgClick(selectedOrg);
      }
    } catch (err) {
      console.error("Error rejecting caregiver", err);
    }
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    setError("");
    setAddingOrg(true);
    try {
      const orgCred = await createUserWithEmailAndPassword(
        auth,
        newOrgEmail,
        newOrgPassword,
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

      await saveOrganizationRecord({
        orgUid,
        organizationName: newOrgName,
        adminName: newOrgAdminName,
        adminEmail: newOrgEmail,
        businessPhone: newOrgPhone,
        businessAddress: newOrgAddress,
        businessCity: newOrgCity,
      });

      await updateDoc(doc(db, "organizations", orgUid), {
        commissionRate: Number(newOrgCommission) || 15,
        isApproved: true,
        verified: true,
        createdBy: "superadmin",
      });

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

      const orgSnap = await getDocs(collection(db, "organizations"));
      setOrganizations(orgSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error creating organization", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError(err.message || "Could not create organization.");
      }
    } finally {
      setAddingOrg(false);
    }
  };

  const handleCreateSuperAdmin = async (e) => {
    e.preventDefault();
    setError("");
    setAddingSuperAdmin(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        newSuperAdminEmail,
        newSuperAdminPassword,
      );
      const superAdminUid = cred.user.uid;

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

      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers = usersSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setSuperAdmins(allUsers.filter((u) => u.role === "superadmin"));
    } catch (err) {
      console.error("Error creating superadmin", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError(err.message || "Could not create superadmin.");
      }
    } finally {
      setAddingSuperAdmin(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setError("");
    if (!newServiceLabel.trim()) {
      setError("Please enter a service name.");
      return;
    }
    try {
      const id = newServiceLabel.trim().toLowerCase().replace(/\s+/g, "_");
      await setDoc(doc(db, "services", id), {
        label: newServiceLabel.trim(),
        serviceName: newServiceLabel.trim(),
        category: newServiceCategory,
        createdAt: serverTimestamp(),
        createdBy: "superadmin",
      });
      setNewServiceLabel("");
      setNewServiceCategory("caregiver");
      alert("Service added!");
      const servicesSnap = await getDocs(collection(db, "services"));
      setServices(servicesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error adding service", err);
      setError("Could not add service.");
    }
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      await updateDoc(doc(db, "services", editingService.id), {
        label: editServiceLabel.trim(),
        serviceName: editServiceLabel.trim(),
        category: editServiceCategory,
      });
      alert("Service updated!");
      setEditingService(null);
      const servicesSnap = await getDocs(collection(db, "services"));
      setServices(servicesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error updating service", err);
      alert("Could not update service.");
    }
  };

  const handleDeleteService = async (serviceId, label) => {
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "services", serviceId));
      alert("Service deleted!");
      const servicesSnap = await getDocs(collection(db, "services"));
      setServices(servicesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error deleting service", err);
      alert("Could not delete service.");
    }
  };

  const handleApproveOrganization = async (orgId) => {
    try {
      console.log("Approving organization:", orgId);
      
      // Update organization document
      await updateDoc(doc(db, "organizations", orgId), {
        isApproved: true,
        approvedAt: serverTimestamp(),
        approvedBy: "superadmin",
      });
      console.log("Organization approved in Firestore");

      // Try to update user document if it exists
      try {
        await updateDoc(doc(db, "users", orgId), {
          isApproved: true,
        });
        console.log("User document updated");
      } catch (userErr) {
        console.warn("Could not update user document (may not exist):", userErr);
        // This is not critical - continue anyway
      }

      alert("Organization approved successfully!");
      
      // Reload organizations list
      try {
        const orgSnap = await getDocs(collection(db, "organizations"));
        setOrganizations(orgSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (reloadErr) {
        console.error("Error reloading organizations:", reloadErr);
      }
    } catch (err) {
      console.error("Error approving organization:", err);
      console.error("Error details:", err.message, err.code);
      alert(`Could not approve organization: ${err.message}`);
    }
  };

  const handleRejectOrganization = async (orgId) => {
    const reason = window.prompt("Enter rejection reason");
    if (!reason) return;
    try {
      console.log("Rejecting organization:", orgId);
      await updateDoc(doc(db, "organizations", orgId), {
        isApproved: false,
        rejectionReason: reason,
        rejectedAt: serverTimestamp(),
      });
      alert("Organization rejected.");
      
      // Reload organizations list
      try {
        const orgSnap = await getDocs(collection(db, "organizations"));
        setOrganizations(orgSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (reloadErr) {
        console.error("Error reloading organizations:", reloadErr);
      }
    } catch (err) {
      console.error("Error rejecting organization:", err);
      console.error("Error details:", err.message, err.code);
      alert(`Could not reject organization: ${err.message}`);
    }
  };

  const handleSuspendOrganization = async (orgId, isSuspended) => {
    try {
      console.log("Suspending organization:", orgId);
      const newSuspendedStatus = !isSuspended;
      
      await updateDoc(doc(db, "organizations", orgId), {
        isSuspended: newSuspendedStatus,
        suspendedAt: newSuspendedStatus ? serverTimestamp() : null,
      });
      
      // Try to update user document if it exists
      try {
        await updateDoc(doc(db, "users", orgId), {
          isSuspended: newSuspendedStatus,
        });
        console.log("User document updated");
      } catch (userErr) {
        console.warn("Could not update user document (may not exist):", userErr);
        // This is not critical - continue anyway
      }

      alert(`Organization ${newSuspendedStatus ? "suspended" : "unsuspended"}.`);
      
      // Reload organizations list
      try {
        const orgSnap = await getDocs(collection(db, "organizations"));
        setOrganizations(orgSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (reloadErr) {
        console.error("Error reloading organizations:", reloadErr);
      }
    } catch (err) {
      console.error("Error updating organization:", err);
      console.error("Error details:", err.message, err.code);
      alert(`Could not update organization: ${err.message}`);
    }
  };

  const handleBlacklistUser = async (reportId, userId) => {
    try {
      const report = blacklistReports.find((r) => r.id === reportId);
      if (!report) return;
      await setDoc(doc(db, "blacklist", userId), {
        userName: report.userName,
        userId,
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
      const reportsSnap = await getDocs(collection(db, "blacklistReports"));
      setBlacklistReports(
        reportsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      );
      const blacklistSnap = await getDocs(collection(db, "blacklist"));
      setBlacklist(blacklistSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error blacklisting user", err);
      alert("Could not blacklist user.");
    }
  };

  const handleRejectReport = async (reportId) => {
    try {
      await updateDoc(doc(db, "blacklistReports", reportId), {
        status: "rejected",
      });
      alert("Report rejected.");
      const reportsSnap = await getDocs(collection(db, "blacklistReports"));
      setBlacklistReports(
        reportsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      );
    } catch (err) {
      console.error("Error rejecting report", err);
      alert("Could not reject report.");
    }
  };

  const handleRemoveFromBlacklist = async (userId) => {
    if (!window.confirm("Remove this user from blacklist?")) return;
    try {
      await deleteDoc(doc(db, "blacklist", userId));
      alert("User removed from blacklist.");
      const blacklistSnap = await getDocs(collection(db, "blacklist"));
      setBlacklist(blacklistSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error removing from blacklist", err);
      alert("Could not remove from blacklist.");
    }
  };

  // Edit caregiver: open modal with data
  const handleEditCaregiver = (vendor) => {
    setEditingCaregiver(vendor);
    setEditCaregiverData({
      name: vendor.name || "",
      location: vendor.location || "",
      hourlyRate: vendor.hourlyRate != null ? String(vendor.hourlyRate) : "",
      workType: vendor.workType || "",
      category: vendor.category || "",
      services: Array.isArray(vendor.services)
        ? vendor.services
        : vendor.services
          ? String(vendor.services)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      experience: vendor.experience || "",
    });
  };

  const handleSaveCaregiverEdits = async (e) => {
    e.preventDefault();
    if (!editingCaregiver) return;

    try {
      const hourlyRate = Number(editCaregiverData.hourlyRate) || 0;

      await updateDoc(doc(db, "vendors", editingCaregiver.id), {
        name: editCaregiverData.name,
        location: editCaregiverData.location,
        hourlyRate,
        workType: editCaregiverData.workType,
        category: editCaregiverData.category,
        services: editCaregiverData.services, // already array
        experience: editCaregiverData.experience,
      });

      alert("Caregiver updated.");

      const vendorSnap = await getDocs(collection(db, "vendors"));
      const vendorsData = vendorSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setVendors(vendorsData);
      setEditingCaregiver(null);
    } catch (err) {
      console.error("Error updating caregiver", err);
      alert("Could not update caregiver.");
    }
  };

  const handleRemoveCaregiver = async (vendorId) => {
    if (!window.confirm("Remove this caregiver? This cannot be undone."))
      return;

    try {
      await deleteDoc(doc(db, "vendors", vendorId));
      await updateDoc(doc(db, "users", vendorId), {
        isSuspended: true,
      });

      alert("Caregiver removed.");
      const vendorSnap = await getDocs(collection(db, "vendors"));
      const vendorsData = vendorSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setVendors(vendorsData);
    } catch (err) {
      console.error("Error removing caregiver", err);
      alert("Could not remove caregiver.");
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
    fontSize: "13px",
    transition: "all 0.2s ease",
  });

  const getServicesForCategory = (category) => {
    if (!category) return [];

    const cat = category.toLowerCase();

    // If category includes both caregiver and household, show all
    if (cat.includes("both")) {
      return services;
    }

    // caregiver-only
    if (cat.includes("caregiver") || cat.includes("care giver")) {
      return services.filter(
        (s) => s.category === "caregiver" || s.category === "both",
      );
    }

    // household-only
    if (cat.includes("household") || cat.includes("house hold")) {
      return services.filter(
        (s) => s.category === "household" || s.category === "both",
      );
    }

    // default: all
    return services;
  };

  const filteredOrganizations = organizations.filter((org) => {
    const term = searchOrg.toLowerCase();
    const matchSearch =
      org.organizationName?.toLowerCase().includes(term) ||
      org.adminName?.toLowerCase().includes(term) ||
      org.adminEmail?.toLowerCase().includes(term);

    const matchStatus =
      orgStatusFilter === "all"
        ? true
        : orgStatusFilter === "pending"
          ? !org.isApproved
          : orgStatusFilter === "approved"
            ? org.isApproved && !org.isSuspended
            : orgStatusFilter === "suspended"
              ? org.isSuspended
              : true;

    return matchSearch && matchStatus;
  });

  const filteredVendors = vendors.filter((vendor) => {
    const term = searchVendor.toLowerCase();
    const matchSearch =
      vendor.name?.toLowerCase().includes(term) ||
      vendor.email?.toLowerCase().includes(term) ||
      vendor.organizationName?.toLowerCase().includes(term);

    const matchStatus =
      vendorStatusFilter === "all"
        ? true
        : vendorStatusFilter === "pending"
          ? !vendor.isApproved
          : vendorStatusFilter === "approved"
            ? vendor.isApproved && !vendor.isSuspended
            : vendorStatusFilter === "suspended"
              ? vendor.isSuspended
              : true;

    return matchSearch && matchStatus;
  });

  const filteredBookings = bookings.filter((b) => {
    const matchStatus =
      !bookingStatusFilter || b.status === bookingStatusFilter;
    const matchDate = !bookingDateFilter || b.date === bookingDateFilter;
    return matchStatus && matchDate;
  });

  const filteredReports = blacklistReports.filter(
    (r) => r.status === blacklistFilter,
  );

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ color: "#e5e7eb", marginBottom: "8px" }}>
        SuperAdmin Dashboard
      </h1>
      <p
        style={{
          fontSize: "13px",
          color: "#9ca3af",
          marginBottom: "16px",
        }}
      >
        Sewak Platform Management - Full control over all platform activities.
      </p>

      {/* Tabs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <button
          style={getTabStyle("organizations")}
          onClick={() => setActiveTab("organizations")}
        >
          Organizations ({analytics.totalOrganizations})
        </button>
        <button
          style={getTabStyle("caregivers")}
          onClick={() => setActiveTab("caregivers")}
        >
          Caregivers ({analytics.totalCaregivers})
        </button>
        <button
          style={getTabStyle("bookings")}
          onClick={() => setActiveTab("bookings")}
        >
          Bookings ({analytics.totalBookings})
        </button>
        <button
          style={getTabStyle("services")}
          onClick={() => setActiveTab("services")}
        >
          Services ({services.length})
        </button>
        <button
          style={getTabStyle("reports")}
          onClick={() => setActiveTab("reports")}
        >
          Reports ({blacklistReports.length})
        </button>
        <button
          style={getTabStyle("settings")}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* ===== ORGANIZATIONS TAB ===== */}
      {activeTab === "organizations" && (
        <div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn btn-primary"
              onClick={() => setShowAddOrgForm(true)}
              style={{ flex: 1 }}
            >
              + Create Organization
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowAddSuperAdminForm(true)}
              style={{ flex: 1 }}
            >
              + Add SuperAdmin
            </button>
          </div>

          {/* Filters */}
          <div className="row" style={{ marginBottom: "16px" }}>
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
            filteredOrganizations.map((org) => (
              <div
                key={org.id}
                className="card"
                style={{ marginBottom: "12px" }}
              >
                {/* Org info */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <strong style={{ color: "#e5e7eb", fontSize: "18px" }}>
                      {org.organizationName || "No name"}
                    </strong>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#9ca3af",
                        marginTop: "4px",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>Organization ID</span>:{" "}
                      {org.id}
                    </div>
                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                      <span style={{ fontWeight: 600 }}>Admin</span>:{" "}
                      {org.adminName || "NA"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                      <span style={{ fontWeight: 600 }}>Admin Email</span>:{" "}
                      {org.adminEmail || "NA"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                      <span style={{ fontWeight: 600 }}>Phone</span>:{" "}
                      {org.businessPhone || "NA"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                      <span style={{ fontWeight: 600 }}>Address</span>:{" "}
                      {org.businessAddress || ""}, {org.businessCity || ""}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      alignItems: "flex-end",
                    }}
                  >
                    <span
                      style={{
                        background: org.isApproved ? "#dcfce7" : "#fef3c7",
                        color: org.isApproved ? "#15803d" : "#92400e",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      {org.isApproved ? "✓ Approved" : "Pending Approval"}
                    </span>
                    {org.isSuspended && (
                      <span
                        style={{
                          background: "#dc2626",
                          color: "#fff",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        Suspended
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                      }}
                    >
                      Commission: {org.commissionRate ?? 15}%
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                      }}
                    >
                      Total Caregivers: {org.totalCaregivers ?? 0}
                    </span>
                  </div>
                </div>

                {/* Actions row */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "12px",
                    flexWrap: "wrap",
                  }}
                >
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
                        ✕ Reject
                      </button>
                    </>
                  )}

                  <button
                    className="btn btn-outline"
                    onClick={() =>
                      handleSuspendOrganization(org.id, org.isSuspended)
                    }
                    style={{
                      flex: 1,
                      background: org.isSuspended ? "#111827" : "#7f1d1d",
                      color: org.isSuspended ? "#e5e7eb" : "#fecaca",
                      border: `1px solid ${
                        org.isSuspended ? "#1f2937" : "#991b1b"
                      }`,
                    }}
                  >
                    {org.isSuspended ? "🔓 Unsuspend" : "🔒 Suspend"}
                  </button>

                  <button
                    className="btn btn-outline"
                    onClick={() => setEditingOrg(org)}
                    style={{ flex: 1 }}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={() => handleOrgClick(org)}
                    style={{ flex: 1, background: "#10b981" }}
                  >
                    📋 View Caregivers
                  </button>
                </div>
              </div>
            ))
          )}

          {/* ===== ORGANIZATION DETAILS MODAL ===== */}
          {activeTab === "organizations" && selectedOrg && (
            <div>
              <button
                onClick={() => setSelectedOrg(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0ea5e9",
                  cursor: "pointer",
                  fontSize: "14px",
                  marginBottom: "16px",
                  fontWeight: "600",
                }}
              >
                ← Back to Organizations
              </button>

              <div
                className="card"
                style={{
                  background: "#0b1120",
                  marginBottom: "24px",
                }}
              >
                <h2 style={{ color: "#e5e7eb", marginTop: "0" }}>
                  {selectedOrg.organizationName}
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "16px",
                  }}
                >
                  <div>
                    <p
                      style={{
                        color: "#9ca3af",
                        fontSize: "12px",
                        margin: "0 0 4px 0",
                      }}
                    >
                      Organization ID
                    </p>
                    <p style={{ color: "#e5e7eb", margin: "0" }}>
                      {selectedOrg.id}
                    </p>
                  </div>

                  <div>
                    <p
                      style={{
                        color: "#9ca3af",
                        fontSize: "12px",
                        margin: "0 0 4px 0",
                      }}
                    >
                      Admin Name
                    </p>
                    <p style={{ color: "#e5e7eb", margin: "0" }}>
                      {selectedOrg.adminName}
                    </p>
                  </div>

                  <div>
                    <p
                      style={{
                        color: "#9ca3af",
                        fontSize: "12px",
                        margin: "0 0 4px 0",
                      }}
                    >
                      Admin Email
                    </p>
                    <p style={{ color: "#e5e7eb", margin: "0" }}>
                      {selectedOrg.adminEmail}
                    </p>
                  </div>

                  <div>
                    <p
                      style={{
                        color: "#9ca3af",
                        fontSize: "12px",
                        margin: "0 0 4px 0",
                      }}
                    >
                      Status
                    </p>
                    <span
                      style={{
                        background: selectedOrg.isApproved
                          ? "#dcfce7"
                          : "#fee2e2",
                        color: selectedOrg.isApproved ? "#15803d" : "#991b1b",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {selectedOrg.isApproved
                        ? "✓ Approved"
                        : "⏳ Pending Approval"}
                    </span>
                  </div>

                  <div>
                    <p
                      style={{
                        color: "#9ca3af",
                        fontSize: "12px",
                        margin: "0 0 4px 0",
                      }}
                    >
                      Commission Rate
                    </p>
                    <p style={{ color: "#e5e7eb", margin: "0" }}>
                      {selectedOrg.commissionRate || 15}%
                    </p>
                  </div>

                  <div>
                    <p
                      style={{
                        color: "#9ca3af",
                        fontSize: "12px",
                        margin: "0 0 4px 0",
                      }}
                    >
                      Total Caregivers
                    </p>
                    <p style={{ color: "#e5e7eb", margin: "0" }}>
                      {selectedOrg.totalCaregivers || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ color: "#e5e7eb", marginBottom: "16px" }}>
                  Caregivers ({orgCaregivers.length})
                </h3>

                {orgCaregivers.length === 0 ? (
                  <p style={{ color: "#9ca3af" }}>
                    No caregivers under this organization
                  </p>
                ) : (
                  orgCaregivers.map((caregiver) => (
                    <div
                      key={caregiver.id}
                      className="card"
                      style={{ marginBottom: "12px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              margin: "0 0 8px 0",
                              color: "#e5e7eb",
                            }}
                          >
                            {caregiver.name}
                          </h4>

                          <p
                            style={{
                              margin: "4px 0",
                              color: "#9ca3af",
                              fontSize: "12px",
                            }}
                          >
                            📍 {caregiver.location}
                          </p>

                          <p
                            style={{
                              margin: "4px 0",
                              color: "#9ca3af",
                              fontSize: "12px",
                            }}
                          >
                            💰 Rs{caregiver.hourlyRate}/hour
                          </p>

                          <p
                            style={{
                              margin: "4px 0",
                              color: "#9ca3af",
                              fontSize: "12px",
                            }}
                          >
                            Category: {caregiver.category || "N/A"}
                          </p>

                          <p
                            style={{
                              margin: "4px 0",
                              color: "#9ca3af",
                              fontSize: "12px",
                            }}
                          >
                            Services:{" "}
                            {Array.isArray(caregiver.services)
                              ? caregiver.services.join(", ")
                              : caregiver.services || "N/A"}
                          </p>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            alignItems: "flex-end",
                          }}
                        >
                          <span
                            style={{
                              background: caregiver.isApproved
                                ? "#dcfce7"
                                : "#fef3c7",
                              color: caregiver.isApproved
                                ? "#15803d"
                                : "#92400e",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            {caregiver.isApproved
                              ? "✓ Approved"
                              : "Pending Approval"}
                          </span>

                          <span
                            style={{
                              fontSize: "11px",
                              color: "#9ca3af",
                            }}
                          >
                            Experience: {caregiver.experience || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginTop: "12px",
                        }}
                      >
                        {!caregiver.isApproved && (
                          <>
                            <button
                              className="btn btn-primary"
                              onClick={() =>
                                handleApproveCaregiverClick(caregiver.id)
                              }
                              style={{ flex: 1 }}
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="btn btn-outline"
                              onClick={() =>
                                handleRejectCaregiverClick(caregiver.id)
                              }
                              style={{
                                flex: 1,
                                background: "#7f1d1d",
                                color: "#fecaca",
                                border: "1px solid #991b1b",
                              }}
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== CAREGIVERS TAB ===== */}
      {activeTab === "caregivers" && (
        <div>
          <div className="row" style={{ marginBottom: "16px" }}>
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
              <div className="empty-state-icon">🧑‍⚕️</div>
              <p className="empty-state-title">No caregivers found</p>
              <p className="empty-state-text">
                {vendors.length === 0
                  ? "No caregivers registered yet"
                  : "No caregivers match your filters"}
              </p>
            </div>
          ) : (
            filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="card"
                style={{ marginBottom: "12px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, color: "#e5e7eb" }}>
                      {vendor.name}
                    </h3>
                    <p
                      style={{
                        margin: "4px 0",
                        color: "#9ca3af",
                        fontSize: "12px",
                      }}
                    >
                      {vendor.email}
                    </p>
                    <p
                      style={{
                        margin: "4px 0",
                        color: "#9ca3af",
                        fontSize: "12px",
                      }}
                    >
                      Organization: {vendor.organizationName || "Independent"}
                    </p>
                    <p
                      style={{
                        margin: "4px 0",
                        color: "#9ca3af",
                        fontSize: "12px",
                      }}
                    >
                      Location: {vendor.location}
                    </p>
                    <p
                      style={{
                        margin: "4px 0",
                        color: "#9ca3af",
                        fontSize: "12px",
                      }}
                    >
                      Rs{vendor.hourlyRate}/hour
                    </p>
                    <p
                      style={{
                        margin: "4px 0",
                        color: "#9ca3af",
                        fontSize: "12px",
                      }}
                    >
                      Category: {vendor.category || "N/A"}
                    </p>
                    <p
                      style={{
                        margin: "4px 0",
                        color: "#9ca3af",
                        fontSize: "12px",
                      }}
                    >
                      Services:{" "}
                      {Array.isArray(vendor.services)
                        ? vendor.services.join(", ")
                        : vendor.services || "N/A"}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      alignItems: "flex-end",
                    }}
                  >
                    <span
                      style={{
                        background: vendor.isApproved ? "#dcfce7" : "#fef3c7",
                        color: vendor.isApproved ? "#15803d" : "#92400e",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      {vendor.isApproved ? "✓ Approved" : "Pending Approval"}
                    </span>
                    {vendor.isSuspended && (
                      <span
                        style={{
                          background: "#dc2626",
                          color: "#fff",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        Suspended
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  {!vendor.isApproved && (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleApproveCaregiverClick(vendor.id)}
                        style={{ flex: 1 }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleRejectCaregiverClick(vendor.id)}
                        style={{
                          flex: 1,
                          background: "#7f1d1d",
                          color: "#fecaca",
                          border: "1px solid #991b1b",
                        }}
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}

                  <button
                    className="btn btn-outline"
                    onClick={() => handleEditCaregiver(vendor)}
                    style={{ flex: 1 }}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    className="btn btn-outline"
                    onClick={() => handleRemoveCaregiver(vendor.id)}
                    style={{
                      flex: 1,
                      background: "#7f1d1d",
                      color: "#fecaca",
                      border: "1px solid #991b1b",
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== BOOKINGS TAB ===== */}
      {activeTab === "bookings" && (
        <div>
          <div className="row" style={{ marginBottom: "16px" }}>
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
            <div className="col">
              <label>Date</label>
              <input
                type="date"
                value={bookingDateFilter}
                onChange={(e) => setBookingDateFilter(e.target.value)}
              />
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
                  ? "No bookings yet"
                  : "No bookings match your filters"}
              </p>
            </div>
          ) : (
            filteredBookings.map((b) => (
              <div key={b.id} className="card" style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, color: "#e5e7eb" }}>
                      {b.householdName} ↔ {b.caregiverName}
                    </h3>
                    <p
                      style={{
                        margin: "4px 0",
                        color: "#9ca3af",
                        fontSize: "12px",
                      }}
                    >
                      Date: {b.date} | Time: {b.startTime} - {b.endTime}
                    </p>
                    <p
                      style={{
                        margin: "4px 0",
                        color: "#9ca3af",
                        fontSize: "12px",
                      }}
                    >
                      Location: {b.location}
                    </p>
                    <p
                      style={{
                        margin: "4px 0",
                        color: "#9ca3af",
                        fontSize: "12px",
                      }}
                    >
                      Total: Rs{b.totalAmount || 0} | Platform: Rs
                      {b.platformCommission || 0}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      alignItems: "flex-end",
                    }}
                  >
                    <span
                      style={{
                        background:
                          b.status === "completed"
                            ? "#dcfce7"
                            : b.status === "cancelled"
                              ? "#fee2e2"
                              : "#fef3c7",
                        color:
                          b.status === "completed"
                            ? "#15803d"
                            : b.status === "cancelled"
                              ? "#991b1b"
                              : "#92400e",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== SERVICES TAB ===== */}
      {activeTab === "services" && (
        <div>
          <form
            onSubmit={editingService ? handleUpdateService : handleAddService}
            style={{
              marginBottom: "16px",
              padding: "12px",
              background: "#020617",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ color: "#e5e7eb", marginTop: 0 }}>
              {editingService ? "Edit service" : "Add new service"}
            </h3>
            <div className="row">
              <div className="col">
                <label>Service name</label>
                <input
                  type="text"
                  value={editingService ? editServiceLabel : newServiceLabel}
                  onChange={(e) =>
                    editingService
                      ? setEditServiceLabel(e.target.value)
                      : setNewServiceLabel(e.target.value)
                  }
                  placeholder="e.g. Elderly Care"
                />
              </div>
              <div className="col">
                <label>Category</label>
                <select
                  value={
                    editingService ? editServiceCategory : newServiceCategory
                  }
                  onChange={(e) =>
                    editingService
                      ? setEditServiceCategory(e.target.value)
                      : setNewServiceCategory(e.target.value)
                  }
                >
                  <option value="caregiver">Caregiver</option>
                  <option value="household">Household</option>
                </select>
              </div>
            </div>
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              {editingService && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingService(null)}
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-primary">
                {editingService ? "Save changes" : "Add service"}
              </button>
            </div>
          </form>

          {services.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No services configured yet.</p>
          ) : (
            services.map((s) => (
              <div key={s.id} className="card" style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, color: "#e5e7eb" }}>
                      {s.label || s.serviceName}
                    </h3>
                    <p
                      style={{
                        margin: "4px 0",
                        color: "#9ca3af",
                        fontSize: "12px",
                      }}
                    >
                      Category: {s.category || "caregiver"}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setEditingService(s);
                        setEditServiceLabel(s.label || s.serviceName || "");
                        setEditServiceCategory(s.category || "caregiver");
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() =>
                        handleDeleteService(s.id, s.label || s.serviceName)
                      }
                      style={{
                        background: "#7f1d1d",
                        color: "#fecaca",
                        border: "1px solid #991b1b",
                      }}
                    >
                      ✕ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== REPORTS TAB ===== */}
      {activeTab === "reports" && (
        <div>
          <div className="row" style={{ marginBottom: "16px" }}>
            <div className="col">
              <label>Filter</label>
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

          {filteredReports.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No reports found.</p>
          ) : (
            filteredReports.map((r) => (
              <div key={r.id} className="card" style={{ marginBottom: "12px" }}>
                <h3 style={{ margin: 0, color: "#e5e7eb" }}>
                  {r.userName} ({r.userId})
                </h3>
                <p
                  style={{
                    margin: "4px 0",
                    color: "#9ca3af",
                    fontSize: "12px",
                  }}
                >
                  Reported by: {r.reportedByName} ({r.reportedBy})
                </p>
                <p
                  style={{
                    margin: "4px 0",
                    color: "#9ca3af",
                    fontSize: "12px",
                  }}
                >
                  Reason: {r.reason}
                </p>
                {r.description && (
                  <p
                    style={{
                      margin: "4px 0",
                      color: "#9ca3af",
                      fontSize: "12px",
                    }}
                  >
                    Details: {r.description}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "12px",
                  }}
                >
                  {r.status === "pending" && (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleBlacklistUser(r.id, r.userId)}
                        style={{ flex: 1 }}
                      >
                        Blacklist user
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleRejectReport(r.id)}
                        style={{
                          flex: 1,
                          background: "#7f1d1d",
                          color: "#fecaca",
                          border: "1px solid #991b1b",
                        }}
                      >
                        Reject report
                      </button>
                    </>
                  )}
                  {r.status === "blacklisted" && (
                    <button
                      className="btn btn-outline"
                      onClick={() => handleRemoveFromBlacklist(r.userId)}
                      style={{
                        flex: 1,
                        background: "#7f1d1d",
                        color: "#fecaca",
                        border: "1px solid #991b1b",
                      }}
                    >
                      Remove from blacklist
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          <h3 style={{ color: "#e5e7eb", marginTop: "24px" }}>
            Blacklisted users ({blacklist.length})
          </h3>
          {blacklist.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No blacklisted users.</p>
          ) : (
            blacklist.map((b) => (
              <div key={b.id} className="card" style={{ marginBottom: "12px" }}>
                <h3 style={{ margin: 0, color: "#e5e7eb" }}>
                  {b.userName} ({b.userId})
                </h3>
                <p
                  style={{
                    margin: "4px 0",
                    color: "#9ca3af",
                    fontSize: "12px",
                  }}
                >
                  Reason: {b.reason}
                </p>
                <p
                  style={{
                    margin: "4px 0",
                    color: "#9ca3af",
                    fontSize: "12px",
                  }}
                >
                  Reported by: {b.reportedByName} ({b.reportedBy})
                </p>
                <button
                  className="btn btn-outline"
                  onClick={() => handleRemoveFromBlacklist(b.id)}
                  style={{
                    marginTop: "8px",
                    background: "#7f1d1d",
                    color: "#fecaca",
                    border: "1px solid #991b1b",
                  }}
                >
                  Remove from blacklist
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== SETTINGS TAB ===== */}
      {activeTab === "settings" && (
        <div>
          <div
            className="card"
            style={{
              marginBottom: "16px",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#e5e7eb" }}>
              Global commission rate
            </h3>
            {editingCommission ? (
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <input
                  type="number"
                  value={globalCommissionRate}
                  onChange={(e) =>
                    setGlobalCommissionRate(Number(e.target.value) || 0)
                  }
                  style={{ maxWidth: "120px" }}
                />
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      await setDoc(
                        doc(db, "settings", "commission"),
                        {
                          rate: globalCommissionRate,
                          updatedAt: serverTimestamp(),
                        },
                        { merge: true },
                      );
                      alert("Global commission updated.");
                      setEditingCommission(false);
                    } catch (err) {
                      console.error("Error updating commission", err);
                      alert("Could not update commission.");
                    }
                  }}
                >
                  Save
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setEditingCommission(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#e5e7eb",
                  }}
                >
                  {globalCommissionRate}%
                </p>
                <button
                  className="btn btn-outline"
                  onClick={() => setEditingCommission(true)}
                >
                  ✏️ Edit
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0, color: "#e5e7eb" }}>SuperAdmins</h3>
            {superAdmins.length === 0 ? (
              <p style={{ color: "#9ca3af" }}>
                No superadmins created yet. Use the Organizations tab to add new
                superadmins.
              </p>
            ) : (
              superAdmins.map((u) => (
                <div
                  key={u.id}
                  style={{
                    borderBottom: "1px solid #1f2937",
                    padding: "8px 0",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "#e5e7eb",
                      fontWeight: 600,
                    }}
                  >
                    {u.name}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0 0",
                      color: "#9ca3af",
                      fontSize: "12px",
                    }}
                  >
                    {u.email}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Caregiver Modal (Admin) */}
      {editingCaregiver && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 640 }}>
            <h2 style={{ color: "#e5e7eb", marginTop: 0, marginBottom: 4 }}>
              Edit caregiver
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginTop: 0,
                marginBottom: 16,
              }}
            >
              Update caregiver details. Email and login credentials are managed
              separately.
            </p>

            <form onSubmit={handleSaveCaregiverEdits} className="form">
              {/* Name + Location */}
              <div className="row">
                <div className="col">
                  <label>Name</label>
                  <input
                    type="text"
                    value={editCaregiverData.name}
                    onChange={(e) =>
                      setEditCaregiverData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="col">
                  <label>Location</label>
                  <select
                    value={editCaregiverData.location}
                    onChange={(e) =>
                      setEditCaregiverData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select location</option>
                    <option value="Kathmandu">Kathmandu</option>
                    <option value="Lalitpur">Lalitpur</option>
                    <option value="Bhaktapur">Bhaktapur</option>
                  </select>
                </div>
              </div>

              {/* Rate + Work type */}
              <div className="row">
                <div className="col">
                  <label>Hourly rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editCaregiverData.hourlyRate}
                    onChange={(e) =>
                      setEditCaregiverData((prev) => ({
                        ...prev,
                        hourlyRate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col">
                  <label>Work type</label>
                  <select
                    value={editCaregiverData.workType}
                    onChange={(e) =>
                      setEditCaregiverData((prev) => ({
                        ...prev,
                        workType: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                  </select>
                </div>
              </div>

              {/* Category */}
              <div className="row">
                <div className="col">
                  <label>Category</label>
                  <select
                    value={editCaregiverData.category}
                    onChange={(e) =>
                      setEditCaregiverData((prev) => ({
                        ...prev,
                        category: e.target.value,
                        services: [],
                      }))
                    }
                  >
                    <option value="">Select category</option>
                    <option value="caregiver">Caregiver</option>
                    <option value="household">Household</option>
                    <option value="both">Both</option>
                  </select>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      marginTop: 4,
                    }}
                  >
                    Services list below will update based on this category.
                  </p>
                </div>
              </div>

              {/* Services checkboxes */}
              <div className="form-group">
                <label>Services</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "4px 12px",
                  }}
                >
                  {getServicesForCategory(editCaregiverData.category).map(
                    (service) => {
                      const id = service.id || service.serviceName;
                      const label = service.label || service.serviceName;
                      const checked =
                        editCaregiverData.services.includes(label);

                      return (
                        <label
                          key={id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                            color: "#e5e7eb",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setEditCaregiverData((prev) => {
                                const current = prev.services || [];
                                if (e.target.checked) {
                                  return {
                                    ...prev,
                                    services: [...current, label],
                                  };
                                }
                                return {
                                  ...prev,
                                  services: current.filter((s) => s !== label),
                                };
                              });
                            }}
                          />
                          {label}
                        </label>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Experience */}
              <div className="form-group">
                <label>Experience</label>
                <input
                  type="text"
                  placeholder="e.g., 5 years"
                  value={editCaregiverData.experience}
                  onChange={(e) =>
                    setEditCaregiverData((prev) => ({
                      ...prev,
                      experience: e.target.value,
                    }))
                  }
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingCaregiver(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Organization Modal - only when organizations tab is active */}
      {activeTab === "organizations" && editingOrg && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Edit organization</h3>
            <div className="form">
              <div>
                <label>Name</label>
                <input
                  value={editingOrg.organizationName || ""}
                  onChange={(e) =>
                    setEditingOrg({
                      ...editingOrg,
                      organizationName: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label>Business phone</label>
                <input
                  value={editingOrg.businessPhone || ""}
                  onChange={(e) =>
                    setEditingOrg({
                      ...editingOrg,
                      businessPhone: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label>City</label>
                <input
                  value={editingOrg.businessCity || ""}
                  onChange={(e) =>
                    setEditingOrg({
                      ...editingOrg,
                      businessCity: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label>Commission rate (%)</label>
                <input
                  type="number"
                  value={editingOrg.commissionRate ?? 15}
                  onChange={(e) =>
                    setEditingOrg({
                      ...editingOrg,
                      commissionRate: Number(e.target.value || 0),
                    })
                  }
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setEditingOrg(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    await updateDoc(doc(db, "organizations", editingOrg.id), {
                      organizationName: editingOrg.organizationName || "",
                      businessPhone: editingOrg.businessPhone || "",
                      businessCity: editingOrg.businessCity || "",
                      commissionRate: editingOrg.commissionRate ?? 15,
                    });
                    if (editingOrg.adminUid) {
                      await updateDoc(doc(db, "users", editingOrg.adminUid), {
                        organizationName: editingOrg.organizationName || "",
                      });
                    }
                    setOrganizations((prev) =>
                      prev.map((o) =>
                        o.id === editingOrg.id ? editingOrg : o,
                      ),
                    );
                    setEditingOrg(null);
                  } catch (err) {
                    console.error("Error updating organization", err);
                    alert("Could not save changes.");
                  }
                }}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      {showAddOrgForm && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 640 }}>
            <h2 style={{ color: "#e5e7eb", marginTop: 0, marginBottom: 4 }}>
              Create new organization
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginTop: 0,
                marginBottom: 16,
              }}
            >
              This will create an organization admin account and link it to a
              new organization record in the system.
            </p>

            <form onSubmit={handleCreateOrganization} className="form">
              {/* Org + Admin names */}
              <div className="row">
                <div className="col">
                  <label>Organization name</label>
                  <input
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    required
                    placeholder="e.g., Ghar Sathi Care Pvt. Ltd."
                  />
                </div>
                <div className="col">
                  <label>Admin full name</label>
                  <input
                    value={newOrgAdminName}
                    onChange={(e) => setNewOrgAdminName(e.target.value)}
                    required
                    placeholder="e.g., Sita Sharma"
                  />
                </div>
              </div>

              {/* Admin credentials */}
              <div className="row">
                <div className="col">
                  <label>Admin email</label>
                  <input
                    type="email"
                    value={newOrgEmail}
                    onChange={(e) => setNewOrgEmail(e.target.value)}
                    required
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="col">
                  <label>Temporary password</label>
                  <input
                    type="password"
                    value={newOrgPassword}
                    onChange={(e) => setNewOrgPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                  />
                  <p
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      marginTop: 4,
                    }}
                  >
                    Share this password with the admin. They can change it
                    later.
                  </p>
                </div>
              </div>

              {/* Contact / location */}
              <div className="row">
                <div className="col">
                  <label>Business phone</label>
                  <input
                    value={newOrgPhone}
                    onChange={(e) => setNewOrgPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                  />
                </div>
                <div className="col">
                  <label>City</label>
                  <input
                    value={newOrgCity}
                    onChange={(e) => setNewOrgCity(e.target.value)}
                    placeholder="e.g., Kathmandu"
                  />
                </div>
              </div>

              <label>Business address</label>
              <input
                value={newOrgAddress}
                onChange={(e) => setNewOrgAddress(e.target.value)}
                placeholder="Street, area"
              />

              {/* Commission */}
              <div className="row" style={{ marginTop: 8 }}>
                <div className="col">
                  <label>Commission rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    value={newOrgCommission}
                    onChange={(e) =>
                      setNewOrgCommission(Number(e.target.value) || 15)
                    }
                  />
                  <p
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      marginTop: 4,
                    }}
                  >
                    Platform fee applied to bookings for this organization.
                  </p>
                </div>
              </div>

              {error && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "#fca5a5",
                  }}
                >
                  {error}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowAddOrgForm(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addingOrg}
                >
                  {addingOrg ? "Creating..." : "Create organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add SuperAdmin Modal */}
      {/* Add SuperAdmin Modal */}
      {showAddSuperAdminForm && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 520 }}>
            <h2 style={{ color: "#e5e7eb", marginTop: 0, marginBottom: 4 }}>
              Add new SuperAdmin
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginTop: 0,
                marginBottom: 16,
              }}
            >
              SuperAdmins have full control over organizations, caregivers,
              services, and settings. Assign this role carefully.
            </p>

            <form onSubmit={handleCreateSuperAdmin} className="form">
              <label>Full name</label>
              <input
                value={newSuperAdminName}
                onChange={(e) => setNewSuperAdminName(e.target.value)}
                required
                placeholder="e.g., Platform Owner"
              />

              <label>Email</label>
              <input
                type="email"
                value={newSuperAdminEmail}
                onChange={(e) => setNewSuperAdminEmail(e.target.value)}
                required
                placeholder="owner@example.com"
              />

              <label>Temporary password</label>
              <input
                type="password"
                value={newSuperAdminPassword}
                onChange={(e) => setNewSuperAdminPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
              <p
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginTop: 4,
                }}
              >
                Share this password with the SuperAdmin. They can change it
                after first login.
              </p>

              {error && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "#fca5a5",
                  }}
                >
                  {error}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowAddSuperAdminForm(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addingSuperAdmin}
                >
                  {addingSuperAdmin ? "Creating..." : "Create SuperAdmin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
