import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Icon } from './Icon';
import { AttendanceStatus, Member } from '../../types';

interface DashboardProps {
  todaySummary: {
    present: number;
    absent: number;
    onHalfDay: number;
    total: number;
  };
  weeklySummary: { name: string; present: number; absent: number; halfDay: number }[];
  onLogout: () => void;
  members: Member[];
  onSelectMember: (memberId: string) => void;
  loading: boolean;
  onGenerateReport: (days: number) => string;
  installPromptEvent: any;
  onInstall: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; iconType: 'check' | 'close' | 'halfday' | 'member'; color: string }> = ({ title, value, iconType, color }) => (
  <div className="bg-stone-900 p-4 rounded-lg shadow-md flex items-center">
    <div className={`p-3 rounded-full mr-4 ${color}`}>
      <Icon type={iconType} className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-stone-400">{title}</p>
      <p className="text-2xl font-bold text-stone-100">{value}</p>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ todaySummary, weeklySummary, onLogout, members, onSelectMember, loading, onGenerateReport, installPromptEvent, onInstall }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => a.name.localeCompare(b.name));
  }, [members]);

  const filteredMembers = sortedMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.instrument.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const COLORS = {
    [AttendanceStatus.Present]: '#22c55e', // green-500
    [AttendanceStatus.Absent]: '#ef4444', // red-500
    [AttendanceStatus.HalfDay]: '#f97316', // orange-500
  };
  
  const downloadCsv = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadReport = (days: number) => {
    const filename = days === 7 
      ? `weekly-attendance-report-${new Date().toISOString().split('T')[0]}.csv`
      : `monthly-attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    const csvData = onGenerateReport(days);
    downloadCsv(csvData, filename);
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center h-full pt-20">
              <Icon type="spinner" className="w-12 h-12 text-orange-500" />
              <p className="mt-4 text-stone-400">Loading Dashboard...</p>
          </div>
      );
  }

  return (
    <div className="p-4 space-y-6 relative">
      <button onClick={onLogout} className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-800 transition-colors z-10">
          <Icon type="logout" className="w-6 h-6 text-stone-300" />
      </button>

      <div className="text-center pt-4 pb-2">
          <div className="w-24 h-24 inline-block rounded-full mb-4 overflow-hidden shadow-lg bg-stone-900">
               <Icon type="appLogo" className="w-full h-full object-cover" />
          </div>
        <h1 className="text-3xl font-bold text-orange-100" style={{ fontFamily: 'sans-serif' }}>वक्रतुंड</h1>
        <p className="text-stone-400 mt-1">श्री गणेश मंदिर संस्थान</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Members" value={todaySummary.total} iconType="member" color="bg-orange-500" />
        <StatCard title="Present" value={todaySummary.present} iconType="check" color="bg-green-500" />
        <StatCard title="Absent" value={todaySummary.absent} iconType="close" color="bg-red-500" />
        <StatCard title="Half Day" value={todaySummary.onHalfDay} iconType="halfday" color="bg-orange-500" />
      </div>

      <div>
        <h3 className="text-xl font-bold text-stone-100 mb-4">Weekly Attendance</h3>
        <div className="bg-stone-900 p-4 rounded-lg shadow-md h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklySummary} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" stroke="#78716c" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#78716c" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #292524', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#f5f5f4' }}
              />
              <Legend wrapperStyle={{fontSize: "12px"}}/>
              <Bar dataKey="present" stackId="a" fill={COLORS.present} name="Present" />
              <Bar dataKey="absent" stackId="a" fill={COLORS.absent} name="Absent" />
              <Bar dataKey="halfDay" stackId="a" fill={COLORS.halfday} name="Half Day" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {installPromptEvent && (
        <div>
          <h3 className="text-xl font-bold text-stone-100 mb-4">Install App</h3>
          <div className="bg-stone-900 p-4 rounded-lg shadow-md">
            <button
              onClick={onInstall}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              <Icon type="download" className="w-5 h-5" />
              Install Vakratund App
            </button>
            <p className="text-xs text-stone-400 mt-3 text-center">Install the app for quick access from your home screen and offline use.</p>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-stone-100 mb-4">Reports</h3>
        <div className="bg-stone-900 p-4 rounded-lg shadow-md flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => handleDownloadReport(7)}
            className="w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            <Icon type="download" className="w-5 h-5" />
            Weekly Report
          </button>
          <button 
            onClick={() => handleDownloadReport(30)}
            className="w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            <Icon type="download" className="w-5 h-5" />
            Monthly Report
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-stone-100 mb-4">All Members ({members.length})</h3>
        
        <div className="relative mb-4">
            <input
                type="text"
                placeholder="Search by name or instrument..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-lg py-3 pl-10 pr-4 focus:ring-orange-500 focus:border-orange-500 transition"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon type="search" className="w-5 h-5 text-stone-400" />
            </div>
        </div>

        <div className="space-y-3">
            {filteredMembers.length > 0 ? (
                filteredMembers.map(member => (
                  <div key={member.id} onClick={() => onSelectMember(member.id)} className="bg-stone-900 p-4 rounded-lg flex items-center justify-between shadow cursor-pointer hover:bg-stone-800 transition-colors">
                    <div className="flex items-center">
                        <div className="bg-stone-700 p-2 rounded-full mr-4">
                            <Icon type="member" className="w-6 h-6 text-stone-300" />
                        </div>
                        <div>
                          <p className="font-semibold text-stone-100">{member.name}</p>
                          <p className="text-sm text-stone-400">{member.instrument}</p>
                        </div>
                    </div>
                  </div>
                ))
            ) : (
                <div className="text-center py-8 bg-stone-900 rounded-lg">
                    {members.length === 0 ? (
                        <p className="text-stone-400">No members found. Add one from the 'Add Member' tab.</p>
                    ) : (
                        <p className="text-stone-400">No members found matching "{searchTerm}".</p>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};