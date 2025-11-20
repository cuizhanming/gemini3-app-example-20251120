import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  Auth,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Firestore,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { Payslip } from '../types';

// NOTE: In a real app, use process.env for these values.
// If these are empty, the app falls back to "Demo Mode" with local storage.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || ""
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

const isConfigured = !!firebaseConfig.apiKey;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase Init Error:", e);
  }
}

// --- Auth Services ---

export const signInWithGoogle = async (): Promise<User | null> => {
  if (!auth) {
    // Demo Login
    const mockUser: any = {
      uid: 'demo-user-123',
      displayName: 'Demo User',
      email: 'demo@example.com',
      photoURL: 'https://picsum.photos/200'
    };
    localStorage.setItem('demo_user', JSON.stringify(mockUser));
    window.dispatchEvent(new Event('storage')); // Trigger update
    return mockUser;
  }
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const logout = async () => {
  if (!auth) {
    localStorage.removeItem('demo_user');
    // Do not reload the page as it causes 404s in some SPA environments.
    // Instead, dispatch the storage event to trigger the auth listener in App.tsx
    window.dispatchEvent(new Event('storage'));
    return;
  }
  await firebaseSignOut(auth);
};

export const subscribeToAuth = (callback: (user: User | null, isDemo: boolean) => void) => {
  if (!auth) {
    // Check local storage for demo user
    const checkDemo = () => {
      const stored = localStorage.getItem('demo_user');
      if (stored) {
        callback(JSON.parse(stored), true);
      } else {
        callback(null, true);
      }
    };
    checkDemo();
    window.addEventListener('storage', checkDemo);
    return () => window.removeEventListener('storage', checkDemo);
  }
  return onAuthStateChanged(auth, (user) => callback(user, false));
};

// --- Firestore / Data Services ---

export const addPayslip = async (payslip: Omit<Payslip, 'id'>): Promise<string> => {
  if (!db) {
    const payslips = JSON.parse(localStorage.getItem('mock_payslips') || '[]');
    const newSlip = { ...payslip, id: Date.now().toString() };
    payslips.push(newSlip);
    localStorage.setItem('mock_payslips', JSON.stringify(payslips));
    return newSlip.id;
  }

  try {
    const docRef = await addDoc(collection(db, `users/${payslip.uid}/payslips`), payslip);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
};

export const getPayslips = async (uid: string, year?: number, month?: number): Promise<Payslip[]> => {
  if (!db) {
    const all: Payslip[] = JSON.parse(localStorage.getItem('mock_payslips') || '[]');
    let filtered = all.filter(p => p.uid === uid);
    
    if (year) {
      filtered = filtered.filter(p => {
        const d = new Date(p.date);
        return d.getFullYear() === year;
      });
    }
    if (month) {
      filtered = filtered.filter(p => {
        const d = new Date(p.date);
        // month is 1-12
        return (d.getMonth() + 1) === month;
      });
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Basic query - for advanced filtering ideally use composite indexes, but here we'll filter client side for simplicity in POC
  // to avoid index setup requirements for the user.
  const q = query(collection(db, `users/${uid}/payslips`));
  const snapshot = await getDocs(q);
  let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payslip));

  // Client side filter for POC simplicity
  if (year) {
    data = data.filter(p => new Date(p.date).getFullYear() === year);
  }
  if (month) {
    data = data.filter(p => (new Date(p.date).getMonth() + 1) === month);
  }

  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getPayslipById = async (uid: string, id: string): Promise<Payslip | null> => {
  if (!db) {
    const all: Payslip[] = JSON.parse(localStorage.getItem('mock_payslips') || '[]');
    return all.find(p => p.id === id && p.uid === uid) || null;
  }

  const docRef = doc(db, `users/${uid}/payslips`, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Payslip;
  }
  return null;
}