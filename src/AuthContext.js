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
      const docSnap = await getDoc(doc(db, "users", user.uid));
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
          const docSnap = await getDoc(doc(db, "users", u.uid));
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
