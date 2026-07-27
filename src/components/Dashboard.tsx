import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  MapPin, 
  Trash2,
  Flame,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Edit3,
  Calendar,
  Heart,
  Smile,
  Sun,
  Moon,
  Coffee,
  RefreshCw,
  Star,
  Zap,
  type LucideProps
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ActiveTab, DayOfWeek, format12HourTime } from '../types';
import confetti from 'canvas-confetti';

interface DashboardProps {
  setActiveTab: (tab: ActiveTab) => void;
  onSelectNote?: (id: string) => void;
  onNewNote?: () => void;
}

const CUTE_MOODS = [
  { label: 'Energized', icon: '⚡', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  { label: 'Cozy', icon: '🌸', color: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300' },
  { label: 'Productive', icon: '🎀', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
  { label: 'Inspired', icon: '✨', color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300' },
  { label: 'Focused', icon: '☕', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' }
];

const CUTE_QUOTES = [
  "Believe in yourself and magic will happen! ✨",
  "Small steps every day lead to big dreams 🌸",
  "Stay curious, stay aesthetic, stay productive! 🎀",
  "You are doing amazing, keep shining bright! 💖",
  "Focus on the beauty of the present moment ☕",
  "Your potential is endless — dream big today! 🌟"
];

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { data, toggleQuickTask, addQuickTask, deleteQuickTask, updateSettings } = useWorkspace();

  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Live Time state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Interactive Mood & Quote State
  const [selectedMood, setSelectedMood] = useState(CUTE_MOODS[1]);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteLiked, setQuoteLiked] = useState(false);
  const [avatarHearts, setAvatarHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Interactive Mini Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalDate, setSelectedCalDate] = useState<Date>(new Date());
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [eventModalTitle, setEventModalTitle] = useState('');
  const [eventModalTime, setEventModalTime] = useState('');
  const [eventModalCategory, setEventModalCategory] = useState('Academic');
  const [eventModalIsEvent, setEventModalIsEvent] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Time of day greeting helper
  const hour = currentTime.getHours();
  const SunsetIcon: React.ComponentType<LucideProps> = (props) => {
    return <Sun {...props} className="text-amber-500" />;
  };

  let timeGreeting = "Good morning";
  let TimeIcon: React.ComponentType<LucideProps> = Sun;
  if (hour >= 12 && hour < 17) {
    timeGreeting = "Good afternoon";
    TimeIcon = Sun;
  } else if (hour >= 17 && hour < 22) {
    timeGreeting = "Good evening";
    TimeIcon = SunsetIcon;
  } else if (hour >= 22 || hour < 5) {
    timeGreeting = "Late night focus";
    TimeIcon = Moon;
  }

  const handleAvatarClick = (e: React.MouseEvent) => {
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
      colors: ['#FF85BB', '#FFCEE3', '#021A54', '#FFE4EF']
    });

    const newHeart = { id: Date.now(), x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    setAvatarHearts(prev => [...prev.slice(-4), newHeart]);
    setTimeout(() => {
      setAvatarHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1000);
  };

  const handleClockClick = (e: React.MouseEvent) => {
    confetti({
      particleCount: 25,
      spread: 40,
      origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
      colors: ['#FF85BB', '#FFE4EF', '#3498DB']
    });
  };

  const cycleQuote = () => {
    setQuoteIndex(prev => (prev + 1) % CUTE_QUOTES.length);
    setQuoteLiked(false);
  };

  // Figure out current day of week
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  // Get today's classes
  const todayClasses = data.timetableSlots.filter(s => s.day === todayName);

  const handleTaskCheck = (id: string, isCompletedNow: boolean) => {
    toggleQuickTask(id);
    if (!isCompletedNow) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#FF85BB', '#FFCEE3', '#021A54']
      });
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addQuickTask({
      title: newTaskTitle.trim(),
      priority: 'medium',
      category: 'Daily'
    });
    setNewTaskTitle('');
  };

  // Mini Calendar Helpers
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth(); // 0-indexed

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const prevMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const monthYearLabel = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Check items on selected date
  const formattedSelectedDate = selectedCalDate.toISOString().split('T')[0];
  const selectedDayOfWeekName = selectedCalDate.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  const countdownsOnSelectedDate = data.countdowns.filter(c => c.targetDate === formattedSelectedDate);
  const classesOnSelectedDate = data.timetableSlots.filter(s => s.day === selectedDayOfWeekName);

  const currentMotdDisplay = data.settings.motd || CUTE_QUOTES[quoteIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-12"
    >
      {/* Interactive Cute Greeting Banner + Live Time Widget */}
      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden bg-white dark:bg-[#121212] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#FFCEE3]/80 dark:border-[#222222] shadow-xs hover:shadow-lg transition-all group"
      >
        {/* Animated Background Decorative Blobs */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br from-[#FF85BB]/20 via-[#FFCEE3]/30 to-transparent dark:from-[#FF85BB]/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
        <div className="absolute left-1/4 -bottom-10 w-36 h-36 bg-[#FFCEE3]/30 dark:bg-[#321323]/40 rounded-full blur-xl animate-pulse pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 min-w-0">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
            {/* Interactive Avatar Container */}
            <div className="relative shrink-0 cursor-pointer" onClick={handleAvatarClick}>
              <motion.div 
                whileHover={{ rotate: 8, scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="relative"
              >
                {data.settings.profileImage ? (
                  <img 
                    src={data.settings.profileImage} 
                    alt={data.settings.userName} 
                    className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-[#FF85BB] shadow-md relative z-10"
                  />
                ) : (
                  <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#FFCEE3] to-[#FF85BB] dark:from-[#321323] dark:to-[#4A2038] border-2 border-[#FF85BB] text-[#021A54] dark:text-[#FFB3D1] font-black text-xl sm:text-2xl flex items-center justify-center shadow-md relative z-10">
                    {data.settings.userName.charAt(0) || 'U'}
                  </div>
                )}
                {/* Cute Badge on Avatar */}
                <span className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white dark:bg-zinc-900 border border-[#FFCEE3] flex items-center justify-center text-[10px] sm:text-xs shadow-xs z-20">
                  {selectedMood.icon}
                </span>
              </motion.div>

              {/* Floating Hearts on Avatar click */}
              {avatarHearts.map(h => (
                <motion.span
                  key={h.id}
                  initial={{ opacity: 1, y: 0, scale: 0.8 }}
                  animate={{ opacity: 0, y: -35, scale: 1.4 }}
                  transition={{ duration: 0.8 }}
                  className="absolute pointer-events-none text-pink-500 text-sm z-30 font-bold"
                  style={{ left: h.x - 10, top: h.y - 20 }}
                >
                  💖
                </motion.span>
              ))}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-full">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-[#FF85BB] bg-[#FFF0F6] dark:bg-[#2B1221] px-2.5 py-0.5 rounded-full border border-[#FFCEE3] dark:border-[#4A2038] shadow-2xs truncate max-w-[130px] sm:max-w-none">
                  {data.settings.workspaceTitle || "Personal Workspace"}
                </span>

                {/* Interactive Mood Pills Selector */}
                <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full no-scrollbar">
                  {CUTE_MOODS.map(mood => (
                    <motion.button
                      key={mood.label}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedMood(mood)}
                      className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 shrink-0 ${
                        selectedMood.label === mood.label
                          ? 'bg-[#FF85BB] text-white border-[#FF85BB] shadow-xs'
                          : 'bg-white/80 dark:bg-zinc-900/80 text-[#021A54]/70 dark:text-zinc-300 border-[#FFCEE3]/60 dark:border-zinc-800 hover:border-[#FF85BB]'
                      }`}
                    >
                      <span>{mood.icon}</span>
                      <span>{mood.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#021A54] dark:text-zinc-100 flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 break-words">
                <span>{timeGreeting}, {data.settings.userName}!</span>
                <motion.span
                  animate={{ rotate: [0, 14, -14, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 3 }}
                  className="inline-block text-lg sm:text-xl shrink-0"
                >
                  ✨
                </motion.span>
              </h1>

              {data.settings.userBio && (
                <p className="text-xs text-[#021A54]/70 dark:text-zinc-300 max-w-xl font-medium truncate">
                  {data.settings.userBio}
                </p>
              )}

              {/* Interactive MOTD Daily Quote Card */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="mt-2.5 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-[#FFF0F6] to-[#FFE4EF] dark:from-[#1A1017] dark:to-[#22131D] border border-[#FFCEE3] dark:border-[#4A2038] text-xs font-semibold text-[#021A54] dark:text-zinc-200 flex items-center justify-between gap-2 shadow-2xs min-w-0"
              >
                <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                  <Sparkles size={14} className="text-[#FF85BB] shrink-0 animate-spin-slow" />
                  <span className="italic truncate text-[11px] sm:text-xs">"{currentMotdDisplay}"</span>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuoteLiked(!quoteLiked)}
                    className={`p-1 sm:p-1.5 rounded-full transition-colors ${
                      quoteLiked ? 'text-pink-500 bg-pink-100 dark:bg-pink-950/60' : 'text-zinc-400 hover:text-pink-500'
                    }`}
                    title="Like Quote"
                  >
                    <Heart size={13} className={quoteLiked ? 'fill-current' : ''} />
                  </motion.button>

                  <motion.button
                    whileHover={{ rotate: 180, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={cycleQuote}
                    className="p-1 sm:p-1.5 rounded-full text-zinc-400 hover:text-[#FF85BB] transition-colors"
                    title="New Cute Quote"
                  >
                    <RefreshCw size={13} />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Live Clock & Date Interactive Widget */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClockClick}
            className="bg-gradient-to-b from-[#FFF0F6] to-white dark:from-[#22131D] dark:to-[#170B13] p-3.5 sm:p-5 rounded-2xl border border-[#FFCEE3] dark:border-[#4A2038] flex flex-col items-center justify-center text-center shrink-0 w-full md:w-auto md:min-w-[220px] shadow-xs cursor-pointer group/clock relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[#FF85BB]/5 opacity-0 group-hover/clock:opacity-100 transition-opacity pointer-events-none"></div>

            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#FF85BB] mb-1">
              <Clock size={14} className="animate-pulse text-[#FF85BB]" />
              <span className="tracking-wider">LIVE TIME</span>
              <TimeIcon size={14} className="text-amber-500 ml-0.5" />
            </div>

            <div className="text-2xl font-black text-[#021A54] dark:text-zinc-100 font-mono tracking-wider drop-shadow-2xs">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>

            <div className="text-[11px] font-bold text-[#021A54]/70 dark:text-zinc-300 mt-1 flex items-center gap-1">
              <span>{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span className="text-[10px] bg-[#FFCEE3] dark:bg-[#321323] text-[#021A54] dark:text-[#FFB3D1] px-1.5 py-0.2 rounded-md font-bold">
                {selectedMood.icon}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Row: Interactive Calendar + Today's Schedule + Quick Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Mini Calendar Widget */}
        <div className="bg-white dark:bg-[#121212] p-5 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222]">
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-[#FF85BB]" />
                <h2 className="text-sm font-bold text-[#021A54] dark:text-zinc-100">Calendar</h2>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={prevMonth}
                  className="p-1 rounded-lg hover:bg-[#FFF0F6] dark:hover:bg-zinc-800 text-[#021A54] dark:text-zinc-300"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-[#021A54] dark:text-zinc-200 px-1">
                  {monthYearLabel}
                </span>
                <button 
                  onClick={nextMonth}
                  className="p-1 rounded-lg hover:bg-[#FFF0F6] dark:hover:bg-zinc-800 text-[#021A54] dark:text-zinc-300"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#021A54]/60 dark:text-zinc-400 mt-3 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Blank spaces for days before first day of month */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`blank-${i}`} className="h-7" />
              ))}

              {/* Day numbers */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const thisDate = new Date(currentYear, currentMonth, dayNum);
                const isToday = 
                  dayNum === new Date().getDate() &&
                  currentMonth === new Date().getMonth() &&
                  currentYear === new Date().getFullYear();

                const isSelected = 
                  dayNum === selectedCalDate.getDate() &&
                  currentMonth === selectedCalDate.getMonth() &&
                  currentYear === selectedCalDate.getFullYear();

                const yyyy = currentYear;
                const mm = String(currentMonth + 1).padStart(2, '0');
                const dd = String(dayNum).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;

                const hasCountdown = data.countdowns.some(c => c.targetDate === dateStr);
                const hasTask = data.quickTasks.some(t => t.dueDate === dateStr && !t.completed);
                const hasDot = hasCountdown || hasTask;

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedCalDate(thisDate)}
                    className={`
                      h-7 rounded-xl flex items-center justify-center font-bold text-[11px] relative transition-all
                      ${isToday ? 'bg-[#FF85BB] text-white shadow-2xs' : ''}
                      ${isSelected && !isToday ? 'bg-[#FFCEE3] dark:bg-[#321323] text-[#021A54] dark:text-[#FFB3D1] border border-[#FF85BB]' : ''}
                      ${!isToday && !isSelected ? 'text-[#021A54] dark:text-zinc-200 hover:bg-[#FFF0F6] dark:hover:bg-zinc-800' : ''}
                    `}
                  >
                    <span>{dayNum}</span>
                    {hasDot && (
                      <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Summary Box */}
          {(() => {
            const sYyyy = selectedCalDate.getFullYear();
            const sMm = String(selectedCalDate.getMonth() + 1).padStart(2, '0');
            const sDd = String(selectedCalDate.getDate()).padStart(2, '0');
            const selectedDateStr = `${sYyyy}-${sMm}-${sDd}`;
            const tasksOnSelectedDate = data.quickTasks.filter(t => t.dueDate === selectedDateStr);

            return (
              <div className="p-3 bg-[#FFF0F6]/60 dark:bg-[#22131D]/60 rounded-2xl border border-[#FFCEE3] dark:border-[#4A2038] text-xs space-y-1.5">
                <div className="font-bold text-[#021A54] dark:text-zinc-100 text-[11px] flex items-center justify-between">
                  <span>{selectedCalDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span className="text-[10px] text-[#FF85BB] font-semibold">{classesOnSelectedDate.length} Classes • {tasksOnSelectedDate.length} Tasks</span>
                </div>

                {countdownsOnSelectedDate.length > 0 && (
                  <div className="space-y-1">
                    {countdownsOnSelectedDate.map(c => (
                      <div key={c.id} className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Flame size={10} />
                        <span className="truncate">{c.title} (Target)</span>
                      </div>
                    ))}
                  </div>
                )}

                {tasksOnSelectedDate.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-[#021A54] dark:text-zinc-200">Due Assignments / Tasks:</div>
                    {tasksOnSelectedDate.map(t => (
                      <div key={t.id} className="text-[10px] font-semibold text-[#021A54]/80 dark:text-zinc-300 flex items-center gap-1.5 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full ${t.completed ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className={t.completed ? 'line-through opacity-60 truncate' : 'truncate'}>{t.title}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#FFCEE3] dark:bg-[#321323] text-[#021A54] dark:text-[#FFB3D1]">{t.category}</span>
                      </div>
                    ))}
                  </div>
                )}

                {classesOnSelectedDate.length > 0 && (
                  <div className="text-[10px] text-[#021A54]/70 dark:text-zinc-300 space-y-0.5 pt-0.5">
                    <div className="font-bold text-[#021A54] dark:text-zinc-200">Scheduled Classes:</div>
                    {classesOnSelectedDate.map(slot => {
                      const course = data.courses.find(c => c.id === slot.courseId);
                      return (
                        <div key={slot.id} className="truncate">
                          • {course ? course.code : (slot.customTitle || 'Class')} ({format12HourTime(slot.startTime)})
                        </div>
                      );
                    })}
                  </div>
                )}

                {classesOnSelectedDate.length === 0 && tasksOnSelectedDate.length === 0 && countdownsOnSelectedDate.length === 0 && (
                  <p className="text-[10px] text-[#021A54]/50 dark:text-zinc-400 italic">No scheduled events or task deadlines for this date.</p>
                )}

                {/* Button to add Event/Task for selected date */}
                <button
                  onClick={() => setIsAddEventModalOpen(true)}
                  className="w-full mt-2 py-1.5 px-2 rounded-xl bg-[#021A54] dark:bg-[#FF85BB] hover:bg-[#FF85BB] dark:hover:bg-[#FF65A5] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Plus size={13} />
                  <span>Add Event for {selectedCalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </button>
              </div>
            );
          })()}
        </div>

        {/* Quick Add Event Modal for Dashboard Calendar */}
        <AnimatePresence>
          {isAddEventModalOpen && (
            <div className="fixed inset-0 bg-[#021A54]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-[#121212] w-full max-w-sm rounded-3xl p-6 border border-[#FFCEE3] dark:border-[#222222] shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222]">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-[#FF85BB]" />
                    <h3 className="text-sm font-bold text-[#021A54] dark:text-zinc-100">
                      New Event ({selectedCalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsAddEventModalOpen(false)}
                    className="p-1 rounded-xl hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 text-[#021A54]/60 dark:text-zinc-300"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!eventModalTitle.trim()) return;

                    const sYyyy = selectedCalDate.getFullYear();
                    const sMm = String(selectedCalDate.getMonth() + 1).padStart(2, '0');
                    const sDd = String(selectedCalDate.getDate()).padStart(2, '0');
                    const dateStr = `${sYyyy}-${sMm}-${sDd}`;

                    addQuickTask({
                      title: eventModalTitle.trim(),
                      category: eventModalCategory,
                      priority: 'medium',
                      dueDate: dateStr,
                      time: eventModalTime || undefined,
                      isEvent: eventModalIsEvent
                    });

                    setEventModalTitle('');
                    setEventModalTime('');
                    setIsAddEventModalOpen(false);
                    confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
                  }}
                  className="space-y-3 text-xs font-semibold"
                >
                  <div>
                    <label className="block text-[#021A54]/70 dark:text-zinc-300 mb-1">Event / Task Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Science Fair Presentation"
                      value={eventModalTitle}
                      onChange={(e) => setEventModalTitle(e.target.value)}
                      className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[#021A54]/70 dark:text-zinc-300 mb-1">Time (Optional)</label>
                      <input
                        type="time"
                        value={eventModalTime}
                        onChange={(e) => setEventModalTime(e.target.value)}
                        className="w-full p-2 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[#021A54]/70 dark:text-zinc-300 mb-1">Category</label>
                      <select
                        value={eventModalCategory}
                        onChange={(e) => setEventModalCategory(e.target.value)}
                        className="w-full p-2 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200"
                      >
                        {(data.settings.taskCategories || ["Academic", "Assignment", "Exam Prep", "Personal", "Project"]).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#FFF0F6] dark:bg-[#22131D] rounded-2xl border border-[#FFCEE3] dark:border-[#4A2038]">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-[#021A54] dark:text-zinc-200">
                      <input
                        type="checkbox"
                        checked={eventModalIsEvent}
                        onChange={(e) => setEventModalIsEvent(e.target.checked)}
                        className="rounded-md border-[#FF85BB] text-[#FF85BB] focus:ring-0"
                      />
                      <span>Highlight as Calendar Event</span>
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddEventModalOpen(false)}
                      className="px-4 py-2 rounded-2xl border border-[#021A54]/20 dark:border-[#222222] text-[#021A54] dark:text-zinc-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-2xl bg-[#FF85BB] text-white font-bold shadow-xs"
                    >
                      Save Event
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Today's Schedule Card */}
        <div className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222]">
            <div className="flex items-center gap-2">
              <CalendarIcon size={18} className="text-[#FF85BB]" />
              <h2 className="text-sm font-bold text-[#021A54] dark:text-zinc-100">Today's Classes ({todayName})</h2>
            </div>
            <button
              onClick={() => setActiveTab('timetable')}
              className="text-xs font-bold text-[#FF85BB] hover:underline flex items-center gap-1"
            >
              <span>Full Schedule</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {todayClasses.length > 0 ? (
            <div className="space-y-3">
              {todayClasses.map(slot => {
                const course = data.courses.find(c => c.id === slot.courseId);
                const title = course ? `${course.code} - ${course.name}` : (slot.customTitle || 'Class Event');
                const room = course ? course.room : slot.customRoom;
                const color = slot.customColor || (course ? course.color : '#FFCEE3');

                return (
                  <div
                    key={slot.id}
                    style={{ backgroundColor: color.startsWith('#') ? color + '15' : undefined }}
                    className="p-4 rounded-2xl border-l-4 border-l-[#FF85BB] border border-[#FFCEE3] dark:border-[#222222] flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {course && course.icon && (
                          <span className="text-sm">{course.icon}</span>
                        )}
                        <span className="text-xs font-bold text-[#021A54] dark:text-zinc-100 truncate">{title}</span>
                      </div>
                      {room && (
                        <div className="flex items-center gap-1 text-[11px] text-[#021A54]/60 dark:text-zinc-400 font-semibold">
                          <MapPin size={12} className="text-[#FF85BB] shrink-0" />
                          <span className="truncate">{room}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-[#021A54] dark:text-zinc-200 px-3 py-1 rounded-full bg-white dark:bg-[#1A1A1A] border border-[#FFCEE3] dark:border-[#222222]">
                        {format12HourTime(slot.startTime)} - {format12HourTime(slot.endTime)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#F5F5F5] dark:bg-black rounded-2xl border border-dashed border-[#FFCEE3] dark:border-[#222222] text-xs text-[#021A54]/60 dark:text-zinc-400">
              <Sparkles size={28} className="mx-auto text-[#FF85BB] mb-2" />
              <p className="font-bold text-[#021A54] dark:text-zinc-200">No classes scheduled for {todayName}!</p>
              <p className="mt-0.5 text-[11px]">Enjoy your free time or work on study notes.</p>
            </div>
          )}
        </div>

        {/* Quick Tasks Widget */}
        <div className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222] mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare size={18} className="text-[#FF85BB]" />
                <h2 className="text-sm font-bold text-[#021A54] dark:text-zinc-100">Quick Checklist</h2>
              </div>
              <button
                onClick={() => setActiveTab('planner')}
                className="text-xs font-bold text-[#FF85BB] hover:underline"
              >
                View All
              </button>
            </div>

            {/* Quick Add Task Form */}
            <form onSubmit={handleAddTask} className="flex items-center gap-2 mb-3">
              <input
                type="text"
                placeholder="New quick task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 p-2 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-xs font-semibold text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="p-2 rounded-2xl bg-[#FF85BB] text-white font-bold text-xs"
              >
                <Plus size={16} />
              </motion.button>
            </form>

            {/* Task Items */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {data.quickTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskCheck(task.id, task.completed)}
                  className={`
                    p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs font-semibold
                    ${task.completed 
                      ? 'bg-gray-50 dark:bg-[#181818] border-gray-200 dark:border-[#222222] text-[#021A54]/40 dark:text-zinc-500 line-through' 
                      : 'bg-[#FFF0F6]/40 dark:bg-[#22131D]/40 border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200 hover:bg-[#FFF0F6] dark:hover:bg-[#22131D]'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {task.completed ? (
                      <CheckCircle2 size={16} className="text-[#FF85BB] shrink-0" />
                    ) : (
                      <Circle size={16} className="text-[#021A54]/30 dark:text-zinc-500 shrink-0" />
                    )}
                    <span className="truncate">{task.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteQuickTask(task.id);
                    }}
                    className="p-1 text-gray-300 dark:text-zinc-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
