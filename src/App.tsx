import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Timetable } from './components/Timetable';
import { CoursesHub } from './components/CoursesHub';
import { NotesStudio } from './components/NotesStudio';
import { NoteEditor } from './components/NoteEditor';
import { PlannerView } from './components/PlannerView';
import { FilesHub } from './components/FilesHub';
import { SettingsView } from './components/SettingsView';
import { SearchModal } from './components/SearchModal';
import { LandingPage } from './components/LandingPage';
import { SparkleCursor } from './components/SparkleCursor';
import { ActiveTab } from './types';
import { Menu, Plus, Search, Sun, Moon, LogOut, AlertCircle, X } from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function MainApp() {
  const { data, addNote, isDarkMode, toggleDarkMode, isGuestMode, setIsGuestMode, setCurrentUserEmail } = useWorkspace();

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('bibi_is_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [landingDefaultPage, setLandingDefaultPage] = useState<'home' | 'about' | 'contact' | 'login' | 'signup'>('home');

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync guest mode state & Firebase auth listener on initial load
  useEffect(() => {
    try {
      if (localStorage.getItem('bibi_is_guest') === 'true') {
        setIsGuestMode(true);
      }
    } catch {
      // fallback
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        if (user.email) {
          setCurrentUserEmail(user.email);
        }
        try {
          localStorage.setItem('bibi_is_logged_in', 'true');
        } catch {
          // ignore
        }
      }
    });

    return () => unsubscribe();
  }, [setIsGuestMode, setCurrentUserEmail]);

  // Scroll to top automatically when active tab or login state changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, isLoggedIn]);

  const handleLogin = (userName?: string) => {
    try {
      localStorage.setItem('bibi_is_logged_in', 'true');
    } catch {
      // fallback
    }
    setIsLoggedIn(true);
    setActiveTab('dashboard');
  };

  const handleRequestLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    try {
      localStorage.removeItem('bibi_is_logged_in');
      localStorage.removeItem('bibi_is_guest');
      localStorage.removeItem('bibi_current_user_email');
    } catch {
      // fallback
    }
    setCurrentUserEmail('');
    signOut(auth).catch((err) => console.warn("Firebase SignOut notice:", err));
    setIsLoggedIn(false);
    setIsGuestMode(false);
    setShowLogoutModal(false);
    setLandingDefaultPage('home');
  };

  if (!isLoggedIn) {
    return (
      <LandingPage
        onLogin={handleLogin}
        defaultPage={landingDefaultPage}
      />
    );
  }

  const handleCreateNewNote = (courseId?: string) => {
    const newId = addNote({
      title: 'New Note',
      courseId,
      tags: ['Study']
    });
    setSelectedNoteId(newId);
    setActiveTab('note-detail');
  };

  const handleSelectNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setActiveTab('note-detail');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-black text-[#021A54] dark:text-zinc-100 flex flex-col font-sans selection:bg-[#FFCEE3]">
      <SparkleCursor />
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedNoteId={selectedNoteId}
        onSelectNote={handleSelectNote}
        onNewNote={() => handleCreateNewNote()}
        onOpenSearch={() => setIsSearchOpen(true)}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={handleRequestLogout}
      />

      {/* Main Content Area */}
      <div className={`
        flex-1 transition-all duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-16'}
      `}>
        {/* Guest Mode Non-Persistent Session Banner */}
        {isGuestMode && (
          <div className="bg-amber-100/90 dark:bg-amber-950/80 border-b border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 px-4 sm:px-8 py-2.5 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs z-30 no-print">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Guest Mode:</strong> Any notes or changes are temporary and will <strong>NOT</strong> be saved. Create an account to save your workspace permanently!
              </span>
            </div>
            <button
              onClick={handleRequestLogout}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] whitespace-nowrap shadow-2xs transition-colors shrink-0"
            >
              Sign Up / Log In
            </button>
          </div>
        )}

        {/* Top Navbar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-black/90 backdrop-blur-md border-b border-[#FFCEE3]/50 dark:border-[#222222] px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl sm:rounded-2xl hover:bg-[#FFCEE3]/30 dark:hover:bg-[#1A1A1A] text-[#021A54] dark:text-zinc-100 transition-colors shrink-0"
              title="Toggle Menu"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb Title */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-[#021A54] dark:text-zinc-100 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#FF85BB] shrink-0" />
              <span className="truncate max-w-[100px] xs:max-w-[160px] sm:max-w-none">
                {activeTab === 'timetable'
                  ? 'Schedule'
                  : activeTab === 'courses'
                  ? 'Courses'
                  : activeTab === 'notes'
                  ? 'Notes'
                  : activeTab === 'planner'
                  ? 'Tasks & Planner'
                  : activeTab === 'files'
                  ? 'Course Files'
                  : activeTab === 'dashboard'
                  ? 'Dashboard'
                  : activeTab === 'settings'
                  ? 'Settings'
                  : activeTab === 'note-detail'
                  ? 'Note'
                  : (activeTab as string).replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl sm:rounded-2xl bg-[#F5F5F5] dark:bg-[#121212] hover:bg-[#FFCEE3]/30 dark:hover:bg-[#222222] text-[#021A54] dark:text-zinc-100 border border-transparent dark:border-[#222222] transition-colors shrink-0"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={15} className="text-amber-400 sm:w-[16px] sm:h-[16px]" /> : <Moon size={15} className="text-[#021A54] sm:w-[16px] sm:h-[16px]" />}
            </button>

            {/* Quick Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl bg-[#F5F5F5] dark:bg-[#121212] hover:bg-[#FFCEE3]/30 dark:hover:bg-[#222222] text-[#021A54] dark:text-zinc-100 border border-transparent dark:border-[#222222] transition-colors flex items-center gap-2 text-xs font-semibold shrink-0"
              title="Search Workspace"
            >
              <Search size={14} className="text-[#FF85BB]" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline text-[9px] bg-white dark:bg-[#1A1A1A] px-1.5 py-0.5 rounded-md border border-[#021A54]/10 dark:border-[#333333] text-[#021A54]/50 dark:text-zinc-400">
                ⌘K
              </kbd>
            </button>

            {/* Quick Add Note */}
            <button
              onClick={() => handleCreateNewNote()}
              className="p-2 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-[#FFCEE3] dark:bg-[#321323] hover:bg-[#FF85BB] text-[#021A54] dark:text-[#FFB3D1] hover:text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 border border-transparent dark:border-[#4A2038] shrink-0"
              title="Create New Note"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">New Note</span>
            </button>

            {/* Log Out Button */}
            <button
              onClick={handleRequestLogout}
              className="p-2 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl bg-white dark:bg-[#121212] hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 border border-[#FFCEE3] dark:border-[#222222] transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0"
              title="Log Out & Return to Landing Page"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </header>

        {/* View Pages */}
        <main className="p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1 overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              onSelectNote={handleSelectNote}
              onNewNote={() => handleCreateNewNote()}
            />
          )}

          {activeTab === 'timetable' && (
            <Timetable />
          )}

          {activeTab === 'courses' && (
            <CoursesHub
              onOpenNote={handleSelectNote}
              onCreateNoteForCourse={(courseId) => handleCreateNewNote(courseId)}
            />
          )}

          {activeTab === 'notes' && (
            <NotesStudio
              onSelectNote={handleSelectNote}
              onNewNote={(courseId) => handleCreateNewNote(courseId)}
            />
          )}

          {activeTab === 'note-detail' && selectedNoteId && (
            <NoteEditor
              noteId={selectedNoteId}
              onBack={() => setActiveTab('notes')}
            />
          )}

          {activeTab === 'planner' && (
            <PlannerView />
          )}

          {activeTab === 'files' && (
            <FilesHub />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        setActiveTab={setActiveTab}
        onSelectNote={handleSelectNote}
      />

      {/* Log Out Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#121212] border border-[#FFCEE3] dark:border-[#222222] rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative space-y-5"
            >
              <button
                onClick={() => setShowLogoutModal(false)}
                className="absolute top-4 right-4 p-2 rounded-2xl hover:bg-[#FFF0F6] dark:hover:bg-[#222226] text-[#021A54]/60 dark:text-zinc-400 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-500 flex items-center justify-center mx-auto shadow-xs border border-red-200 dark:border-red-900">
                  <LogOut size={24} />
                </div>
                <h3 className="text-xl font-black text-[#021A54] dark:text-white">
                  Log Out of Workspace?
                </h3>
                <p className="text-xs text-[#021A54]/70 dark:text-zinc-300 leading-relaxed">
                  Are you sure you want to log out?
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleConfirmLogout}
                  className="w-full py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <LogOut size={15} />
                  <span>Yes, Log Out</span>
                </button>

                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="w-full py-3 rounded-2xl bg-[#FFF0F6] dark:bg-[#1E1E22] text-[#021A54] dark:text-zinc-100 font-semibold text-xs hover:bg-[#FFCEE3]/50 dark:hover:bg-[#2A2A30] transition-all border border-[#FFCEE3] dark:border-[#222222]"
                >
                  Cancel & Stay in Workspace
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <MainApp />
    </WorkspaceProvider>
  );
}
