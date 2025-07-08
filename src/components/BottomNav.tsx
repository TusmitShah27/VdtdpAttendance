import React from 'react';
import { View } from '../../types';
import { Icon } from './Icon';

interface BottomNavProps {
  currentView: View;
  setView: (view: View) => void;
}

const NavItem: React.FC<{
  label: string;
  view: View;
  iconType: 'dashboard' | 'attendance' | 'add';
  currentView: View;
  onClick: (view: View) => void;
}> = ({ label, view, iconType, currentView, onClick }) => {
  const isActive = currentView === view;
  const activeClass = 'text-orange-500';
  const inactiveClass = 'text-stone-400 hover:text-stone-100';

  return (
    <button
      onClick={() => onClick(view)}
      className={`flex flex-col items-center justify-center flex-1 transition-colors duration-200 ${isActive ? activeClass : inactiveClass}`}
    >
      <Icon type={iconType} className="w-6 h-6 mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-stone-900 border-t border-stone-800 flex justify-around items-center z-50 shadow-lg">
      <NavItem label="Dashboard" view={View.Dashboard} iconType="dashboard" currentView={currentView} onClick={setView} />
      <NavItem label="Attendance" view={View.Attendance} iconType="attendance" currentView={currentView} onClick={setView} />
      <NavItem label="Add Member" view={View.AddMember} iconType="add" currentView={currentView} onClick={setView} />
    </nav>
  );
};