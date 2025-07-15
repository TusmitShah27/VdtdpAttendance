import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Member, AttendanceStatus, AttendanceData } from '../../types';
import { Icon } from './Icon';

// Helper functions for date manipulation
const getWeekStartDate = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust so that Monday is the first day of the week (day 1)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const DailyAttendance: React.FC<{
  members: Member[];
  attendance: AttendanceData;
  onSave: (statuses: Record<string, AttendanceStatus>, date: string) => void;
}> = ({ members, attendance, onSave }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [displayDate, setDisplayDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 60000); // Update time every minute
    return () => clearInterval(timerId);
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999); // Set to end of today for comparisons
    return d;
  }, []);
  
  const todayString = useMemo(() => new Date().toISOString().split('T')[0], []);
  const selectedDateString = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);
  
  const weekDays = useMemo(() => {
    const start = getWeekStartDate(displayDate);
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [displayDate]);

  const attendanceForSelectedDate = useMemo(() => {
    const attendanceForDate: Record<string, AttendanceStatus> = {};
    members.forEach(member => {
      const status = attendance[member.id]?.[selectedDateString];
      if (status) {
        attendanceForDate[member.id] = status;
      }
    });
    return attendanceForDate;
  }, [attendance, members, selectedDateString]);

  const sortedAndFilteredMembers = useMemo(() => {
    return [...members]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [members, searchTerm]);
  
  const handleDateSelect = (date: Date) => {
    if (date > today) return;
    setSelectedDate(date);
  };
  
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    setSelectedDate(newDate);
    setDisplayDate(newDate);
  };

  const handlePrevWeek = () => {
    setDisplayDate(prev => addDays(prev, -7));
  };
  
  const handleNextWeek = () => {
    const nextWeekStartDate = getWeekStartDate(addDays(displayDate, 7));
    if (nextWeekStartDate > today) return; // Prevent navigating to a future week
    setDisplayDate(prev => addDays(prev, 7));
  };

  const triggerDateInput = () => {
    dateInputRef.current?.showPicker();
  };

  const handleTogglePresentAbsent = (memberId: string) => {
    const currentStatus = attendanceForSelectedDate[memberId];
    const newStatus =
      currentStatus === AttendanceStatus.Present
        ? AttendanceStatus.Absent
        : AttendanceStatus.Present;
    onSave({ [memberId]: newStatus }, selectedDateString);
  };

  const handleMarkHalfDay = (memberId: string) => {
    const currentStatus = attendanceForSelectedDate[memberId];
    if (currentStatus === AttendanceStatus.HalfDay) {
      return;
    }
    onSave({ [memberId]: AttendanceStatus.HalfDay }, selectedDateString);
  };

  const markAllPresent = () => {
    const allPresentBatch = sortedAndFilteredMembers.reduce((acc, member) => {
      if (attendanceForSelectedDate[member.id] !== AttendanceStatus.Present) {
        acc[member.id] = AttendanceStatus.Present;
      }
      return acc;
    }, {} as Record<string, AttendanceStatus>);

    if (Object.keys(allPresentBatch).length > 0) {
      onSave(allPresentBatch, selectedDateString);
    }
  };

  return (
    <div className="p-4">
      {/* Custom Calendar UI */}
      <div className="mb-4 bg-stone-900 p-4 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <button onClick={handlePrevWeek} className="p-2 rounded-full hover:bg-stone-800 transition-colors">
            <Icon type="back" className="w-5 h-5 text-stone-300 transform rotate-180" />
          </button>
          <h3 className="font-semibold text-lg text-stone-100">
            {displayDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={handleNextWeek} disabled={getWeekStartDate(addDays(displayDate, 7)) > today} className="p-2 rounded-full hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Icon type="back" className="w-5 h-5 text-stone-300" />
          </button>
        </div>
        <div className="flex justify-around">
          {weekDays.map(day => {
            const dayString = day.toISOString().split('T')[0];
            const isSelected = dayString === selectedDateString;
            const isToday = dayString === todayString;
            const isFuture = day > today;

            return (
              <div
                key={dayString}
                onClick={() => handleDateSelect(day)}
                className={`flex flex-col items-center space-y-3 p-1 rounded-lg transition-colors ${isFuture ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-stone-800'}`}
              >
                <span className="text-xs font-medium text-stone-400">
                  {day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().substring(0, 2)}
                </span>
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${
                  isSelected ? 'bg-white text-stone-950 shadow-lg' : isToday ? 'text-orange-400' : 'text-stone-100'
                }`}>
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mb-6 bg-stone-900 p-3 rounded-xl shadow-lg flex justify-between items-center">
        <span className="font-semibold text-stone-200">
          {selectedDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <span className="bg-stone-800 text-stone-300 text-sm px-3 py-1 rounded-lg">
          {currentTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
        </span>
      </div>

      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search member by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-lg py-3 pl-10 pr-4 focus:ring-orange-500 focus:border-orange-500 transition"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon type="search" className="w-5 h-5 text-stone-400" />
        </div>
      </div>

      <div className="flex justify-end items-center mb-4">
        <button
          onClick={markAllPresent}
          disabled={selectedDate > today}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg shadow hover:bg-orange-700 transition-colors disabled:bg-stone-700 disabled:cursor-not-allowed"
        >
          Mark All Present
        </button>
      </div>

      <div className="space-y-3">
        {sortedAndFilteredMembers.map(member => {
            const currentStatus = attendanceForSelectedDate[member.id] || AttendanceStatus.Absent;
            
            const isPresent = currentStatus === AttendanceStatus.Present;
            const isHalfDay = currentStatus === AttendanceStatus.HalfDay;
            const isAbsent = !isPresent && !isHalfDay;

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
              presentToggleIcon = 'check';
            }

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
                    disabled={selectedDate > today}
                  >
                    <Icon type={presentToggleIcon} className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleMarkHalfDay(member.id)}
                    className={`${baseButtonClasses} ${halfDayClasses}`}
                    aria-label="Mark as Half Day"
                    disabled={selectedDate > today}
                  >
                    <Icon type="halfday" className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
        })}
      </div>
      
      <button
        onClick={triggerDateInput}
        className="fixed bottom-20 right-4 w-14 h-14 bg-white text-stone-950 rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-stone-200 active:bg-stone-300 transition-colors"
        aria-label="Open calendar"
      >
        <Icon type="calendar" className="w-7 h-7" />
      </button>
      
      <input
        type="date"
        ref={dateInputRef}
        value={selectedDateString}
        onChange={handleDateInputChange}
        max={todayString}
        className="opacity-0 w-0 h-0 absolute"
      />
    </div>
  );
};