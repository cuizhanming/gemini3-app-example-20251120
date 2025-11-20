import { User } from 'firebase/auth';

export interface Payslip {
  id: string;
  uid: string;
  period: string; // "YYYY-MM"
  date: string; // ISO Date
  netPay: number;
  grossPay: number;
  tax: number;
  employer: string;
  imageUrl?: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  isDemo: boolean;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
