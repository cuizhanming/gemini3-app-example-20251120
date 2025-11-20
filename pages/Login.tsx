import React from 'react';
import { Lock, Wallet } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  isDemo: boolean;
}

export const Login: React.FC<LoginProps> = ({ onLogin, isDemo }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 space-y-8 bg-ios-bg">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-20 h-20 bg-ios-blue rounded-2xl shadow-lg flex items-center justify-center text-white">
          <Wallet size={40} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">PayCheck AI</h1>
        <p className="text-ios-gray text-center max-w-xs">
          Securely manage your payslips and gain insights with on-device AI.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={onLogin}
          className="w-full bg-white text-slate-900 font-semibold py-3 px-4 rounded-xl shadow-sm border border-ios-separator/50 flex items-center justify-center space-x-2 active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>
        
        {isDemo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 text-center">
            <p className="font-bold">Demo Mode Active</p>
            <p>No Firebase keys detected. Data will be saved locally.</p>
          </div>
        )}
      </div>
      
      <div className="flex items-center text-xs text-ios-gray">
        <Lock size={12} className="mr-1" />
        <span>End-to-end isolation enforced</span>
      </div>
    </div>
  );
};