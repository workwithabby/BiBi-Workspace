import React, { useState, useRef } from 'react';
import { 
  Download, 
  Plus, 
  MapPin, 
  User, 
  Trash2, 
  Calendar as CalendarIcon, 
  Filter,
  X,
  Check,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspace } from '../context/WorkspaceContext';
import { DayOfWeek, TimetableSlot, format12HourTime } from '../types';
import * as htmlToImage from 'html-to-image';
import confetti from 'canvas-confetti';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const HEIGHT_PER_30MIN = 56; // 56px height per 30-minute block

interface PositionedSlot {
  slot: TimetableSlot;
  topPx: number;
  heightPx: number;
  leftPercent: number;
  widthPercent: number;
}

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const clean = timeStr.trim().toLowerCase();
  const isPm = clean.includes('pm');
  const isAm = clean.includes('am');
  const parts = clean.replace(/(am|pm)/g, '').trim().split(':');
  
  let h = parseInt(parts[0], 10);
  if (isNaN(h)) h = 0;
  let m = parseInt(parts[1], 10);
  if (isNaN(m)) m = 0;

  if (isPm && h < 12) h += 12;
  if (isAm && h === 12) h = 0;

  return h * 60 + m;
};

export const Timetable: React.FC = () => {
  const { data, addTimetableSlot, updateTimetableSlot, deleteTimetableSlot } = useWorkspace();
  const timetableRef = useRef<HTMLDivElement>(null);

  const [showWeekend, setShowWeekend] = useState(false);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [isDownloading, setIsDownloading] = useState(false);

  // Compute dynamic start and end hours based on all timetable slots
  let minHour = 8;  // Default 8:00 AM
  let maxHour = 20; // Default 8:30 PM (20:30)

  data.timetableSlots.forEach(slot => {
    const sMin = timeToMinutes(slot.startTime);
    const eMin = timeToMinutes(slot.endTime);
    if (!isNaN(sMin) && sMin >= 0) {
      const sHour = Math.floor(sMin / 60);
      if (sHour < minHour) minHour = Math.max(4, sHour); // Support down to 4:00 AM
    }
    if (!isNaN(eMin) && eMin > 0) {
      const eHour = Math.ceil(eMin / 60);
      if (eHour > maxHour) maxHour = Math.min(23, eHour); // Support up to 23:30
    }
  });

  const dynamicStartDayMinutes = minHour * 60;

  // Generate 30-minute time slots from minHour:00 to maxHour:30
  const dynamicTimeSlots: string[] = [];
  for (let h = minHour; h <= maxHour; h++) {
    const hh = h.toString().padStart(2, '0');
    dynamicTimeSlots.push(`${hh}:00`);
    dynamicTimeSlots.push(`${hh}:30`);
  }

  // Modal State for Add/Edit Slot
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);

  // Conflict Modal State
  const [conflictModalData, setConflictModalData] = useState<{
    conflictingSlotTitle: string;
    conflictingTime: string;
    day: string;
    reason?: string;
  } | null>(null);

  // Form State
  const [formDay, setFormDay] = useState<DayOfWeek>('Monday');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:15');
  const [formCourseId, setFormCourseId] = useState<string>('custom');
  const [formCustomTitle, setFormCustomTitle] = useState('');
  const [formCustomRoom, setFormCustomRoom] = useState('');
  const [formCustomColor, setFormCustomColor] = useState('#FFCEE3');
  const [formNotes, setFormNotes] = useState('');

  const activeDays = showWeekend ? DAYS : DAYS.slice(0, 5);

  const openAddModal = (day: DayOfWeek = 'Monday', time: string = '09:00') => {
    setEditingSlot(null);
    setFormDay(day);
    setFormStartTime(time);
    // Default end time 1 hour later (60 minutes)
    const startMin = timeToMinutes(time);
    const endMin = startMin + 60;
    const endH = Math.floor(endMin / 60).toString().padStart(2, '0');
    const endM = (endMin % 60).toString().padStart(2, '0');
    setFormEndTime(`${endH}:${endM}`);
    const initialCourseId = data.courses[0]?.id || 'custom';
    setFormCourseId(initialCourseId);
    setFormCustomTitle('');
    setFormCustomRoom('');
    const initialCourse = data.courses.find(c => c.id === initialCourseId);
    setFormCustomColor(initialCourse ? initialCourse.color : '#FF85BB');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setFormDay(slot.day);
    setFormStartTime(slot.startTime);
    setFormEndTime(slot.endTime);
    const courseId = slot.courseId || 'custom';
    setFormCourseId(courseId);
    setFormCustomTitle(slot.customTitle || '');
    setFormCustomRoom(slot.customRoom || '');
    const course = data.courses.find(c => c.id === courseId);
    setFormCustomColor(slot.customColor || (course ? course.color : '#FF85BB'));
    setFormNotes(slot.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();

    const newStart = timeToMinutes(formStartTime);
    const newEnd = timeToMinutes(formEndTime);

    if (newEnd <= newStart) {
      setConflictModalData({
        conflictingSlotTitle: 'Invalid Time Duration',
        conflictingTime: `${format12HourTime(formStartTime)} - ${format12HourTime(formEndTime)}`,
        day: formDay,
        reason: 'The end time must be later than the start time.'
      });
      return;
    }

    // Check for overlapping classes on the same day
    const conflicting = data.timetableSlots.find(s => {
      if (editingSlot && s.id === editingSlot.id) return false;
      if (s.day !== formDay) return false;
      const sStart = timeToMinutes(s.startTime);
      const sEnd = timeToMinutes(s.endTime);
      return Math.max(sStart, newStart) < Math.min(sEnd, newEnd);
    });

    if (conflicting) {
      const course = data.courses.find(c => c.id === conflicting.courseId);
      const conflictingTitle = course ? `${course.code}: ${course.name}` : (conflicting.customTitle || 'Existing Class');
      const conflictingTime = `${format12HourTime(conflicting.startTime)} - ${format12HourTime(conflicting.endTime)}`;

      setConflictModalData({
        conflictingSlotTitle: conflictingTitle,
        conflictingTime,
        day: formDay,
        reason: `Overlaps with another class schedule on ${formDay}`
      });
      return;
    }

    const isCustom = formCourseId === 'custom';
    const slotPayload: Omit<TimetableSlot, 'id'> = {
      day: formDay,
      startTime: formStartTime,
      endTime: formEndTime,
    };

    if (!isCustom) {
      slotPayload.courseId = formCourseId;
    } else {
      slotPayload.customTitle = formCustomTitle.trim() || 'Activity';
      if (formCustomRoom.trim()) slotPayload.customRoom = formCustomRoom.trim();
    }

    if (formCustomColor) slotPayload.customColor = formCustomColor;
    if (formNotes.trim()) slotPayload.notes = formNotes.trim();

    if (editingSlot) {
      updateTimetableSlot({ ...slotPayload, id: editingSlot.id });
    } else {
      addTimetableSlot(slotPayload);
    }

    setIsModalOpen(false);
  };

  const handleDeleteSlot = (id: string) => {
    deleteTimetableSlot(id);
    setIsModalOpen(false);
  };

  // Download Schedule Image Feature
  const handleDownloadImage = async () => {
    if (!timetableRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await htmlToImage.toPng(timetableRef.current, {
        quality: 0.95,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#000000' : '#FFFFFF',
        cacheBust: true,
        style: {
          padding: '24px',
          borderRadius: '24px',
        }
      });
      
      const link = document.createElement('a');
      link.download = `Weekly_Class_Timetable_${data.settings.userName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();

      // Trigger celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF85BB', '#FFCEE3', '#021A54', '#FFD166']
      });
    } catch (error) {
      console.error('Failed downloading timetable image:', error);
      alert('Could not generate image download. Please try again or use the Print button!');
    } finally {
      setIsDownloading(false);
    }
  };

  // Print schedule feature
  const handlePrint = () => {
    window.print();
  };

  // Calculate absolute positioned slots for a given day based on start time & duration
  const getPositionedSlotsForDay = (day: DayOfWeek): PositionedSlot[] => {
    const daySlots = data.timetableSlots.filter(slot => {
      if (slot.day !== day) return false;

      // Filter by course if selected
      if (selectedCourseFilter !== 'all') {
        if (selectedCourseFilter === 'custom' && slot.courseId) return false;
        if (selectedCourseFilter !== 'custom' && slot.courseId !== selectedCourseFilter) return false;
      }

      return true;
    });

    const processed = daySlots.map(slot => {
      let start = timeToMinutes(slot.startTime);
      let end = timeToMinutes(slot.endTime);
      if (end <= start) end = start + 30; // minimum 30 mins
      return { slot, start, end };
    }).sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // Group overlapping slots into clusters
    const clusters: typeof processed[] = [];
    let currentCluster: typeof processed = [];
    let clusterEnd = -1;

    for (const item of processed) {
      if (currentCluster.length === 0) {
        currentCluster.push(item);
        clusterEnd = item.end;
      } else if (item.start < clusterEnd) {
        currentCluster.push(item);
        if (item.end > clusterEnd) clusterEnd = item.end;
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
        clusterEnd = item.end;
      }
    }
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    const results: PositionedSlot[] = [];

    for (const cluster of clusters) {
      const columns: number[] = [];
      const clusterPositions: { item: typeof processed[0]; col: number }[] = [];

      for (const item of cluster) {
        let placed = false;
        for (let c = 0; c < columns.length; c++) {
          if (columns[c] <= item.start) {
            columns[c] = item.end;
            clusterPositions.push({ item, col: c });
            placed = true;
            break;
          }
        }
        if (!placed) {
          clusterPositions.push({ item, col: columns.length });
          columns.push(item.end);
        }
      }

      const totalCols = columns.length;
      for (const pos of clusterPositions) {
        const { item, col } = pos;
        const topPx = Math.max(0, ((item.start - dynamicStartDayMinutes) / 30) * HEIGHT_PER_30MIN);
        const heightPx = Math.max(34, ((item.end - item.start) / 30) * HEIGHT_PER_30MIN - 8);
        const widthPercent = 100 / totalCols;
        const leftPercent = col * widthPercent;

        results.push({
          slot: item.slot,
          topPx,
          heightPx,
          leftPercent,
          widthPercent
        });
      }
    }

    return results;
  };

  // Time suggestions for datalist from 06:00 to 22:00
  const timeSuggestions: string[] = [];
  for (let h = 6; h <= 22; h++) {
    const hh = h.toString().padStart(2, '0');
    timeSuggestions.push(`${hh}:00`);
    timeSuggestions.push(`${hh}:30`);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-12"
    >
      {/* Top Banner / Actions Header */}
      <div className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon size={22} className="text-[#FF85BB]" />
            <h1 className="text-xl font-bold text-[#021A54] dark:text-zinc-100">Class Schedule</h1>
            <span className="text-xs bg-[#FFCEE3] dark:bg-[#321323] text-[#021A54] dark:text-[#FFB3D1] px-2.5 py-0.5 rounded-full font-semibold border border-transparent dark:border-[#4A2038]">
              Weekly
            </span>
          </div>
          <p className="text-xs text-[#021A54]/70 dark:text-zinc-300">
            Organize your courses, times, and rooms. Export or download as a clean PNG image!
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Weekend */}
          <button
            onClick={() => setShowWeekend(!showWeekend)}
            className="px-3 py-2 rounded-2xl border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200 hover:bg-[#FFCEE3]/20 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <CalendarIcon size={14} className="text-[#FF85BB]" />
            <span>{showWeekend ? 'Hide Weekend' : '+ Weekend (Sat-Sun)'}</span>
          </button>

          {/* Filter by course */}
          <div className="relative flex items-center">
            <Filter size={13} className="absolute left-3 text-[#FF85BB]" />
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3]/60 dark:border-[#222222] text-[#021A54] dark:text-zinc-200 text-xs font-semibold focus:outline-hidden focus:border-[#FF85BB]"
            >
              <option value="all">All Courses & Events</option>
              {data.courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
              <option value="custom">Custom Activities Only</option>
            </select>
          </div>

          {/* Download Image PNG */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="px-4 py-2 rounded-2xl bg-[#FFCEE3] dark:bg-[#321323] hover:bg-[#FF85BB] dark:hover:bg-[#FF65A5] text-[#021A54] dark:text-[#FFB3D1] hover:text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 group border border-transparent dark:border-[#4A2038]"
            title="Download high-res PNG image of timetable"
          >
            <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
            <span>{isDownloading ? 'Generating...' : 'Download Image'}</span>
          </motion.button>

          {/* Add Slot Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openAddModal()}
            className="px-4 py-2 rounded-2xl bg-[#021A54] dark:bg-[#FF85BB] hover:bg-[#FF85BB] dark:hover:bg-[#FF65A5] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Add Class</span>
          </motion.button>
        </div>
      </div>

      {/* Main Timetable Canvas Grid */}
      <div className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs print-area overflow-x-auto" ref={timetableRef}>
        {/* Printable Title Banner */}
        <div className="mb-4 pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#021A54] dark:text-zinc-100 flex items-center gap-2">
              <span>{data.settings.userName}'s Schedule</span>
            </h2>
            <p className="text-[11px] text-[#021A54]/60 dark:text-zinc-400">Semester Overview</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FFCEE3]/50 dark:bg-[#321323] text-[#021A54] dark:text-[#FFB3D1] border border-transparent dark:border-[#4A2038]">
              {data.courses.length} Active Courses
            </span>
          </div>
        </div>

        {/* Timetable Table Grid */}
        <div className="min-w-[700px]">
          {/* Header Row Days */}
          <div className={`grid ${showWeekend ? 'grid-cols-8' : 'grid-cols-6'} gap-2 mb-2`}>
            <div className="p-2 text-center text-xs font-bold text-[#021A54]/50 dark:text-zinc-400 flex items-center justify-center">
              Time
            </div>
            {activeDays.map((day) => (
              <div 
                key={day}
                className="p-3 bg-[#FFF0F6] dark:bg-[#22131D] border border-[#FFCEE3] dark:border-[#4A2038] rounded-2xl text-center text-xs font-bold text-[#021A54] dark:text-zinc-100 flex flex-col items-center gap-0.5 shadow-2xs"
              >
                <span>{day}</span>
                <span className="text-[10px] text-[#FF85BB] font-normal"></span>
              </div>
            ))}
          </div>

          {/* Grid Container: Time Column + Day Columns */}
          <div className={`grid ${showWeekend ? 'grid-cols-8' : 'grid-cols-6'} gap-2 relative`}>
            {/* Time Label Column */}
            <div className="flex flex-col">
              {dynamicTimeSlots.map((timeSlot) => {
                const isHourMark = timeSlot.endsWith(':00');
                return (
                  <div 
                    key={timeSlot} 
                    style={{ height: `${HEIGHT_PER_30MIN}px` }}
                    className={`p-1.5 text-center text-xs flex flex-col justify-start items-center border-t border-dashed border-[#FFCEE3]/60 dark:border-[#222222] pt-1.5 shrink-0 ${isHourMark ? 'font-bold text-[#021A54] dark:text-zinc-200' : 'font-medium text-[11px] text-[#021A54]/60 dark:text-zinc-400'}`}
                  >
                    <span>{format12HourTime(timeSlot)}</span>
                  </div>
                );
              })}
            </div>

            {/* Day Columns */}
            {activeDays.map((day) => {
              const positionedSlots = getPositionedSlotsForDay(day);

              return (
                <div key={day} className="relative flex flex-col w-full h-full">
                  {/* Background 30-min slot lines & Add buttons */}
                  {dynamicTimeSlots.map((timeSlot) => (
                    <div
                      key={`${day}-${timeSlot}`}
                      style={{ height: `${HEIGHT_PER_30MIN}px` }}
                      className="p-1 rounded-xl bg-[#F5F5F5]/60 dark:bg-black/50 hover:bg-[#FFCEE3]/20 dark:hover:bg-zinc-900 transition-colors border-t border-dashed border-[#FFCEE3]/40 dark:border-[#222222] relative group/cell"
                    >
                      <button
                        onClick={() => openAddModal(day, timeSlot)}
                        className="w-full h-full rounded-lg flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity text-[#FF85BB] hover:bg-[#FFCEE3]/30 dark:hover:bg-zinc-800/50 no-print"
                        title={`Add class on ${day} at ${format12HourTime(timeSlot)}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}

                  {/* Absolute Positioned Class Cards */}
                  {positionedSlots.map(({ slot, topPx, heightPx, leftPercent, widthPercent }) => {
                    const course = data.courses.find(c => c.id === slot.courseId);
                    const displayTitle = course ? course.name : (slot.customTitle || 'Class');
                    const displayRoom = course ? course.room : slot.customRoom;
                    const colorBg = slot.customColor || (course ? course.color : '#FFCEE3');

                    return (
                      <motion.div
                        key={slot.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => openEditModal(slot)}
                        style={{
                          position: 'absolute',
                          top: `${topPx + 4}px`,
                          height: `${heightPx}px`,
                          left: `calc(${leftPercent}% + 4px)`,
                          width: `calc(${widthPercent}% - 8px)`,
                          backgroundColor: colorBg.startsWith('#') ? colorBg + '22' : undefined,
                          borderColor: colorBg.startsWith('#') ? colorBg : '#FF85BB',
                          zIndex: 10,
                        }}
                        className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border-l-4 border-l-[#FF85BB] border-t border-r border-b border-[#FFCEE3] dark:border-[#222222] cursor-pointer hover:shadow-lg transition-all group/card flex flex-col justify-between overflow-hidden shadow-xs backdrop-blur-2xs"
                        title={course ? `${course.code}: ${course.name} (${format12HourTime(slot.startTime)} - ${format12HourTime(slot.endTime)})` : `${displayTitle} (${format12HourTime(slot.startTime)} - ${format12HourTime(slot.endTime)})`}
                      >
                        <div className="min-w-0">
                          {/* Header: Course Code Badge */}
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            {course ? (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#FFCEE3] dark:bg-[#321323] text-[#021A54] dark:text-[#FFB3D1] border border-transparent dark:border-[#4A2038] shrink-0 truncate max-w-full">
                                {course.icon ? `${course.icon} ${course.code}` : course.code}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-[#021A54] dark:text-zinc-300 shrink-0">
                                Event
                              </span>
                            )}
                          </div>

                          {/* Course / Event Name */}
                          <div className="text-[11px] font-bold text-[#021A54] dark:text-zinc-100 leading-tight break-words line-clamp-2 mb-1">
                            {displayTitle}
                          </div>

                          {/* Class Time Row */}
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-[#021A54]/80 dark:text-zinc-300 mb-0.5">
                            <Clock size={10} className="text-[#FF85BB] shrink-0" />
                            <span className="truncate">{format12HourTime(slot.startTime)} - {format12HourTime(slot.endTime)}</span>
                          </div>

                          {/* Room / Location */}
                          {displayRoom && heightPx > 60 && (
                            <div className="flex items-center gap-1 text-[10px] text-[#021A54]/70 dark:text-zinc-400">
                              <MapPin size={10} className="text-[#FF85BB] shrink-0" />
                              <span className="truncate">{displayRoom}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add / Edit Slot Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#021A54]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#121212] w-full max-w-md rounded-3xl p-6 border border-[#FFCEE3] dark:border-[#222222] shadow-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222] mb-4">
                <h3 className="text-base font-bold text-[#021A54] dark:text-zinc-100">
                  {editingSlot ? 'Edit Class Slot' : 'Add Class Slot'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-xl hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 text-[#021A54]/60 dark:text-zinc-300"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveSlot} className="space-y-4 text-xs font-semibold">
                {/* Day Selection */}
                <div>
                  <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Day of Week</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                    className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                {/* Time Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Start Time</label>
                    <input
                      type="time"
                      step="900"
                      list="timetable-time-suggestions"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#021A54] dark:text-zinc-200 mb-1">End Time</label>
                    <input
                      type="time"
                      step="900"
                      list="timetable-time-suggestions"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
                    />
                  </div>
                  <datalist id="timetable-time-suggestions">
                    {timeSuggestions.map(t => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                {/* Course Selector or Custom */}
                <div>
                  <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Course</label>
                  <select
                    value={formCourseId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setFormCourseId(selectedId);
                      if (selectedId !== 'custom') {
                        const found = data.courses.find(c => c.id === selectedId);
                        if (found) setFormCustomColor(found.color);
                      }
                    }}
                    className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
                  >
                    <option value="custom">Custom Event / Study Session</option>
                    {data.courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* If standard course, show professor & room info */}
                {formCourseId !== 'custom' && (() => {
                  const selectedCourse = data.courses.find(c => c.id === formCourseId);
                  if (!selectedCourse) return null;
                  return (
                    <div className="p-3 bg-[#FFF0F6] dark:bg-[#22131D] rounded-2xl border border-[#FFCEE3] dark:border-[#4A2038] space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-[#021A54] dark:text-zinc-200">
                        <User size={14} className="text-[#FF85BB] shrink-0" />
                        <span>Professor / Instructor: <strong className="font-bold">{selectedCourse.instructor || 'Unassigned'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-[#021A54]/80 dark:text-zinc-300">
                        <MapPin size={14} className="text-[#FF85BB] shrink-0" />
                        <span>Classroom / Building: <strong className="font-bold">{selectedCourse.room || 'Unassigned'}</strong></span>
                      </div>
                    </div>
                  );
                })()}

                {/* Custom fields if courseId === 'custom' */}
                {formCourseId === 'custom' && (
                  <div className="space-y-3 p-3 bg-[#FFF0F6] dark:bg-[#22131D] rounded-2xl border border-[#FFCEE3] dark:border-[#4A2038]">
                    <div>
                      <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Course Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Mathematics"
                        value={formCustomTitle}
                        onChange={(e) => setFormCustomTitle(e.target.value)}
                        required
                        className="w-full p-2 rounded-xl bg-white dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Location/Room</label>
                      <input
                        type="text"
                        placeholder="e.g. Room 402"
                        value={formCustomRoom}
                        onChange={(e) => setFormCustomRoom(e.target.value)}
                        className="w-full p-2 rounded-xl bg-white dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
                      />
                    </div>
                  </div>
                )}

                {/* Color Selector - Available for ALL class slots */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[#021A54] dark:text-zinc-200 font-semibold">Card Color</label>
                    {formCourseId !== 'custom' && (() => {
                      const selectedCourse = data.courses.find(c => c.id === formCourseId);
                      if (selectedCourse && formCustomColor !== selectedCourse.color) {
                        return (
                          <button
                            type="button"
                            onClick={() => setFormCustomColor(selectedCourse.color)}
                            className="text-[10px] text-[#FF85BB] hover:underline font-bold"
                          >
                            Reset to Course Default
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="flex items-center flex-wrap gap-2 pt-1">
                    {['#FF85BB', '#FFCEE3', '#021A54', '#E8C5E5', '#A5C4D4', '#C084FC', '#F43F5E', '#10B981', '#F59E0B', '#3B82F6'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormCustomColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${formCustomColor === color ? 'border-[#021A54] dark:border-white scale-110 shadow-xs' : 'border-transparent hover:scale-105'}`}
                        title={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Bring lab coat, review chapter 3"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-[#FFCEE3] dark:border-[#222222]">
                  {editingSlot ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(editingSlot.id)}
                      className="px-3 py-2 rounded-2xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-2xl border border-[#021A54]/20 dark:border-[#222222] text-[#021A54] dark:text-zinc-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-2xl bg-[#FF85BB] hover:bg-[#FF85BB]/90 text-white font-bold shadow-xs flex items-center gap-1"
                    >
                      <Check size={14} />
                      <span>Save Class</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Schedule Overlap Conflict Popup */}
      <AnimatePresence>
        {conflictModalData && (
          <div className="fixed inset-0 bg-[#021A54]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-white dark:bg-[#18181b] w-full max-w-sm rounded-3xl p-6 border-2 border-amber-400/80 shadow-2xl text-center flex flex-col items-center gap-3 relative"
            >
              <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                <AlertTriangle size={30} />
              </div>

              <h4 className="text-base font-extrabold text-[#021A54] dark:text-zinc-100">
                Class Schedule Conflict!
              </h4>

              <p className="text-xs text-[#021A54]/80 dark:text-zinc-300 leading-relaxed">
                You cannot add this class because it overlaps with an existing schedule on <strong className="font-bold text-[#021A54] dark:text-zinc-100">{conflictModalData.day}</strong>.
              </p>

              <div className="w-full p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-left space-y-1">
                <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  Conflicting Schedule:
                </div>
                <div className="text-xs font-extrabold text-[#021A54] dark:text-zinc-100">
                  {conflictModalData.conflictingSlotTitle}
                </div>
                <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1 pt-0.5">
                  <Clock size={12} />
                  <span>{conflictModalData.conflictingTime}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConflictModalData(null)}
                className="w-full mt-1 py-2.5 rounded-2xl bg-[#021A54] dark:bg-zinc-800 text-white font-bold text-xs hover:bg-[#021A54]/90 dark:hover:bg-zinc-700 transition-colors shadow-xs"
              >
                Adjust Class Time
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
