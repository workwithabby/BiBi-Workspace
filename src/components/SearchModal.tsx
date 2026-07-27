import React, { useState, useEffect } from 'react';
import { Search, X, FileText, BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ActiveTab, format12HourTime } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectNote: (noteId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  onSelectNote,
}) => {
  const { data } = useWorkspace();
  const [query, setQuery] = useState('');

  // Close on ESC key or ⌘K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Results matching
  const matchedNotes = data.notes.filter(n => {
    if (!q) return true;
    return n.title.toLowerCase().includes(q) ||
           n.tags.some(t => t.toLowerCase().includes(q)) ||
           n.blocks.some(b => b.content.toLowerCase().includes(q));
  }).slice(0, 5);

  const matchedCourses = data.courses.filter(c => {
    if (!q) return true;
    return c.code.toLowerCase().includes(q) ||
           c.name.toLowerCase().includes(q) ||
           c.instructor.toLowerCase().includes(q);
  }).slice(0, 4);

  const matchedSlots = data.timetableSlots.filter(s => {
    if (!q) return false; // only show slots when searching
    const course = data.courses.find(c => c.id === s.courseId);
    const title = course ? `${course.code} ${course.name}` : (s.customTitle || '');
    return title.toLowerCase().includes(q) || s.day.toLowerCase().includes(q);
  }).slice(0, 4);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-[#021A54]/40 dark:bg-black/80 backdrop-blur-xs z-50 flex items-start justify-center pt-20 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#121212] w-full max-w-xl rounded-3xl border border-[#FFCEE3] dark:border-[#222222] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <div className="p-4 border-b border-[#FFCEE3]/60 dark:border-[#222222] flex items-center gap-3">
            <Search size={18} className="text-[#FF85BB]" />
            <input
              type="text"
              autoFocus
              placeholder="Search notes, courses, timetable classes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-sm font-semibold text-[#021A54] dark:text-zinc-100 placeholder-[#021A54]/40 dark:placeholder-zinc-500 outline-hidden bg-transparent"
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[#F5F5F5] dark:hover:bg-[#222222] text-[#021A54]/60 dark:text-zinc-400"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Results Area */}
          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4 text-xs font-semibold">
            {/* Notes Match */}
            {matchedNotes.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-[#021A54]/50 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <FileText size={12} className="text-[#FF85BB]" />
                  <span>Notes ({matchedNotes.length})</span>
                </div>
                <div className="space-y-1">
                  {matchedNotes.map(note => (
                    <div
                      key={note.id}
                      onClick={() => {
                        onSelectNote(note.id);
                        setActiveTab('note-detail');
                        onClose();
                      }}
                      className="p-2.5 rounded-2xl hover:bg-[#FFF0F6] dark:hover:bg-[#22131D] cursor-pointer flex items-center justify-between text-[#021A54] dark:text-zinc-200 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-[#FF85BB]" />
                        <span className="truncate font-bold">{note.title || 'Untitled Note'}</span>
                      </div>
                      <ArrowRight size={14} className="text-[#FF85BB]" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Courses Match */}
            {matchedCourses.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-[#021A54]/50 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <BookOpen size={12} className="text-[#FF85BB]" />
                  <span>Courses ({matchedCourses.length})</span>
                </div>
                <div className="space-y-1">
                  {matchedCourses.map(course => (
                    <div
                      key={course.id}
                      onClick={() => {
                        setActiveTab('courses');
                        onClose();
                      }}
                      className="p-2.5 rounded-2xl hover:bg-[#FFF0F6] dark:hover:bg-[#22131D] cursor-pointer flex items-center justify-between text-[#021A54] dark:text-zinc-200 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen size={14} className="text-[#FF85BB]" />
                        <span className="font-bold">{course.code} - {course.name}</span>
                      </div>
                      <span className="text-[10px] text-[#021A54]/50 dark:text-zinc-400">{course.room}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timetable Slot Match */}
            {matchedSlots.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-[#021A54]/50 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Calendar size={12} className="text-[#FF85BB]" />
                  <span>Class Slots ({matchedSlots.length})</span>
                </div>
                <div className="space-y-1">
                  {matchedSlots.map(slot => {
                    const course = data.courses.find(c => c.id === slot.courseId);
                    const title = course ? `${course.code} - ${course.name}` : (slot.customTitle || 'Class');
                    return (
                      <div
                        key={slot.id}
                        onClick={() => {
                          setActiveTab('timetable');
                          onClose();
                        }}
                        className="p-2.5 rounded-2xl hover:bg-[#FFF0F6] dark:hover:bg-[#22131D] cursor-pointer flex items-center justify-between text-[#021A54] dark:text-zinc-200 transition-colors"
                      >
                        <span className="font-bold">{title} ({slot.day})</span>
                        <span className="text-[10px] text-[#021A54]/50 dark:text-zinc-400">{format12HourTime(slot.startTime)} - {format12HourTime(slot.endTime)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {matchedNotes.length === 0 && matchedCourses.length === 0 && matchedSlots.length === 0 && (
              <div className="p-8 text-center text-[#021A54]/50 dark:text-zinc-400">
                No results found for "{query}"
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
