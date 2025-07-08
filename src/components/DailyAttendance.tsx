import React from 'react';
import { Member, AttendanceStatus } from '../../types';
import { Icon } from './Icon';

interface DailyAttendanceProps {
  members: Member[];
  todaysAttendance: Record<string, AttendanceStatus>;
  onSave: (statuses: Record<string, AttendanceStatus>) => void;
}

const StatusButton: React.FC<{
  status: AttendanceStatus;
  currentStatus: AttendanceStatus | undefined;
  onClick: () => void;
}> = ({ status, currentStatus, onClick }) => {
  const isSelected = status === currentStatus;

  const baseClasses = "p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900";
  
  const selectedClasses = {
    [AttendanceStatus.Present]: 'bg-green-500 text-white ring-green-300',
    [AttendanceStatus.Absent]:  'bg-red-500 text-white ring-red-300',
    [AttendanceStatus.HalfDay]:   'bg-orange-500 text-white ring-orange-300',
  };

  const unselectedClasses = 'bg-stone-700 text-stone-100 hover:bg-stone-600 ring-transparent';

  const icons: Record<AttendanceStatus, 'check' | 'close' | 'halfday'> = {
    [AttendanceStatus.Present]: 'check',
    [AttendanceStatus.Absent]: 'close',
    [AttendanceStatus.HalfDay]: 'halfday',
  };
  
  const finalClasses = `${baseClasses} ${isSelected ? selectedClasses[status] : unselectedClasses}`;

  return (
    <button onClick={onClick} className={finalClasses}>
      <Icon type={icons[status]} className="w-5 h-5" />
    </button>
  );
};


export const DailyAttendance: React.FC<DailyAttendanceProps> = ({ members, todaysAttendance, onSave }) => {
  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
    // Prevent re-saving if the status is already the same
    if (todaysAttendance[memberId] === status) {
      return;
    }
    onSave({ [memberId]: status });
  };

  const markAllPresent = () => {
    const allPresentBatch = members.reduce((acc, member) => {
      // Only include members who are not already marked as present
      if (todaysAttendance[member.id] !== AttendanceStatus.Present) {
        acc[member.id] = AttendanceStatus.Present;
      }
      return acc;
    }, {} as Record<string, AttendanceStatus>);

    // Only save if there are actual changes
    if (Object.keys(allPresentBatch).length > 0) {
      onSave(allPresentBatch);
    }
  };

  return (
    <div className="p-4">
       <div className="mb-6 text-center">
        <p className="text-stone-400 text-sm">Marking attendance for:</p>
        <h2 className="text-xl font-semibold text-orange-200">{formattedDate}</h2>
      </div>

      <div className="flex justify-end items-center mb-4">
        <button
          onClick={markAllPresent}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg shadow hover:bg-orange-700 transition-colors"
        >
          Mark All Present
        </button>
      </div>

      <div className="space-y-3">
        {members.map(member => (
          <div key={member.id} className="bg-stone-900 p-4 rounded-lg flex items-center justify-between shadow">
            <div>
              <p className="font-semibold text-stone-100">{member.name}</p>
              <p className="text-sm text-stone-400">{member.instrument}</p>
            </div>
            <div className="flex items-center space-x-2">
              <StatusButton status={AttendanceStatus.Present} currentStatus={todaysAttendance[member.id]} onClick={() => handleStatusChange(member.id, AttendanceStatus.Present)} />
              <StatusButton status={AttendanceStatus.HalfDay} currentStatus={todaysAttendance[member.id]} onClick={() => handleStatusChange(member.id, AttendanceStatus.HalfDay)} />
            </div>
          </div>
        ))}
      </div>
      {/* The save button is removed for instant updates */}
    </div>
  );
};