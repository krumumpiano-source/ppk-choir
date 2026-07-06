'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/user'; // Ensure paths match the actual project setup
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. ตรวจสอบ State จาก Firebase Auth (สำหรับ Admin)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // ดึงข้อมูล Role จาก Firestore `users` collection โดยใช้ uid
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              name: userData.name || 'Admin',
              voiceType: userData.voiceType || 'All',
              role: userData.role || 'admin',
              room: userData.room || '',
              createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            });
          } else {
            // ถ้าไม่มีข้อมูลใน Firestore, จำลองเป็น admin เริ่มต้น (กรณีเพิ่งสมัครด้วย Firebase Auth)
            setUser({
              id: firebaseUser.uid,
              name: 'Admin User',
              voiceType: 'All',
              role: 'admin',
              room: '',
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
        setLoading(false);
      } else {
        // 2. ถ้าไม่มี Firebase Auth Session ให้เช็ค LocalStorage
        const localAdmin = localStorage.getItem('admin_session');
        const localStudent = localStorage.getItem('student_session');
        
        if (localAdmin) {
          try {
            setUser(JSON.parse(localAdmin));
          } catch (e) {
            setUser(null);
          }
        } else if (localStudent) {
          try {
            setUser(JSON.parse(localStudent));
          } catch (e) {
            setUser(null);
          }
        } else {
           setUser(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Firebase signout error:", error);
    }
    localStorage.removeItem('student_session');
    setUser(null);
    // แจ้งลบ Cookie (สำหรับ Admin Server Action ถ้ามีการใช้)
    fetch('/admin/actions/logout', { method: 'POST' }).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
