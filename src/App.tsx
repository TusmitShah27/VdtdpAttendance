import { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { useMembers } from './hooks/useWorkers';
import { View, AttendanceStatus } from '../types';
import { Dashboard } from './components/Dashboard';
import { DailyAttendance } from './components/DailyAttendance';
import { AddMemberForm } from './components/AddWorkerForm';
import { MemberDetails } from './components/WorkerDetails';
import { BottomNav } from './components/BottomNav';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { auth } from './services/firebase';
import { Icon } from './components/Icon';


const getTodayDateString = () => new Date().toISOString().split('T')[0];

export default function App() {
  const [user, setUser] = useState<firebase.User | null>();
  const [currentView, setCurrentView] = useState<View>(View.Dashboard);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  
  const {
    members,
    loading,
    attendance,
    addMember,
    addMultipleMembers,
    updateMember,
    markAttendanceForDate,
    getMemberById,
    getAttendanceByMember,
    getWeeklySummary,
    getTodaySummary,
    generateCsvReport,
  } = useMembers();

  useEffect(() => {
    // PWA install prompt logic
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
      console.log('PWA was installed');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setCurrentView(View.Dashboard);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSetView = (view: View) => {
    setSelectedMemberId(null);
    setCurrentView(view);
  };

  const handleLogout = () => {
    auth.signOut();
  }

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    setCurrentView(View.MemberDetails);
  };
  
  const handleBack = () => {
    handleSetView(View.Dashboard);
  }

  const handleInstallPrompt = async () => {
    if (!installPromptEvent) {
      return;
    }
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, so clear it.
    setInstallPromptEvent(null);
  };

  const renderView = () => {
    switch (currentView) {
      case View.Dashboard:
        return (
          <Dashboard
            loading={loading}
            todaySummary={getTodaySummary()}
            weeklySummary={getWeeklySummary()}
            onLogout={handleLogout}
            members={members}
            onSelectMember={handleSelectMember}
            onGenerateReport={generateCsvReport}
            installPromptEvent={installPromptEvent}
            onInstall={handleInstallPrompt}
          />
        );
      case View.Attendance:
        return <DailyAttendance 
            members={members} 
            attendance={attendance} 
            onSave={markAttendanceForDate} 
        />;
      case View.AddMember:
        return <AddMemberForm onAddMember={addMember} addMultipleMembers={addMultipleMembers} onDone={() => handleSetView(View.Dashboard)} />;
      case View.MemberDetails:
        if (selectedMemberId) {
          const member = getMemberById(selectedMemberId);
          if (member) {
            return <MemberDetails member={member} attendance={getAttendanceByMember(member.id)} onUpdateMember={updateMember} />;
          }
        }
        return <div className="text-center p-4">Member not found</div>; // Fallback
      default:
        return <div>Home</div>;
    }
  };

  if (user === undefined) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950">
            <Icon type="spinner" className="w-12 h-12 text-orange-500" />
            <p className="text-stone-400 mt-4">Initializing...</p>
        </div>
    );
  }
  
  if (!user) {
    return <LoginPage />;
  }
    
  const getHeaderTitle = () => {
    switch (currentView) {
      case View.Dashboard:
        return "Dashboard";
      case View.Attendance:
        return "Mark Attendance";
      case View.AddMember:
        return "Add New Member";
      case View.MemberDetails:
        const member = selectedMemberId ? getMemberById(selectedMemberId) : null;
        return member?.name || "Member Details";
      default:
        return "Vakratund Attendance";
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans">
      {currentView !== View.Dashboard && (
        <Header
          title={getHeaderTitle()}
          showBack={currentView === View.MemberDetails}
          onBack={handleBack}
          onLogout={handleLogout}
        />
      )}
      <main className={`pb-20 ${currentView !== View.Dashboard ? 'pt-16' : ''}`}> {/* Padding top for header, padding bottom for nav */}
        {renderView()}
      </main>
      {currentView !== View.MemberDetails && <BottomNav currentView={currentView} setView={handleSetView} />}
    </div>
  );
}