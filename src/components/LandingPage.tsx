import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Calendar, 
  BookOpen, 
  FileText, 
  CheckSquare, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  Send, 
  CheckCircle2, 
  Shield, 
  Zap, 
  Heart, 
  Code,
  MessageSquare, 
  ChevronDown,
  Sun,
  Moon,
  Sparkle,
  LogIn,
  UserPlus,
  X,
  Copy,
  ExternalLink,
  Check
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { SparkleCursor } from './SparkleCursor';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  updatePassword
} from 'firebase/auth';

interface LandingPageProps {
  onLogin: (userName?: string) => void;
  defaultPage?: 'home' | 'about' | 'contact' | 'login' | 'signup';
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, defaultPage = 'home' }) => {
  const { data, updateSettings, resetToDefaults, isGuestMode, setIsGuestMode, isDarkMode, toggleDarkMode, setCurrentUserEmail } = useWorkspace();
  const [currentPage, setCurrentPage] = useState<'home' | 'about' | 'contact' | 'login' | 'signup'>(defaultPage);

  // Popup modal state for workspace interaction
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalAction, setLoginModalAction] = useState('interact with the workspace');

  // Scroll to top automatically on page change or footer/nav button click
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const navigateToPage = (page: 'home' | 'about' | 'contact' | 'login' | 'signup') => {
    setSignupError('');
    setLoginError('');
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupError, setSignupError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [lastMailtoUrl, setLastMailtoUrl] = useState('');

  // Accordion state for FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const triggerWorkspaceInteraction = (actionName: string = 'interact with the workspace') => {
    setLoginModalAction(actionName);
    setShowLoginModal(true);
  };

  // User Accounts stored in Cloud Firestore database & Firebase Authentication (cross-device enabled)
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = signupName.trim();
    const cleanEmail = signupEmail.trim().toLowerCase();
    const cleanPassword = signupPassword.trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      setSignupError('Please fill in all fields.');
      return;
    }
    setSignupError('');

    // 1. First check local storage cache for existing account
    const existingAccountsStr = localStorage.getItem('bibi_registered_users') || '[]';
    let existingAccounts: any[] = [];
    try { existingAccounts = JSON.parse(existingAccountsStr); } catch {}
    const localExisting = existingAccounts.find((u: any) => u.email && u.email.toLowerCase() === cleanEmail);
    if (localExisting) {
      setSignupError('An account with this email already exists. Please log in.');
      return;
    }

    try {
      // 2. Check if user already exists in Cloud Firestore database
      if (db) {
        try {
          const userDocId = cleanEmail.replace(/[^a-z0-9]/g, '_');
          const userDocRef = doc(db, 'users', userDocId);
          const existingDoc = await getDoc(userDocRef);
          if (existingDoc.exists()) {
            setSignupError('An account with this email already exists. Please log in.');
            return;
          }
        } catch (fsCheckErr) {
          console.warn("Firestore check notice:", fsCheckErr);
        }
      }

      // 3. Try Firebase Auth account creation
      let authUid = '';
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        if (userCredential.user) {
          authUid = userCredential.user.uid;
          await updateProfile(userCredential.user, { displayName: cleanName });
        }
      } catch (authErr: any) {
        console.warn("Firebase Auth Signup notice:", authErr);
        if (authErr.code === 'auth/email-already-in-use' || authErr.message?.includes('already-in-use')) {
          setSignupError('An account with this email already exists. Please log in.');
          return;
        } else if (authErr.code === 'auth/weak-password') {
          setSignupError('Password should be at least 6 characters long.');
          return;
        } else if (authErr.code === 'auth/invalid-email') {
          setSignupError('Please enter a valid email address.');
          return;
        }
      }

      // 4. Save account credentials directly in Cloud Firestore (enables cross-device / multi-website login!)
      if (db) {
        const userDocId = cleanEmail.replace(/[^a-z0-9]/g, '_');
        const userDocRef = doc(db, 'users', userDocId);
        await setDoc(userDocRef, {
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword, // Stored to ensure cross-device login works seamlessly
          uid: authUid || userDocId,
          createdAt: new Date().toISOString()
        }, { merge: true });
      }

      // Local storage backup cache
      const newUser = { name: cleanName, email: cleanEmail, password: cleanPassword };
      localStorage.setItem('bibi_registered_users', JSON.stringify([...existingAccounts.filter((u: any) => u.email !== cleanEmail), newUser]));

      // Reset workspace to clean defaults for new account & set user email
      resetToDefaults();
      setIsGuestMode(false);
      setCurrentUserEmail(cleanEmail);
      updateSettings({
        userName: cleanName,
        userAvatar: cleanName.charAt(0).toUpperCase() || 'U',
      });

      setSignupSuccess(true);
      setTimeout(() => {
        setSignupSuccess(false);
        onLogin(cleanName);
      }, 1000);

    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.code === 'auth/email-already-in-use' || err.message?.includes('already-in-use')) {
        setSignupError('An account with this email already exists. Please log in.');
      } else {
        setSignupError('Failed to create account. Please try again or log in with your email.');
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    if (!cleanEmail || !cleanPassword) {
      setLoginError('Please enter your email and password.');
      return;
    }
    setLoginError('');

    // 1. Try Firebase Authentication
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const user = userCredential.user;
      let matchedName = user.displayName || '';

      if (db) {
        try {
          const userDocId = cleanEmail.replace(/[^a-z0-9]/g, '_');
          const userDocRef = doc(db, 'users', userDocId);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists() && userSnap.data()?.name) {
            matchedName = userSnap.data().name;
          }
        } catch {}
      }

      if (!matchedName) {
        matchedName = user.email?.split('@')[0] || 'User';
      }

      // Sync into local registered accounts cache
      const existingAccountsStr = localStorage.getItem('bibi_registered_users') || '[]';
      let existingAccounts: any[] = [];
      try { existingAccounts = JSON.parse(existingAccountsStr); } catch {}
      localStorage.setItem('bibi_registered_users', JSON.stringify([
        ...existingAccounts.filter((u: any) => u.email !== cleanEmail),
        { name: matchedName, email: cleanEmail }
      ]));

      setIsGuestMode(false);
      setCurrentUserEmail(cleanEmail);

      onLogin(matchedName);
      return;
    } catch (authErr: any) {
      console.warn("Firebase Auth Login notice:", authErr);
      if (authErr.code === 'auth/wrong-password') {
        setLoginError('Incorrect password. Please try again.');
        return;
      }
    }

    // 2. Cloud Firestore Cross-Device Account Lookup (enables login across different devices/browsers)
    try {
      if (db) {
        const userDocId = cleanEmail.replace(/[^a-z0-9]/g, '_');
        const userDocRef = doc(db, 'users', userDocId);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.password && userData.password !== cleanPassword) {
            setLoginError('Incorrect password. Please try again.');
            return;
          }

          const matchedName = userData.name || userData.email?.split('@')[0] || 'User';

          // Cache in local storage for fast offline access
          const existingAccountsStr = localStorage.getItem('bibi_registered_users') || '[]';
          let existingAccounts: any[] = [];
          try { existingAccounts = JSON.parse(existingAccountsStr); } catch {}
          localStorage.setItem('bibi_registered_users', JSON.stringify([
            ...existingAccounts.filter((u: any) => u.email !== cleanEmail),
            { name: matchedName, email: cleanEmail, password: cleanPassword }
          ]));

          setIsGuestMode(false);
          setCurrentUserEmail(cleanEmail);

          onLogin(matchedName);
          return;
        }
      }
    } catch (fsErr) {
      console.warn("Firestore user lookup notice:", fsErr);
    }

    // 3. Fallback to Local Storage backup
    const existingAccountsStr = localStorage.getItem('bibi_registered_users') || '[]';
    let existingAccounts: any[] = [];
    try { existingAccounts = JSON.parse(existingAccountsStr); } catch {}

    const foundUser = existingAccounts.find(
      (u: { email?: string; password?: string; name?: string }) => 
        u.email && u.email.toLowerCase() === cleanEmail && u.password === cleanPassword
    );

    if (foundUser) {
      const matchedName = foundUser.name || 'User';
      setIsGuestMode(false);
      setCurrentUserEmail(cleanEmail);
      onLogin(matchedName);
      return;
    }

    setLoginError('Account not found. Please check your credentials or click Sign Up to create an account.');
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    const subjectText = contactSubject.trim() || 'Message from BiBi Workspace Contact Form';
    const bodyText = `From: ${contactName.trim()} (${contactEmail.trim()})\n\nMessage:\n${contactMessage.trim()}`;
    const mailto = `mailto:bibiworkspace@hotmail.com?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`;

    setLastMailtoUrl(mailto);

    // Save message directly into Firestore database under contactMessages collection
    if (db) {
      try {
        await addDoc(collection(db, 'contactMessages'), {
          to: 'bibiworkspace@hotmail.com',
          senderName: contactName.trim(),
          senderEmail: contactEmail.trim(),
          subject: subjectText,
          message: contactMessage.trim(),
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Firestore contact message warning:', err);
      }
    }

    // Launch email client draft
    try {
      window.open(mailto, '_blank');
    } catch {
      window.location.href = mailto;
    }

    setContactSent(true);
  };

  const navItems: { id: 'home' | 'about' | 'contact' | 'login' | 'signup'; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen bg-[#FFF0F6] dark:bg-[#0A0A0C] text-[#021A54] dark:text-zinc-100 flex flex-col font-sans selection:bg-[#FFCEE3] transition-colors duration-300 overflow-x-hidden relative">
      {/* Interactive Sparkling Mouse Effect */}
      <SparkleCursor />

      {/* Aesthetic Background Detail Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Left Glowing Ambient Blob */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FF85BB]/25 dark:bg-[#321323]/50 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        
        {/* Center-Right Soft Pastel Blur */}
        <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] bg-[#FFCEE3]/40 dark:bg-[#4A2038]/30 rounded-full blur-3xl" />
        
        {/* Bottom-Left Subtle Navy Accent Blob */}
        <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-[#021A54]/10 dark:bg-[#FF85BB]/10 rounded-full blur-3xl" />

        {/* Subtle Decorative Geometric Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#FF85BB_1px,transparent_1px)] dark:bg-[radial-gradient(#321323_1px,transparent_1px)] [background-size:32px_32px] opacity-25 dark:opacity-40" />
      </div>

      {/* Top Floating Glass Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-[#0A0A0C]/80 border-b border-[#FFCEE3]/60 dark:border-[#222222] px-2.5 sm:px-8 py-2 sm:py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
          
          {/* Logo */}
          <button 
            onClick={() => navigateToPage('home')} 
            className="flex items-center gap-1.5 sm:gap-2.5 text-left group focus:outline-hidden shrink-0"
          >
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#FF85BB] to-[#FFCEE3] dark:from-[#321323] dark:to-[#4A2038] border border-[#FF85BB]/40 flex items-center justify-center text-[#021A54] dark:text-[#FFB3D1] shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Heart size={14} className="text-[#021A54] dark:text-[#FF85BB] fill-current sm:w-[18px] sm:h-[18px]" />
            </div>
            <div>
              <span className="font-black text-xs sm:text-base md:text-lg tracking-tight text-[#021A54] dark:text-white block leading-none">
                BiBi Workspace
              </span>
              <span className="text-[8px] sm:text-[10px] text-[#FF85BB] dark:text-[#FFB3D1] font-semibold tracking-wider uppercase hidden sm:block">
                Personal Academic Haven
              </span>
            </div>
          </button>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#FFF0F6]/80 dark:bg-[#151518] p-1.5 rounded-2xl border border-[#FFCEE3] dark:border-[#222222]">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateToPage(item.id as any)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all relative ${
                  currentPage === item.id 
                    ? 'text-[#021A54] dark:text-white bg-white dark:bg-[#222226] shadow-2xs' 
                    : 'text-[#021A54]/70 dark:text-zinc-400 hover:text-[#021A54] dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Action Buttons & Theme Toggle */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={toggleDarkMode}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-2xl bg-white dark:bg-[#18181B] hover:bg-[#FFCEE3]/40 dark:hover:bg-[#222226] text-[#021A54] dark:text-zinc-100 border border-[#FFCEE3] dark:border-[#222222] transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={14} className="text-amber-400 sm:w-[16px] sm:h-[16px]" /> : <Moon size={14} className="text-[#021A54] sm:w-[16px] sm:h-[16px]" />}
            </button>

            <button
              onClick={() => navigateToPage('login')}
              className={`px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 ${
                currentPage === 'login'
                  ? 'bg-[#021A54] text-white dark:bg-white dark:text-[#021A54]'
                  : 'bg-white dark:bg-[#18181B] text-[#021A54] dark:text-zinc-200 hover:bg-[#FFCEE3]/50 border border-[#FFCEE3] dark:border-[#222222]'
              }`}
            >
              <LogIn size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span>Log in</span>
            </button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigateToPage('signup')}
              className="px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-2xl bg-[#FF85BB] hover:bg-[#FF85BB]/90 text-white text-[11px] sm:text-xs font-bold shadow-xs transition-all flex items-center gap-1 sm:gap-1.5"
            >
              <UserPlus size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span>Sign up</span>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-center gap-1.5 sm:gap-2 mt-2 pt-2 border-t border-[#FFCEE3]/40 dark:border-[#222222]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigateToPage(item.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentPage === item.id 
                  ? 'bg-[#FF85BB] text-white shadow-2xs' 
                  : 'text-[#021A54]/70 dark:text-zinc-300 hover:bg-[#FFCEE3]/40 dark:hover:bg-[#1A1A1E]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Pages Router */}
      <main className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* ==================== HOME PAGE ==================== */}
          {currentPage === 'home' && (
            <motion.div
              key="home-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-20"
            >
              {/* Hero Banner */}
              <div className="text-center space-y-6 pt-6 max-w-3xl mx-auto">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#18181B] border border-[#FF85BB]/40 shadow-2xs text-xs font-bold text-[#FF85BB] dark:text-[#FFB3D1]"
                >
                  <Sparkle size={14} className="fill-[#FF85BB]" />
                  <span>Your Clean, All-in-One Workspace</span>
                </motion.div>

                <h1 className="text-4xl sm:text-6xl font-black text-[#021A54] dark:text-white tracking-tight leading-tight">
                  Organize your studies with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF85BB] via-[#FF539B] to-[#021A54] dark:to-[#FFCEE3]">clarity and style.</span>
                </h1>

                <p className="text-sm sm:text-base text-[#021A54]/70 dark:text-zinc-300 font-normal leading-relaxed max-w-2xl mx-auto">
                  Your personal workspace featuring class timetable generator, course hubs, notes studio, and deadline task planners built for effortless academic success.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setCurrentPage('signup')}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#FF85BB] hover:bg-[#FF85BB]/90 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>Create Your Account</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => triggerWorkspaceInteraction('explore the demo workspace')}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white dark:bg-[#18181B] text-[#021A54] dark:text-zinc-100 font-bold text-sm border border-[#FFCEE3] dark:border-[#222222] hover:border-[#FF85BB] transition-all shadow-2xs"
                  >
                    Explore Demo Workspace
                  </motion.button>
                </div>
              </div>

              {/* Interactive Workspace Features Grid */}
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <h2 className="text-xs uppercase tracking-widest font-extrabold text-[#FF85BB]">Everything You Need</h2>
                  <p className="text-2xl font-bold text-[#021A54] dark:text-white">Built for students who appreciate clean design.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    {
                      icon: Calendar,
                      title: 'Class Schedule',
                      desc: 'Drag, customize, and generate your weekly timetable with downloadable image export.',
                      color: 'from-[#FF85BB] to-[#FFCEE3]'
                    },
                    {
                      icon: BookOpen,
                      title: 'Courses Hub',
                      desc: 'Track course syllabus, instructor contacts, credits, grading weights, and lecture logs.',
                      color: 'from-[#FF539B] to-[#FF85BB]'
                    },
                    {
                      icon: FileText,
                      title: 'Notes Studio',
                      desc: 'Craft rich multimedia study notes with blocks, pinning, and course tagging.',
                      color: 'from-[#021A54] to-[#3B82F6]'
                    },
                    {
                      icon: CheckSquare,
                      title: 'Tasks & Planner',
                      desc: 'Manage deadlines with category tagging, priorities, and dashboard calendar synchronization.',
                      color: 'from-emerald-500 to-teal-400'
                    }
                  ].map((feat, idx) => {
                    const IconComp = feat.icon;
                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                        onClick={() => triggerWorkspaceInteraction(`use the ${feat.title} feature`)}
                        className="p-6 rounded-3xl bg-white dark:bg-[#121212] border border-[#FFCEE3]/80 dark:border-[#222222] shadow-2xs hover:border-[#FF85BB] hover:shadow-md transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
                      >
                        <div className="space-y-3">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.color} text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform`}>
                            <IconComp size={22} />
                          </div>
                          <h3 className="font-bold text-base text-[#021A54] dark:text-zinc-100">{feat.title}</h3>
                          <p className="text-xs text-[#021A54]/70 dark:text-zinc-400 leading-relaxed">{feat.desc}</p>
                        </div>
                        <div className="pt-2 flex items-center gap-1 text-[11px] font-bold text-[#FF85BB]">
                          <span>Discover</span>
                          <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Minimalist Interactive Demo Preview Mockup */}
              <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#121212] border border-[#FFCEE3] dark:border-[#222222] shadow-sm space-y-6 text-center">
                <div className="max-w-xl mx-auto space-y-3">
                  <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0F6] dark:bg-[#2A1523] text-[#FF85BB] dark:text-[#FFB3D1] border border-[#FFCEE3] dark:border-[#4A2038] shadow-2xs font-bold text-xs mx-auto">
                    <Sparkle size={14} className="fill-[#FF85BB] text-[#FF85BB] animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Ready to transform your productivity?</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#021A54] dark:text-white tracking-tight">
                    Start your organized semester today.
                  </h2>
                  <p className="text-xs sm:text-sm text-[#021A54]/70 dark:text-zinc-300 leading-relaxed max-w-md mx-auto">
                    Join thousands of students who keep their schedule, notes, and deadlines seamlessly synced.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentPage('signup')}
                    className="px-6 py-3 rounded-2xl bg-[#021A54] dark:bg-white text-white dark:text-[#021A54] font-bold text-xs hover:bg-[#021A54]/90 transition-all shadow-xs flex items-center gap-2"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => setCurrentPage('about')}
                    className="px-6 py-3 rounded-2xl bg-[#FFF0F6] dark:bg-[#1E1E22] text-[#021A54] dark:text-zinc-200 font-bold text-xs hover:bg-[#FFCEE3]/50 transition-all border border-[#FFCEE3] dark:border-[#222222]"
                  >
                    Learn About BiBi Workspace
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== ABOUT PAGE ==================== */}
          {currentPage === 'about' && (
            <motion.div
              key="about-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-12"
            >
              {/* Header */}
              <div className="text-center space-y-4 pb-8 sm:pb-10 border-b border-[#FFCEE3]/50 dark:border-[#222222] mb-2 sm:mb-6">
                <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#18181B] text-[#FF85BB] dark:text-[#FFB3D1] border border-[#FFCEE3] dark:border-[#222222] shadow-2xs text-xs font-extrabold tracking-widest uppercase mx-auto">
                  <Sparkles size={14} className="text-[#FF85BB]" />
                  <span>About Our Platform</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-[#021A54] dark:text-white tracking-tight leading-tight max-w-3xl mx-auto">
                  Designed for Focus, Simplicity & Elegance.
                </h1>
                <p className="text-xs sm:text-sm text-[#021A54]/70 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
                  BiBi Workspace was created to solve messy student workflows. Instead of juggling fragmented apps, BiBi provides a calm, centralized space where your schedule, courses, notes, and task planner live in total harmony.
                </p>
              </div>

              {/* Core Values / Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  {
                    icon: Shield,
                    title: 'Privacy & Offline First',
                    desc: 'Your workspace data stays safely stored in your own browser with instant JSON backup & restore options.'
                  },
                  {
                    icon: Zap,
                    title: 'Fast & Lightweight',
                    desc: 'Instant loading times without cluttered ads, slow database latency, or paywalls.'
                  },
                  {
                    icon: Heart,
                    title: 'Craftsmanship',
                    desc: 'Thoughtfully crafted typography, dark mode toggle, and responsive layouts that look great everywhere.'
                  }
                ].map((pillar, idx) => {
                  const IconC = pillar.icon;
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      className="p-6 rounded-3xl bg-white dark:bg-[#121212] border border-[#FFCEE3] dark:border-[#222222] shadow-2xs space-y-3"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-[#FFF0F6] dark:bg-[#2B1525] border border-[#FFCEE3] dark:border-[#4A2038] text-[#FF85BB] flex items-center justify-center">
                        <IconC size={20} />
                      </div>
                      <h3 className="font-bold text-sm text-[#021A54] dark:text-zinc-100">{pillar.title}</h3>
                      <p className="text-xs text-[#021A54]/70 dark:text-zinc-400 leading-relaxed">{pillar.desc}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Story Section */}
              <div className="p-8 rounded-3xl bg-white dark:bg-[#121212] border border-[#FFCEE3] dark:border-[#222222] space-y-4">
                <h2 className="text-lg font-bold text-[#021A54] dark:text-white">Why BiBi Workspace Was Built</h2>
                <div className="space-y-3 text-xs text-[#021A54]/80 dark:text-zinc-300 leading-relaxed">
                  <p>
                    As students, keeping track of class times, homework assignments, exam dates, and course notes often feels chaotic. Many existing workspace tools are overly complex, requiring steep learning curves or expensive subscriptions.
                  </p>
                  <p>
                    BiBi Workspace provides an intuitive, delightful alternative: clean weekly timetable views, quick note creation, course organization, and deadline indicators right on your dashboard calendar.
                  </p>
                </div>
              </div>

              {/* Founder / Solo Developer Section */}
              <div className="p-8 rounded-3xl bg-gradient-to-br from-[#FFF0F6] to-white dark:from-[#1E1119] dark:to-[#121212] border border-[#FFCEE3] dark:border-[#4A2038] shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF85BB]/20 dark:bg-[#FF85BB]/30 text-[#FF85BB] flex items-center justify-center shrink-0">
                    <Code size={20} />
                  </div>
                  <div>
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#FF85BB]/15 text-[#FF85BB] text-[10px] font-extrabold uppercase tracking-wider mb-0.5">
                      Built by a Solo Developer
                    </div>
                    <h2 className="text-lg font-extrabold text-[#021A54] dark:text-white">Meet the Developer & Founder</h2>
                  </div>
                </div>

                {/* Founder Spotlight Card with Effects */}
                <div className="my-3 p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-[#FF85BB]/40 shadow-sm backdrop-blur-xs flex items-center gap-3.5 relative overflow-hidden group hover:border-[#FF85BB] transition-all duration-300">
                  {/* Ambient background glow effect */}
                  <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-gradient-to-br from-[#FF85BB]/30 to-[#021A54]/20 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>

                  {/* Avatar Badge */}
                  <motion.div 
                    whileHover={{ rotate: 10, scale: 1.08 }}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#021A54] via-[#FF539B] to-[#FF85BB] p-0.5 shadow-md shrink-0 relative"
                  >
                    <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-[14px] flex items-center justify-center text-[#FF85BB] font-black text-base">
                      AB
                    </div>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Animated Shimmer Gradient Name */}
                      <motion.span 
                        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="text-base font-black tracking-tight bg-gradient-to-r from-[#021A54] via-[#FF539B] to-[#FF85BB] dark:from-white dark:via-[#FF85BB] dark:to-[#FF539B] bg-[length:200%_auto] bg-clip-text text-transparent drop-shadow-xs"
                      >
                        Abigail B.
                      </motion.span>
                      <motion.span 
                        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.25, 1] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                        className="inline-flex text-[#FF85BB]"
                      >
                        <Sparkles size={16} />
                      </motion.span>
                    </div>
                    <p className="text-[11px] font-semibold text-[#021A54]/75 dark:text-zinc-300">
                      Creator of BiBi Workspace
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-[#021A54]/80 dark:text-zinc-300 leading-relaxed pt-1">
                  <p>
                    BiBi Workspace was designed, and crafted by <strong>Abigail B.</strong> as a solo developer who set out to build a useful productivity platform for students and learners.
                  </p>
                  <p>
                    Every details and responsive timetable schedule to cloud backup, notes markdown studio, and customizable course tracker was crafted independently with passion and attention to detail.
                  </p>
                </div>
              </div>

              {/* Call to action */}
              <div className="text-center pt-4">
                <button
                  onClick={() => setCurrentPage('signup')}
                  className="px-8 py-3.5 rounded-2xl bg-[#FF85BB] hover:bg-[#FF85BB]/90 text-white font-bold text-xs shadow-md transition-all"
                >
                  Create Your Free Account
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================== CONTACT PAGE ==================== */}
          {currentPage === 'contact' && (
            <motion.div
              key="contact-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-12"
            >
              <div className="text-center space-y-4 pb-8 sm:pb-10 border-b border-[#FFCEE3]/50 dark:border-[#222222] mb-2 sm:mb-6">
                <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#18181B] text-[#FF85BB] dark:text-[#FFB3D1] border border-[#FFCEE3] dark:border-[#222222] shadow-2xs text-xs font-extrabold tracking-widest uppercase mx-auto">
                  <Sparkles size={14} className="text-[#FF85BB]" />
                  <span>Get In Touch</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-[#021A54] dark:text-white tracking-tight leading-tight max-w-2xl mx-auto">
                  We'd love to hear from you.
                </h1>
                <p className="text-xs sm:text-sm text-[#021A54]/70 dark:text-zinc-300 max-w-xl mx-auto leading-relaxed">
                  Have questions, feature suggestions, or feedback? Send us a message and we'll get back to you right away.
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-8">
                {/* Direct Support Email Box */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FFF0F6] to-white dark:from-[#1E1119] dark:to-[#121212] border border-[#FFCEE3] dark:border-[#4A2038] shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FF85BB]/20 dark:bg-[#FF85BB]/30 text-[#FF85BB] flex items-center justify-center shrink-0">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#021A54] dark:text-white">Direct Email Support</h3>
                      <p className="text-xs text-[#021A54]/70 dark:text-zinc-300">Reach out directly to our official workspace email</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-black border border-[#FFCEE3] dark:border-[#333] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#FF85BB] select-all">
                      bibiworkspace@hotmail.com
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('bibiworkspace@hotmail.com');
                          setCopiedEmail(true);
                          setTimeout(() => setCopiedEmail(false), 2000);
                        }}
                        className="px-3 py-2 rounded-xl bg-[#FFF0F6] dark:bg-[#222226] hover:bg-[#FFCEE3]/50 text-[#021A54] dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5"
                        title="Copy Email Address"
                      >
                        {copiedEmail ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        <span>{copiedEmail ? 'Copied' : 'Copy Email'}</span>
                      </button>

                      <a
                        href="mailto:bibiworkspace@hotmail.com"
                        className="px-3 py-2 rounded-xl bg-[#FF85BB] text-white hover:bg-[#FF85BB]/90 text-xs font-bold transition-all flex items-center gap-1.5"
                        title="Compose Email directly"
                      >
                        <ExternalLink size={14} />
                        <span>Send Email</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h2 className="text-base sm:text-lg font-bold text-[#021A54] dark:text-white">Frequently Asked Questions</h2>
                  <div className="space-y-3 text-xs sm:text-sm">
                    {[
                      {
                        q: "Is BiBi Workspace free to use?",
                        a: "Yes! BiBi Workspace is completely free with no hidden fees or limits on notes, schedule slots, or courses."
                      },
                      {
                        q: "Where is my data stored?",
                        a: "Your workspace data is stored in Firebase Firestore cloud database and backed up locally in your web browser."
                      },
                      {
                        q: "Can I download my weekly class timetable?",
                        a: "Yes! In the Schedule page, click the 'Download Image' button to save a clean, styled PNG image of your timetable."
                      },
                      {
                        q: "How do task deadlines reflect on the calendar?",
                        a: "When you set a due date for a task in Tasks & Planner, a red indicator dot will automatically appear on that date in your Dashboard calendar!"
                      }
                    ].map((faq, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl bg-white dark:bg-[#121212] border border-[#FFCEE3] dark:border-[#222222] overflow-hidden shadow-2xs"
                      >
                        <button
                          onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                          className="w-full p-4 text-left font-bold text-[#021A54] dark:text-zinc-100 flex items-center justify-between gap-2"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown size={16} className={`text-[#FF85BB] transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                        </button>
                        {openFaq === idx && (
                          <div className="px-4 pb-4 pt-0 text-[#021A54]/70 dark:text-zinc-300 leading-relaxed border-t border-[#FFCEE3]/40 dark:border-[#222222]/50">
                            <p className="pt-2">{faq.a}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== LOGIN PAGE ==================== */}
          {currentPage === 'login' && (
            <motion.div
              key="login-page"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="max-w-md w-full mx-auto px-4 py-12"
            >
              <div className="p-8 rounded-3xl bg-white dark:bg-[#121212] border border-[#FFCEE3] dark:border-[#222222] shadow-xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F6] dark:bg-[#2A1523] border border-[#FFCEE3] dark:border-[#4A2038] text-[#FF85BB] flex items-center justify-center mx-auto">
                    <LogIn size={22} />
                  </div>
                  <h1 className="text-2xl font-black text-[#021A54] dark:text-white">Welcome Back</h1>
                  <p className="text-xs text-[#021A54]/70 dark:text-zinc-400">
                    Log in to continue to your personal workspace.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs font-semibold">
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#021A54]/40 dark:text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#021A54]/40 dark:text-zinc-500" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-[#021A54] dark:bg-white text-white dark:text-[#021A54] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>Log In to Workspace</span>
                    <ArrowRight size={14} />
                  </motion.button>
                </form>

                <div className="pt-2 border-t border-[#FFCEE3]/50 dark:border-[#222222] flex items-center justify-between text-xs">
                  <span className="text-[#021A54]/60 dark:text-zinc-400">Don't have an account?</span>
                  <button
                    onClick={() => navigateToPage('signup')}
                    className="font-bold text-[#FF85BB] hover:underline"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== SIGNUP PAGE ==================== */}
          {currentPage === 'signup' && (
            <motion.div
              key="signup-page"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="max-w-md w-full mx-auto px-4 py-12"
            >
              <div className="p-8 rounded-3xl bg-white dark:bg-[#121212] border border-[#FFCEE3] dark:border-[#222222] shadow-xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0F6] dark:bg-[#2A1523] border border-[#FFCEE3] dark:border-[#4A2038] text-[#FF85BB] flex items-center justify-center mx-auto">
                    <UserPlus size={22} />
                  </div>
                  <h1 className="text-2xl font-black text-[#021A54] dark:text-white">Create an Account</h1>
                  <p className="text-xs text-[#021A54]/70 dark:text-zinc-400">
                    Sign up first to unlock your personal workspace.
                  </p>
                </div>

                {signupSuccess ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 rounded-2xl bg-[#FFF0F6] dark:bg-[#2A1523] border border-[#FFCEE3] dark:border-[#4A2038] text-center space-y-2"
                  >
                    <CheckCircle2 size={32} className="text-[#FF85BB] mx-auto" />
                    <h3 className="font-bold text-sm text-[#021A54] dark:text-white">Account Created Successfully!</h3>
                    <p className="text-xs text-[#021A54]/70 dark:text-zinc-300">
                      Redirecting you to your personal workspace...
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {signupError && (
                      <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs font-semibold">
                        {signupError}
                      </div>
                    )}

                    <form onSubmit={handleSignupSubmit} className="space-y-4 text-xs font-semibold">
                      <div>
                        <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Full Name</label>
                        <div className="relative">
                          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#021A54]/40 dark:text-zinc-500" />
                          <input
                            type="text"
                            required
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            placeholder="e.g. Alex Smith"
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Email Address</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#021A54]/40 dark:text-zinc-500" />
                          <input
                            type="email"
                            required
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Password</label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#021A54]/40 dark:text-zinc-500" />
                          <input
                            type="password"
                            required
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
                          />
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full py-3.5 rounded-2xl bg-[#FF85BB] hover:bg-[#FF85BB]/90 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <span>Create Account & Continue</span>
                        <ArrowRight size={14} />
                      </motion.button>
                    </form>

                    <div className="pt-2 border-t border-[#FFCEE3]/50 dark:border-[#222222] flex items-center justify-between text-xs">
                      <span className="text-[#021A54]/60 dark:text-zinc-400">Already have an account?</span>
                      <button
                        onClick={() => navigateToPage('login')}
                        className="font-bold text-[#FF85BB] hover:underline"
                      >
                        Log In
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#FFCEE3]/60 dark:border-[#222222] py-6 px-4 sm:px-8 text-center text-xs text-[#021A54]/60 dark:text-zinc-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-[#FF85BB] fill-current" />
            <span className="font-bold text-[#021A54] dark:text-zinc-200">BiBi Workspace</span>
            <span>— Academic Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <button onClick={() => navigateToPage('home')} className="hover:text-[#FF85BB] transition-colors">Home</button>
            <button onClick={() => navigateToPage('about')} className="hover:text-[#FF85BB] transition-colors">About</button>
            <button onClick={() => navigateToPage('contact')} className="hover:text-[#FF85BB] transition-colors">Contact</button>
            <button onClick={() => navigateToPage('login')} className="hover:text-[#FF85BB] transition-colors">Login</button>
            <button onClick={() => navigateToPage('signup')} className="hover:text-[#FF85BB] transition-colors">Signup</button>
          </div>
        </div>
      </footer>

      {/* Login Required Popup Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#121212] border border-[#FFCEE3] dark:border-[#222222] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5"
            >
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-2 rounded-2xl hover:bg-[#FFF0F6] dark:hover:bg-[#222226] text-[#021A54]/60 dark:text-zinc-400 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF85BB] to-[#FFCEE3] dark:from-[#321323] dark:to-[#4A2038] text-[#021A54] dark:text-[#FFB3D1] flex items-center justify-center mx-auto shadow-xs border border-[#FF85BB]/40">
                  <Lock size={24} />
                </div>
                <h3 className="text-xl font-black text-[#021A54] dark:text-white">
                  Account Login Required
                </h3>
                <p className="text-xs text-[#021A54]/70 dark:text-zinc-300 leading-relaxed">
                  In order to <span className="font-bold text-[#FF85BB]">{loginModalAction}</span>, please log in or create an account first.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setCurrentPage('login');
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[#021A54] dark:bg-white text-white dark:text-[#021A54] font-bold text-xs hover:bg-[#021A54]/90 transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <LogIn size={15} />
                  <span>Log In to Your Account</span>
                </button>

                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setCurrentPage('signup');
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[#FF85BB] hover:bg-[#FF85BB]/90 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <UserPlus size={15} />
                  <span>Create a New Account</span>
                </button>

                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    resetToDefaults();
                    setIsGuestMode(true);
                    onLogin('Guest User');
                  }}
                  className="w-full py-2.5 rounded-2xl bg-[#FFF0F6] dark:bg-[#1E1E22] text-[#021A54]/80 dark:text-zinc-300 font-semibold text-xs hover:bg-[#FFCEE3]/50 transition-all border border-[#FFCEE3] dark:border-[#222222]"
                >
                  Continue as Guest
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
