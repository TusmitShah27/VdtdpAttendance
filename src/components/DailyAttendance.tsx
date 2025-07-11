import React from 'react';
import { Member, AttendanceStatus } from '../../types';
import { Icon } from './Icon';

export const DailyAttendance: React.FC<{
  members: Member[];
  todaysAttendance: Record<string, AttendanceStatus>;
  onSave: (statuses: Record<string, AttendanceStatus>) => void;
}> = ({ members, todaysAttendance, onSave }) => {
  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleTogglePresentAbsent = (memberId: string) => {
    const currentStatus = todaysAttendance[memberId];
    // If currently present, mark as absent. Otherwise, mark as present.
    // This handles toggling from Absent/HalfDay to Present, and Present to Absent.
    const newStatus =
      currentStatus === AttendanceStatus.Present
        ? AttendanceStatus.Absent
        : AttendanceStatus.Present;
    onSave({ [memberId]: newStatus });
  };

  const handleMarkHalfDay = (memberId: string) => {
    const currentStatus = todaysAttendance[memberId];
    // Avoid re-saving if the status is already half-day
    if (currentStatus === AttendanceStatus.HalfDay) {
      return;
    }
    onSave({ [memberId]: AttendanceStatus.HalfDay });
  };

  const markAllPresent = () => {
    const allPresentBatch = members.reduce((acc, member) => {
      if (todaysAttendance[member.id] !== AttendanceStatus.Present) {
        acc[member.id] = AttendanceStatus.Present;
      }
      return acc;
    }, {} as Record<string, AttendanceStatus>);

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
        {members.map(member => {
          const currentStatus = todaysAttendance[member.id] || AttendanceStatus.Absent;
          
          const isPresent = currentStatus === AttendanceStatus.Present;
          const isHalfDay = currentStatus === AttendanceStatus.HalfDay;
          const isAbsent = !isPresent && !isHalfDay;

          // Define styles for the Present/Absent toggle button
          let presentToggleClasses = '';
          let presentToggleIcon: 'check' | 'close' = 'check';

          if (isPresent) {
            presentToggleClasses = 'bg-green-500 text-white ring-green-300';
            presentToggleIcon = 'check';
          } else if (isAbsent) {
            presentToggleClasses = 'bg-red-500 text-white ring-red-300';
            presentToggleIcon = 'close';
          } else { // isHalfDay
            presentToggleClasses = 'bg-stone-700 text-stone-100 hover:bg-stone-600 ring-transparent';
            presentToggleIcon = 'check'; // Represents the 'Present' action, but is inactive
          }

          // Define styles for the Half Day button
          const halfDayClasses = isHalfDay
            ? 'bg-orange-500 text-white ring-orange-300'
            : 'bg-stone-700 text-stone-100 hover:bg-stone-600 ring-transparent';

          const baseButtonClasses = "p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900";

          return (
            <div key={member.id} className="bg-stone-900 p-4 rounded-lg flex items-center justify-between shadow">
              <div>
                <p className="font-semibold text-stone-100">{member.name}</p>
                <p className="text-sm text-stone-400">{member.instrument}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleTogglePresentAbsent(member.id)}
                  className={`${baseButtonClasses} ${presentToggleClasses}`}
                  aria-label={isPresent ? "Mark as Absent" : "Mark as Present"}
                >
                  <Icon type={presentToggleIcon} className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleMarkHalfDay(member.id)}
                  className={`${baseButtonClasses} ${halfDayClasses}`}
                  aria-label="Mark as Half Day"
                >
                  <Icon type="halfday" className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
