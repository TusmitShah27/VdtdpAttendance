import firebase from 'firebase/compat/app';
import { useState, useCallback, useEffect } from 'react';
import { Member, AttendanceData, AttendanceStatus } from '../../types';
import { db } from '../services/firebase';


const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

export const useMembers = () => {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData>({});
  
  useEffect(() => {
    setLoading(true);
    const membersCollection = db.collection('members');
    const q = membersCollection.orderBy('createdAt', 'desc');
    
    const unsubscribe = q.onSnapshot((querySnapshot) => {
      const fetchedMembers: Member[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = (data.createdAt as firebase.firestore.Timestamp)?.toDate().toISOString() ?? new Date().toISOString();
        fetchedMembers.push({ id: doc.id, ...data, createdAt } as Member);
      });
      setMembers(fetchedMembers);
      if (querySnapshot.empty) {
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching members:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (members.length === 0) {
      setAttendance({});
      // If members are empty after initial load, stop loading.
      if (loading) setLoading(false);
      return;
    };

    const d = new Date();
    d.setDate(d.getDate() - 30); // fetch last 30 days of attendance
    const dateStr = d.toISOString().split('T')[0];
    
    const attendanceCollectionRef = db.collection("attendance");
    const q = attendanceCollectionRef.where("date", ">=", dateStr);

    const unsubscribe = q.onSnapshot((snapshot) => {
        const newAttendanceData: AttendanceData = {};
        members.forEach(m => newAttendanceData[m.id] = {});

        snapshot.forEach(doc => {
            const record = doc.data();
            if (record.memberId && newAttendanceData.hasOwnProperty(record.memberId)) {
              let status = record.status;
              // For backward compatibility, map old 'leave' status to 'halfday'
              if (status === 'leave') {
                status = AttendanceStatus.HalfDay;
              }
              newAttendanceData[record.memberId][record.date] = status;
            }
        });
        setAttendance(newAttendanceData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching attendance:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [members]);


  const addMember = useCallback(async (name: string, instrument: string) => {
    await db.collection('members').add({
      name,
      instrument,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }, []);
  
  const addMultipleMembers = useCallback(async (newMembers: {name: string, instrument: string}[]) => {
    const batch = db.batch();
    const membersColRef = db.collection('members');

    newMembers.forEach(member => {
        const newDocRef = membersColRef.doc();
        batch.set(newDocRef, {
            ...member,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    });

    await batch.commit();
  }, []);

  const updateMember = useCallback(async (memberId: string, name: string, instrument: string) => {
    const memberRef = db.collection('members').doc(memberId);
    await memberRef.update({ name, instrument });
  }, []);

  const markAttendanceForDate = useCallback(async (statuses: Record<string, AttendanceStatus>, date: string) => {
    const attendanceColRef = db.collection('attendance');
    const batch = db.batch();
    
    const promises = Object.entries(statuses).map(async ([memberId, status]) => {
        const q = attendanceColRef.where('memberId', '==', memberId).where('date', '==', date);
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            const newDocRef = attendanceColRef.doc(); // Creates a new doc reference with a random ID
            batch.set(newDocRef, { memberId, date: date, status });
        } else {
            const docRef = querySnapshot.docs[0].ref;
            batch.update(docRef, { status });
        }
    });
    
    await Promise.all(promises);
    await batch.commit();
  }, []);

  const getMemberById = useCallback((id: string) => {
    return members.find(m => m.id === id);
  }, [members]);

  const getAttendanceByMember = useCallback((memberId: string) => {
    return attendance[memberId] || {};
  }, [attendance]);
  
  const getWeeklySummary = useCallback(() => {
    const summary: { name: string, present: number, absent: number, halfDay: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        let present = 0;
        let halfDay = 0;

        members.forEach(member => {
            const status = attendance[member.id]?.[dateString];
            if (status === AttendanceStatus.Present) present++;
            else if (status === AttendanceStatus.HalfDay) halfDay++;
        });
        
        const absent = members.length - present - halfDay;
        summary.push({ name: dayName, present, absent, halfDay });
    }
    return summary;
  }, [members, attendance]);

  const getTodaySummary = useCallback(() => {
    const todayString = getTodayDateString();
    let present = 0;
    let onHalfDay = 0;
    const total = members.length;
    
    members.forEach(member => {
      const status = attendance[member.id]?.[todayString];
      if (status === AttendanceStatus.Present) present++;
      else if (status === AttendanceStatus.HalfDay) onHalfDay++;
    });
    
    const absent = total - present - onHalfDay;
    
    return { present, absent, onHalfDay, total };
  }, [members, attendance]);

  const generateCsvReport = useCallback((days: number): string => {
    const statusMap = {
      [AttendanceStatus.Present]: 'P',
      [AttendanceStatus.Absent]: 'A',
      [AttendanceStatus.HalfDay]: 'H',
    };

    const header = ['Member Name', 'Instrument'];
    const dates: string[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    
    header.push(...dates);
    
    const rows = members.map(member => {
        const rowData: string[] = [
            member.name,
            member.instrument
        ];
        
        const memberAttendance = attendance[member.id] || {};
        
        dates.forEach(date => {
            const status = memberAttendance[date] || AttendanceStatus.Absent;
            const shortStatus = statusMap[status] || 'A';
            rowData.push(shortStatus);
        });
        
        // Escape commas and quotes for CSV
        return rowData.map(d => `"${String(d).replace(/"/g, '""')}"`).join(',');
    });
    
    return [header.join(','), ...rows].join('\n');
  }, [members, attendance]);


  return {
    loading,
    members,
    attendance,
    addMember,
    addMultipleMembers,
    updateMember,
    markAttendanceForDate,
    getMemberById,
    getAttendanceByMember,
    getWeeklySummary,
    getTodaySummary,
    generateCsvReport
  };
};