import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

const AuthContext = createContext({
  user: null,
  loading: true,
  userRole: null,
  userDoc: null,
  userData: null,
  refreshUserDoc: null,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUserDoc = async () => {
    if (!user) return;
    try {
      let docSnap;
      
      // Try to determine the collection based on current role
      if (userRole === "org_admin") {
        docSnap = await getDoc(doc(db, "organizations", user.uid));
      } else if (userRole === "caregiver") {
        docSnap = await getDoc(doc(db, "vendors", user.uid));
      } else {
        docSnap = await getDoc(doc(db, "users", user.uid));
      }
      
      // If not found in primary collection, try other collections
      if (!docSnap.exists()) {
        docSnap = await getDoc(doc(db, "users", user.uid));
      }
      if (!docSnap.exists()) {
        docSnap = await getDoc(doc(db, "organizations", user.uid));
      }
      if (!docSnap.exists()) {
        docSnap = await getDoc(doc(db, "vendors", user.uid));
      }
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserRole(data.role);
        setUserDoc(data);
        setUserData(data);
      }
    } catch (err) {
      console.error("Error refreshing user data:", err);
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          // Try fetching from users collection first
          let docSnap = await getDoc(doc(db, "users", u.uid));
          let collection_name = "users";
          
          // If not found in users, try organizations
          if (!docSnap.exists()) {
            docSnap = await getDoc(doc(db, "organizations", u.uid));
            collection_name = "organizations";
          }
          
          // If not found in organizations, try vendors
          if (!docSnap.exists()) {
            docSnap = await getDoc(doc(db, "vendors", u.uid));
            collection_name = "vendors";
          }
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserRole(data.role);
            setUserDoc(data);
            setUserData(data);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      } else {
        setUserRole(null);
        setUserDoc(null);
        setUserData(null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userRole, userDoc, userData, refreshUserDoc }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
