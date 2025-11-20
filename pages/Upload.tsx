import React, { useState, useRef } from 'react';
import { Camera, Upload as UploadIcon, Check, Loader2, X } from 'lucide-react';
import { extractPayslipData } from '../services/gemini';
import { addPayslip } from '../services/firebase';
import { Payslip } from '../types';
import { useNavigate } from 'react-router-dom';

interface UploadProps {
  userId: string;
}

export const Upload: React.FC<UploadProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [data, setData] = useState<Partial<Payslip>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImage(base64);
      analyzeImage(base64.split(',')[1]); // Send raw base64 without prefix
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64: string) => {
    setProcessing(true);
    try {
      const result = await extractPayslipData(base64);
      setData(result);
      setStep('verify');
    } catch (e) {
      alert("Failed to analyze image. Please try again or enter manually.");
      setStep('verify'); // Still go to verify to allow manual entry
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    setProcessing(true);
    try {
      await addPayslip({
        uid: userId,
        createdAt: Date.now(),
        employer: data.employer || 'Unknown',
        period: data.period || new Date().toISOString().slice(0, 7),
        date: data.date || new Date().toISOString().slice(0, 10),
        netPay: Number(data.netPay) || 0,
        grossPay: Number(data.grossPay) || 0,
        tax: Number(data.tax) || 0,
        imageUrl: 'stored_later' // In real app, upload to Storage first
      } as Payslip);
      navigate('/');
    } catch (e) {
      console.error(e);
      alert("Error saving data");
    } finally {
      setProcessing(false);
    }
  };

  if (step === 'input') {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6 p-6">
        <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Add Payslip</h2>
            <p className="text-ios-gray">Take a photo or upload a file to auto-extract details.</p>
        </div>
        
        {processing ? (
            <div className="flex flex-col items-center space-y-4 animate-pulse">
                <Loader2 className="animate-spin text-ios-blue" size={48} />
                <p className="text-sm font-medium text-slate-600">Gemini is analyzing...</p>
            </div>
        ) : (
            <div className="w-full max-w-xs space-y-4">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-square rounded-3xl border-2 border-dashed border-ios-blue/30 bg-blue-50 flex flex-col items-center justify-center text-ios-blue hover:bg-blue-100 transition-colors"
                >
                    <Camera size={48} className="mb-2" />
                    <span className="font-medium">Tap to Scan</span>
                </button>
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Verify Details</h2>
          <button onClick={() => setStep('input')} className="p-2 bg-gray-100 rounded-full">
              <X size={20} />
          </button>
      </div>

      {image && (
          <div className="h-40 w-full bg-gray-100 rounded-xl overflow-hidden shadow-inner relative">
              <img src={image} alt="Preview" className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">Source Image</span>
              </div>
          </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        <div>
            <label className="block text-xs font-medium text-ios-gray mb-1">Employer</label>
            <input 
                type="text" 
                value={data.employer || ''} 
                onChange={e => setData({...data, employer: e.target.value})}
                className="w-full p-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-ios-blue outline-none font-semibold"
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-ios-gray mb-1">Period (YYYY-MM)</label>
                <input 
                    type="text" 
                    value={data.period || ''} 
                    onChange={e => setData({...data, period: e.target.value})}
                    className="w-full p-2 bg-gray-50 rounded-lg outline-none"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-ios-gray mb-1">Payment Date</label>
                <input 
                    type="date" 
                    value={data.date || ''} 
                    onChange={e => setData({...data, date: e.target.value})}
                    className="w-full p-2 bg-gray-50 rounded-lg outline-none"
                />
            </div>
        </div>
        <div className="h-[1px] bg-gray-100 my-2" />
        <div>
            <label className="block text-xs font-medium text-ios-gray mb-1">Net Pay</label>
            <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input 
                    type="number" 
                    value={data.netPay || ''} 
                    onChange={e => setData({...data, netPay: Number(e.target.value)})}
                    className="w-full p-2 pl-7 bg-green-50 text-green-800 rounded-lg outline-none font-bold text-lg"
                />
            </div>
        </div>
         <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-ios-gray mb-1">Gross Pay</label>
                <input 
                    type="number" 
                    value={data.grossPay || ''} 
                    onChange={e => setData({...data, grossPay: Number(e.target.value)})}
                    className="w-full p-2 bg-gray-50 rounded-lg outline-none"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-ios-gray mb-1">Tax</label>
                <input 
                    type="number" 
                    value={data.tax || ''} 
                    onChange={e => setData({...data, tax: Number(e.target.value)})}
                    className="w-full p-2 bg-gray-50 rounded-lg outline-none"
                />
            </div>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={processing}
        className="w-full bg-ios-blue text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center space-x-2 active:scale-95 transition-transform"
      >
          {processing ? <Loader2 className="animate-spin" /> : <Check />}
          <span>Save Payslip</span>
      </button>
    </div>
  );
};