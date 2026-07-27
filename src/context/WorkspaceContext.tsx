import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { WorkspaceData, WorkspaceSettings, Course, TimetableSlot, Note, QuickTask, CountdownItem, CourseFile } from '../types';
import { INITIAL_WORKSPACE_DATA } from '../data/initialData';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

const STORAGE_KEY = 'CUTE_NOTION_WORKSPACE_DATA_V1';

interface WorkspaceContextType {
  data: WorkspaceData;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  updateSettings: (settings: Partial<WorkspaceSettings>) => void;
  currentUserEmail: string;
  setCurrentUserEmail: (email: string) => void;
  // Courses
  addCourse: (course: Omit<Course, 'id'>) => string;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  // Timetable
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  updateTimetableSlot: (slot: TimetableSlot) => void;
  deleteTimetableSlot: (id: string) => void;
  // Notes
  addNote: (note?: Partial<Note>) => string;
  updateNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  // Quick Tasks
  addQuickTask: (task: Omit<QuickTask, 'id' | 'completed'>) => void;
  updateQuickTask: (task: QuickTask) => void;
  toggleQuickTask: (id: string) => void;
  deleteQuickTask: (id: string) => void;
  clearCompletedQuickTasks: () => void;
  addTaskCategory: (category: string) => void;
  removeTaskCategory: (category: string) => void;
  // Countdowns
  addCountdown: (cd: Omit<CountdownItem, 'id'>) => void;
  deleteCountdown: (id: string) => void;
  // Files
  addCourseFile: (file: Omit<CourseFile, 'id' | 'uploadedAt'>) => void;
  deleteCourseFile: (id: string) => void;
  // System & Cloud Database
  isGuestMode: boolean;
  setIsGuestMode: (isGuest: boolean) => void;
  isCloudSynced: boolean;
  resetToDefaults: () => void;
  exportJSON: () => void;
  importJSON: (jsonStr: string) => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const getStoredEmail = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('bibi_current_user_email') || '';
  } catch {
    return '';
  }
};

const getAccountDocId = (email: string): string => {
  const clean = email.trim().toLowerCase();
  if (clean) {
    return clean.replace(/[^a-z0-9]/g, '_');
  }
  return 'default_user';
};

const getAccountStorageKey = (docId: string): string => {
  return `CUTE_NOTION_WORKSPACE_DATA_V1_${docId}`;
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [currentUserEmail, setCurrentUserEmailState] = useState<string>(getStoredEmail);
  const isInitialCloudLoadRef = useRef(false);

  const activeDocId = getAccountDocId(currentUserEmail);
  const activeStorageKey = getAccountStorageKey(activeDocId);

  const [data, setData] = useState<WorkspaceData>(() => {
    try {
      const email = getStoredEmail();
      const docId = getAccountDocId(email);
      const userKey = getAccountStorageKey(docId);
      
      const savedUserKey = localStorage.getItem(userKey);
      if (savedUserKey) {
        const parsed = JSON.parse(savedUserKey);
        if (parsed && parsed.courses && parsed.notes) {
          return parsed;
        }
      }

      const savedDefault = localStorage.getItem(STORAGE_KEY);
      if (savedDefault) {
        const parsed = JSON.parse(savedDefault);
        if (parsed && parsed.courses && parsed.notes) {
          return parsed;
        }
      }
    } catch (err) {
      console.error("Failed loading workspace state from localStorage", err);
    }
    return INITIAL_WORKSPACE_DATA;
  });

  // Helper to remove undefined properties before saving to Firestore (Firestore rejects undefined)
  const sanitizeForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(sanitizeForFirestore);
    }
    if (typeof obj === 'object') {
      const cleanObj: Record<string, any> = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val !== undefined) {
          cleanObj[key] = sanitizeForFirestore(val);
        }
      }
      return cleanObj;
    }
    return obj;
  };

  // Immediate synchronous & cloud save function to prevent data loss on reload/logout
  const saveDataToCloudAndLocal = (
    targetData: WorkspaceData,
    targetDocId: string = activeDocId,
    targetEmail: string = currentUserEmail
  ) => {
    if (!targetDocId || targetDocId === 'default_user' && !targetEmail) {
      // Local storage save for guest/default
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(targetData));
      } catch {}
      return;
    }

    const cleanEmail = (targetEmail || '').trim().toLowerCase();

    // 1. Save immediately to LocalStorage under user-specific key & global fallback key
    try {
      const storageKey = getAccountStorageKey(targetDocId);
      localStorage.setItem(storageKey, JSON.stringify(targetData));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(targetData));

      if (cleanEmail) {
        localStorage.setItem('bibi_current_user_email', cleanEmail);

        // Keep registered users cache strictly in sync with the saved display name
        const registeredUsersStr = localStorage.getItem('bibi_registered_users') || '[]';
        let registeredUsers: any[] = [];
        try { registeredUsers = JSON.parse(registeredUsersStr); } catch {}
        if (Array.isArray(registeredUsers)) {
          const foundIdx = registeredUsers.findIndex((u: any) => u.email && u.email.toLowerCase() === cleanEmail);
          const newName = targetData.settings.userName || 'User';
          if (foundIdx >= 0) {
            registeredUsers[foundIdx] = { ...registeredUsers[foundIdx], name: newName };
          } else {
            registeredUsers.push({ name: newName, email: cleanEmail });
          }
          localStorage.setItem('bibi_registered_users', JSON.stringify(registeredUsers));
        }
      }
    } catch (err) {
      console.warn("Failed saving workspace state to localStorage:", err);
    }

    // 2. Clear any pending debounced save timer
    if (cloudSaveTimerRef.current) {
      clearTimeout(cloudSaveTimerRef.current);
      cloudSaveTimerRef.current = null;
    }

    // 3. Save to Cloud Firestore
    if (db && !isQuotaExceededRef.current && !isGuestMode) {
      try {
        const cleanedData = sanitizeForFirestore(targetData);
        const docRef = doc(db, 'userWorkspaces', targetDocId);

        setDoc(docRef, {
          userId: targetDocId,
          userEmail: cleanEmail,
          userName: targetData.settings.userName || 'default_user',
          data: cleanedData,
          updatedAt: new Date().toISOString()
        }, { merge: true })
          .then(() => setIsCloudSynced(true))
          .catch((err) => {
            if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
              isQuotaExceededRef.current = true;
            }
            setIsCloudSynced(false);
          });

        if (cleanEmail) {
          const userDocRef = doc(db, 'users', targetDocId);
          setDoc(userDocRef, {
            name: targetData.settings.userName || 'User',
            email: cleanEmail,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch((err) => {
            if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
              isQuotaExceededRef.current = true;
            }
          });
        }
      } catch (err) {
        console.warn("Failed saving data to Firestore:", err);
      }
    }
  };

  const setCurrentUserEmail = (email: string) => {
    const clean = email.trim().toLowerCase();

    // CRITICAL FIX: Flush current user's workspace & profile data to LocalStorage + Cloud BEFORE switching/logging out
    if (currentUserEmail && currentUserEmail !== clean && data) {
      const prevDocId = getAccountDocId(currentUserEmail);
      saveDataToCloudAndLocal(data, prevDocId, currentUserEmail);
    }

    setCurrentUserEmailState(clean);
    try {
      if (clean) {
        localStorage.setItem('bibi_current_user_email', clean);
      } else {
        localStorage.removeItem('bibi_current_user_email');
      }
    } catch {}

    const docId = getAccountDocId(clean);
    const userKey = getAccountStorageKey(docId);

    if (clean) {
      try {
        const saved = localStorage.getItem(userKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.courses && parsed.notes) {
            setData(parsed);
            return;
          }
        }

        // If no local storage data for this user email yet, find matched user name from cache
        const registeredUsersStr = localStorage.getItem('bibi_registered_users') || '[]';
        let matchedName = 'User';
        try {
          const regList = JSON.parse(registeredUsersStr);
          const found = regList.find((u: any) => u.email && u.email.toLowerCase() === clean);
          if (found && found.name) matchedName = found.name;
        } catch {}

        setData({
          ...INITIAL_WORKSPACE_DATA,
          settings: {
            ...INITIAL_WORKSPACE_DATA.settings,
            userName: matchedName,
            userAvatar: matchedName.charAt(0).toUpperCase() || 'U'
          }
        });
      } catch (err) {
        console.error("Error setting user workspace:", err);
      }
    } else {
      // Logout - reset to fresh initial workspace
      setData(INITIAL_WORKSPACE_DATA);
    }
  };

  const isRemoteUpdateRef = useRef<boolean>(false);
  const isQuotaExceededRef = useRef<boolean>(false);
  const cloudSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen / sync from Firestore Cloud Database when user is logged in (and not guest)
  useEffect(() => {
    if (isGuestMode || !db || !currentUserEmail) return;

    try {
      const docRef = doc(db, 'userWorkspaces', activeDocId);
      
      // Real-time listener from Firestore database with metadata tracking
      const unsubscribe = onSnapshot(docRef, { includeMetadataChanges: true }, async (snapshot) => {
        // Skip uncommitted local pending writes to prevent race conditions
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }

        if (snapshot.exists()) {
          const cloudPayload = snapshot.data();
          if (cloudPayload && cloudPayload.data) {
            let cloudWorkspace = cloudPayload.data as WorkspaceData;

            // Determine the best personalized name across sources
            let bestName = cloudWorkspace.settings?.userName;

            // 1. Check cloudPayload top-level userName
            if ((!bestName || bestName === 'User' || bestName === 'default_user') &&
                cloudPayload.userName && cloudPayload.userName !== 'User' && cloudPayload.userName !== 'default_user') {
              bestName = cloudPayload.userName;
            }

            // 2. Check local registered accounts cache
            if (!bestName || bestName === 'User' || bestName === 'default_user') {
              try {
                const regStr = localStorage.getItem('bibi_registered_users') || '[]';
                const regList = JSON.parse(regStr);
                const found = Array.isArray(regList) && regList.find((u: any) => u.email && u.email.toLowerCase() === currentUserEmail.toLowerCase());
                if (found && found.name && found.name !== 'User') {
                  bestName = found.name;
                }
              } catch {}
            }

            // 3. Check Firebase Auth user display name
            if ((!bestName || bestName === 'User' || bestName === 'default_user') &&
                auth.currentUser?.displayName && auth.currentUser.displayName !== 'User') {
              bestName = auth.currentUser.displayName;
            }

            // 4. Check Firestore users/${activeDocId} document
            if (!bestName || bestName === 'User' || bestName === 'default_user') {
              try {
                const userDocRef = doc(db, 'users', activeDocId);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists() && userSnap.data()?.name && userSnap.data().name !== 'User') {
                  bestName = userSnap.data().name;
                }
              } catch (err) {
                console.warn("Notice checking user doc:", err);
              }
            }

            // If we found a personalized name that is better than 'User', preserve and inject it
            if (bestName && bestName !== 'User' && bestName !== 'default_user' && bestName !== cloudWorkspace.settings?.userName) {
              cloudWorkspace = {
                ...cloudWorkspace,
                settings: {
                  ...cloudWorkspace.settings,
                  userName: bestName,
                  userAvatar: bestName.charAt(0).toUpperCase() || cloudWorkspace.settings?.userAvatar || 'U'
                }
              };
              // Save updated doc back to cloud so future reads are accurate
              saveDataToCloudAndLocal(cloudWorkspace, activeDocId, currentUserEmail);
            }

            isRemoteUpdateRef.current = true;
            setData(cloudWorkspace);
            setIsCloudSynced(true);
          }
        }
      }, (err) => {
        if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
          isQuotaExceededRef.current = true;
        }
        setIsCloudSynced(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Failed setting up Firestore listener:", err);
    }
  }, [activeDocId, isGuestMode, currentUserEmail]);

  // Dark Mode state sync
  const isDarkMode = Boolean(data.settings.darkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !isDarkMode });
  };

  // Save to localStorage & Cloud Firestore whenever data changes (unless in temporary Guest Mode)
  useEffect(() => {
    if (isGuestMode) {
      setIsCloudSynced(false);
      return;
    }

    try {
      localStorage.setItem(activeStorageKey, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("Failed saving workspace state to localStorage", err);
    }

    // Skip cloud write if updated from cloud snapshot
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    if (isQuotaExceededRef.current || !db) {
      return;
    }

    // Debounce Firestore writes to prevent rapid calls and quota limits
    if (cloudSaveTimerRef.current) {
      clearTimeout(cloudSaveTimerRef.current);
    }

    cloudSaveTimerRef.current = setTimeout(() => {
      saveDataToCloudAndLocal(data, activeDocId, currentUserEmail);
    }, 1200);

    return () => {
      if (cloudSaveTimerRef.current) {
        clearTimeout(cloudSaveTimerRef.current);
      }
    };
  }, [data, isGuestMode, activeDocId, activeStorageKey, currentUserEmail]);

  const updateSettings = (settingsUpdate: Partial<WorkspaceSettings>) => {
    setData(prev => {
      const updated = {
        ...prev,
        settings: { ...prev.settings, ...settingsUpdate }
      };
      saveDataToCloudAndLocal(updated, activeDocId, currentUserEmail);
      return updated;
    });
  };

  // --- Courses ---
  const addCourse = (courseData: Omit<Course, 'id'>): string => {
    const newId = 'course-' + Date.now();
    const newCourse: Course = { ...courseData, id: newId };
    
    // Auto-generate timetable slots for meeting days specified in the course
    const generatedSlots: TimetableSlot[] = (courseData.days || []).map((day, idx) => ({
      id: 'tt-' + Date.now() + '-' + idx,
      day,
      startTime: courseData.startTime || '09:00',
      endTime: courseData.endTime || '10:00',
      courseId: newId,
      customColor: courseData.color
    }));

    setData(prev => ({
      ...prev,
      courses: [...prev.courses, newCourse],
      timetableSlots: [...prev.timetableSlots, ...generatedSlots]
    }));
    return newId;
  };

  const updateCourse = (updated: Course) => {
    setData(prev => {
      // Update custom colors or times on timetable slots associated with this course
      const updatedSlots = prev.timetableSlots.map(slot => {
        if (slot.courseId === updated.id) {
          return {
            ...slot,
            customColor: updated.color
          };
        }
        return slot;
      });

      return {
        ...prev,
        courses: prev.courses.map(c => c.id === updated.id ? updated : c),
        timetableSlots: updatedSlots
      };
    });
  };

  const deleteCourse = (id: string) => {
    setData(prev => ({
      ...prev,
      courses: prev.courses.filter(c => c.id !== id),
      // Also clear course associations in timetable slots
      timetableSlots: prev.timetableSlots.map(slot => {
        if (slot.courseId === id) {
          const { courseId, ...rest } = slot;
          return rest;
        }
        return slot;
      })
    }));
  };

  // --- Timetable ---
  const addTimetableSlot = (slotData: Omit<TimetableSlot, 'id'>) => {
    const newSlot: TimetableSlot = { ...slotData, id: 'tt-' + Date.now() };
    setData(prev => ({
      ...prev,
      timetableSlots: [...prev.timetableSlots, newSlot]
    }));
  };

  const updateTimetableSlot = (updated: TimetableSlot) => {
    setData(prev => ({
      ...prev,
      timetableSlots: prev.timetableSlots.map(s => s.id === updated.id ? updated : s)
    }));
  };

  const deleteTimetableSlot = (id: string) => {
    setData(prev => ({
      ...prev,
      timetableSlots: prev.timetableSlots.filter(s => s.id !== id)
    }));
  };

  // --- Notes ---
  const addNote = (noteData?: Partial<Note>): string => {
    const newId = 'note-' + Date.now();
    const now = new Date().toISOString().split('T')[0];
    const newNote: Note = {
      id: newId,
      title: noteData?.title || 'Untitled Note',
      icon: noteData?.icon || '📝',
      tags: noteData?.tags || ['General'],
      pinned: noteData?.pinned || false,
      archived: false,
      courseId: noteData?.courseId,
      createdAt: now,
      updatedAt: now,
      blocks: noteData?.blocks || [
        { id: 'b-' + Date.now() + '-1', type: 'heading-1', content: noteData?.title || 'Untitled Note' },
        { id: 'b-' + Date.now() + '-2', type: 'paragraph', content: 'Start typing here...' }
      ]
    };

    setData(prev => ({
      ...prev,
      notes: [newNote, ...prev.notes]
    }));
    return newId;
  };

  const updateNote = (updated: Note) => {
    const now = new Date().toISOString().split('T')[0];
    setData(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === updated.id ? { ...updated, updatedAt: now } : n)
    }));
  };

  const deleteNote = (id: string) => {
    setData(prev => ({
      ...prev,
      notes: prev.notes.filter(n => n.id !== id)
    }));
  };

  const togglePinNote = (id: string) => {
    setData(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n)
    }));
  };

  // --- Quick Tasks ---
  const addQuickTask = (taskData: Omit<QuickTask, 'id' | 'completed'>) => {
    const newTask: QuickTask = {
      ...taskData,
      id: 'qt-' + Date.now(),
      completed: false
    };
    setData(prev => ({
      ...prev,
      quickTasks: [newTask, ...prev.quickTasks]
    }));
  };

  const updateQuickTask = (updatedTask: QuickTask) => {
    setData(prev => ({
      ...prev,
      quickTasks: prev.quickTasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    }));
  };

  const toggleQuickTask = (id: string) => {
    setData(prev => ({
      ...prev,
      quickTasks: prev.quickTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
  };

  const deleteQuickTask = (id: string) => {
    setData(prev => ({
      ...prev,
      quickTasks: prev.quickTasks.filter(t => t.id !== id)
    }));
  };

  const clearCompletedQuickTasks = () => {
    setData(prev => ({
      ...prev,
      quickTasks: prev.quickTasks.filter(t => !t.completed)
    }));
  };

  const addTaskCategory = (category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return;
    setData(prev => {
      const current = prev.settings.taskCategories || ["Academic", "Assignment", "Exam Prep", "Personal", "Project"];
      if (current.includes(trimmed)) return prev;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          taskCategories: [...current, trimmed]
        }
      };
    });
  };

  const removeTaskCategory = (categoryToRemove: string) => {
    setData(prev => {
      const current = prev.settings.taskCategories || ["Academic", "Assignment", "Exam Prep", "Personal", "Project"];
      return {
        ...prev,
        settings: {
          ...prev.settings,
          taskCategories: current.filter(c => c !== categoryToRemove)
        }
      };
    });
  };

  // --- Countdowns ---
  const addCountdown = (cdData: Omit<CountdownItem, 'id'>) => {
    const newCd: CountdownItem = { ...cdData, id: 'cd-' + Date.now() };
    setData(prev => ({
      ...prev,
      countdowns: [...prev.countdowns, newCd]
    }));
  };

  const deleteCountdown = (id: string) => {
    setData(prev => ({
      ...prev,
      countdowns: prev.countdowns.filter(c => c.id !== id)
    }));
  };

  // --- Files ---
  const addCourseFile = (fileData: Omit<CourseFile, 'id' | 'uploadedAt'>) => {
    const newFile: CourseFile = {
      ...fileData,
      id: 'file-' + Date.now(),
      uploadedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    setData(prev => ({
      ...prev,
      courseFiles: [newFile, ...(prev.courseFiles || [])]
    }));
  };

  const deleteCourseFile = (id: string) => {
    setData(prev => ({
      ...prev,
      courseFiles: (prev.courseFiles || []).filter(f => f.id !== id)
    }));
  };

  // --- System ---
  const resetToDefaults = () => {
    const freshData: WorkspaceData = JSON.parse(JSON.stringify(INITIAL_WORKSPACE_DATA));
    setData(freshData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
    } catch (err) {
      console.error("Failed writing reset data to localStorage", err);
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cute_Notion_Workspace_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        const mergedData: WorkspaceData = {
          settings: { ...INITIAL_WORKSPACE_DATA.settings, ...(parsed.settings || {}) },
          courses: Array.isArray(parsed.courses) ? parsed.courses : [],
          timetableSlots: Array.isArray(parsed.timetableSlots) ? parsed.timetableSlots : [],
          notes: Array.isArray(parsed.notes) ? parsed.notes : [],
          quickTasks: Array.isArray(parsed.quickTasks) ? parsed.quickTasks : [],
          countdowns: Array.isArray(parsed.countdowns) ? parsed.countdowns : []
        };
        setData(mergedData);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedData));
        } catch (err) {
          console.error("Failed saving imported JSON to localStorage", err);
        }
        return true;
      }
    } catch (e) {
      console.error("Invalid JSON import:", e);
    }
    return false;
  };

  return (
    <WorkspaceContext.Provider value={{
      data,
      isDarkMode,
      toggleDarkMode,
      updateSettings,
      currentUserEmail,
      setCurrentUserEmail,
      addCourse,
      updateCourse,
      deleteCourse,
      addTimetableSlot,
      updateTimetableSlot,
      deleteTimetableSlot,
      addNote,
      updateNote,
      deleteNote,
      togglePinNote,
      addQuickTask,
      updateQuickTask,
      toggleQuickTask,
      deleteQuickTask,
      clearCompletedQuickTasks,
      addTaskCategory,
      removeTaskCategory,
      addCountdown,
      deleteCountdown,
      addCourseFile,
      deleteCourseFile,
      isGuestMode,
      setIsGuestMode,
      isCloudSynced,
      resetToDefaults,
      exportJSON,
      importJSON
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
