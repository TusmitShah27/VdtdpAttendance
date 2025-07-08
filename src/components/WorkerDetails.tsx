import React, { useState, useMemo } from 'react';
import { Member, AttendanceRecord, AttendanceStatus } from '../../types';
import { Icon } from './Icon';
import { generatePerformanceRemark } from '../services/geminiService';

interface MemberDetailsProps {
  member: Member;
  attendance: AttendanceRecord;
  onUpdateMember: (memberId: string, name: string, instrument: string) => Promise<void>;
}

const StatusIndicator: React.FC<{ status: AttendanceStatus }> = ({ status }) => {
  const styles = {
    [AttendanceStatus.Present]: 'bg-green-500',
    [AttendanceStatus.Absent]: 'bg-red-500',
    [AttendanceStatus.HalfDay]: 'bg-orange-500',
  };
  return <span className={`w-3 h-3 rounded-full inline-block ${styles[status]}`}></span>;
};

export const MemberDetails: React.FC<MemberDetailsProps> = ({ member, attendance, onUpdateMember }) => {
  const [remark, setRemark] = useState('');
  const [isLoadingRemark, setIsLoadingRemark] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState(member.name);
  const [editedInstrument, setEditedInstrument] = useState(member.instrument);


  const summary = useMemo(() => {
    const counts = {
      [AttendanceStatus.Present]: 0,
      [AttendanceStatus.Absent]: 0,
      [AttendanceStatus.HalfDay]: 0,
    };

    const today = new Date();
    let totalDaysConsidered = 0;
    const memberSince = new Date(member.createdAt);

    // Consider the last 30 days for attendance summary
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Don't count attendance for days before the member joined
        if (date < memberSince) continue;
        
        totalDaysConsidered++;
        const dateString = date.toISOString().split('T')[0];
        const status = attendance[dateString];

        if (status === AttendanceStatus.Present) {
          counts.present++;
        } else if (status === AttendanceStatus.HalfDay) {
          counts.halfday++;
        }
    }
    
    counts.absent = totalDaysConsidered - counts.present - counts.halfday;
    return counts;
  }, [attendance, member.createdAt]);

  const augmentedAttendance = useMemo(() => {
    const records: { date: string; status: AttendanceStatus }[] = [];
    const today = new Date();
    const memberSince = new Date(member.createdAt);

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      if (date < memberSince) continue;
      
      const dateString = date.toISOString().split('T')[0];
      const status = attendance[dateString] || AttendanceStatus.Absent;
      records.push({ date: dateString, status });
    }
    return records;
  }, [attendance, member.createdAt]);

  const handleGenerateRemark = async () => {
    setIsLoadingRemark(true);
    setRemark('');
    const summaryText = `Total days tracked: ${augmentedAttendance.length}. Present: ${summary.present}, Absent: ${summary.absent}, Half Day: ${summary.halfday}.`;
    const generatedRemark = await generatePerformanceRemark(member.name, summaryText);
    setRemark(generatedRemark);
    setIsLoadingRemark(false);
  };

  const handleSave = async () => {
    if (!editedName.trim() || !editedInstrument.trim()) return;
    setIsSaving(true);
    try {
        await onUpdateMember(member.id, editedName, editedInstrument);
        setIsEditing(false);
    } catch(err) {
        console.error("Error updating member:", err);
        // Optionally show an error to the user
    } finally {
        setIsSaving(false);
    }
  };
  
  return (
    <div className="p-4">
      <div className="bg-stone-900 p-4 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-3 text-stone-100">Attendance Summary (Last 30 Days)</h3>
        <div className="flex justify-around">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">{summary.present}</p>
            <p className="text-sm text-stone-400">Present</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-400">{summary.absent}</p>
            <p className="text-sm text-stone-400">Absent</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-400">{summary.halfday}</p>
            <p className="text-sm text-stone-400">Half Day</p>
          </div>
        </div>
      </div>
      
      {/* <div className="bg-stone-900 p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-stone-100">AI Performance Remark</h3>
            <button onClick={handleGenerateRemark} disabled={isLoadingRemark} className="text-sm bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700 disabled:bg-stone-700 disabled:cursor-wait transition-colors">
                {isLoadingRemark ? 'Generating...' : 'Generate'}
            </button>
        </div>
        {isLoadingRemark && <div className="text-center text-stone-400">Analyzing data with Gemini...</div>}
        {remark && <p className="text-stone-300 bg-stone-800 p-3 rounded-md italic">"{remark}"</p>}
      </div> */}

      <div className="bg-stone-900 p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-stone-100">Member Details</h3>
            {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-sm bg-stone-700 text-white px-3 py-1 rounded-md hover:bg-stone-600 transition-colors">
                    <Icon type="edit" className="w-4 h-4" />
                    Edit
                </button>
            )}
        </div>
        
        {isEditing ? (
            <div className="mt-4 space-y-4">
                <div>
                    <label htmlFor="memberName" className="block text-sm font-medium text-stone-300 mb-1">Member Name</label>
                    <input
                        type="text"
                        id="memberName"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        disabled={isSaving}
                    />
                </div>
                <div>
                    <label htmlFor="memberInstrument" className="block text-sm font-medium text-stone-300 mb-1">Instrument</label>
                    <input
                        type="text"
                        id="memberInstrument"
                        value={editedInstrument}
                        onChange={(e) => setEditedInstrument(e.target.value)}
                        className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        disabled={isSaving}
                    />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => setIsEditing(false)} disabled={isSaving} className="text-sm bg-stone-600 text-white px-4 py-2 rounded-md hover:bg-stone-500 transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving || !editedName.trim() || !editedInstrument.trim()} className="text-sm bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:bg-stone-700 disabled:cursor-not-allowed flex items-center gap-2">
                        {isSaving ? <Icon type="spinner" className="w-4 h-4"/> : <Icon type="save" className="w-4 h-4"/>}
                        Save
                    </button>
                </div>
            </div>
        ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-stone-400">Name</p>
                    <p className="text-stone-100 font-medium">{member.name}</p>
                </div>
                <div>
                    <p className="text-stone-400">Instrument</p>
                    <p className="text-stone-100 font-medium">{member.instrument}</p>
                </div>
                <div>
                    <p className="text-stone-400">Member Since</p>
                    <p className="text-stone-100 font-medium">{new Date(member.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3 text-stone-100">Detailed Log (Last 30 Days)</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {augmentedAttendance.length > 0 ? augmentedAttendance.map(({ date, status }) => (
            <div key={date} className="bg-stone-900 p-3 rounded-md flex justify-between items-center">
                <p className="text-stone-300">{new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div className="flex items-center gap-2">
                <StatusIndicator status={status} />
                <span className="capitalize text-sm font-medium">{status === AttendanceStatus.HalfDay ? 'Half Day' : status}</span>
                </div>
            </div>
            )) : <p className="text-center text-stone-500">No attendance records found.</p>}
        </div>
      </div>
    </div>
  );
};