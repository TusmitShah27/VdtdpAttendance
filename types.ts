
export enum AttendanceStatus {
  Present = 'present',
  Absent = 'absent',
  HalfDay = 'halfday',
}

export interface Member {
  id: string;
  name: string;
  instrument: string;
  createdAt: string;
}

export type AttendanceRecord = {
  [date: string]: AttendanceStatus; // e.g., '2023-10-27'
};

export type AttendanceData = {
  [memberId: string]: AttendanceRecord;
};

export enum View {
  Dashboard = 'DASHBOARD',
  Attendance = 'ATTENDANCE',
  AddMember = 'ADD_MEMBER',
  MemberDetails = 'MEMBER_DETAILS',
}