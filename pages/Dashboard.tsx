import React, { useEffect, useState } from 'react';
import { getPayslips } from '../services/firebase';
import { Payslip } from '../types';
import { TrendingUp, Calendar, DollarSign, ChevronRight } from 'lucide-react';

interface DashboardProps {
  userId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getPayslips(userId);
        setPayslips(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId]);

  const totalNet = payslips.reduce((sum, p) => sum + (p.netPay || 0), 0);
  const latest = payslips[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Card */}
      <div className="bg-ios-card rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-xs font-semibold uppercase text-ios-gray mb-2">Total Net Income (YTD)</h2>
        <div className="text-3xl font-bold text-slate-900 tracking-tight">
          ${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        {latest && (
            <div className="mt-4 flex items-center space-x-2 text-sm text-ios-green bg-green-50 w-fit px-2 py-1 rounded-md">
                <TrendingUp size={14} />
                <span>Last pay: ${latest.netPay.toLocaleString()} ({latest.period})</span>
            </div>
        )}
      </div>

      {/* Recent List */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3 ml-1">Recent Payslips</h3>
        {loading ? (
           <div className="space-y-3">
             {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-xl"></div>)}
           </div>
        ) : payslips.length === 0 ? (
            <div className="text-center py-10 text-ios-gray">
                <p>No payslips found.</p>
                <p className="text-xs mt-1">Tap "Add" to scan one.</p>
            </div>
        ) : (
            <div className="bg-ios-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {payslips.map((slip, idx) => (
                <div key={slip.id}>
                    <div className="flex items-center justify-between p-4 active:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-ios-blue/10 rounded-full flex items-center justify-center text-ios-blue">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">{slip.employer || 'Unknown Employer'}</p>
                                <div className="flex items-center text-xs text-ios-gray space-x-2">
                                    <Calendar size={10} />
                                    <span>{slip.period} • {new Date(slip.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="font-medium text-slate-900">${slip.netPay.toLocaleString()}</span>
                            <ChevronRight size={16} className="text-gray-300" />
                        </div>
                    </div>
                    {idx < payslips.length - 1 && <div className="h-[1px] bg-gray-100 ml-16" />}
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};