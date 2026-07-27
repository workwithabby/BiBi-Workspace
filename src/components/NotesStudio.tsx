import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Pin, 
  Grid, 
  List as ListIcon,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Note } from '../types';

interface NotesStudioProps {
  onSelectNote: (id: string) => void;
  onNewNote: (courseId?: string) => void;
}

export const NotesStudio: React.FC<NotesStudioProps> = ({ onSelectNote, onNewNote }) => {
  const { data, togglePinNote, deleteNote } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Collect all unique tags
  const allTags = Array.from(new Set(data.notes.flatMap(n => n.tags)));

  const filteredNotes = data.notes.filter(note => {
    if (note.archived) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = note.title.toLowerCase().includes(q);
      const tagMatch = note.tags.some(t => t.toLowerCase().includes(q));
      const contentMatch = note.blocks.some(b => b.content.toLowerCase().includes(q));
      if (!titleMatch && !tagMatch && !contentMatch) return false;
    }

    // Tag filter
    if (selectedTag !== 'all' && !note.tags.includes(selectedTag)) return false;

    // Course filter
    if (selectedCourse !== 'all' && note.courseId !== selectedCourse) return false;

    return true;
  });

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.pinned);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-12"
    >
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={22} className="text-[#FF85BB]" />
            <h1 className="text-xl font-bold text-[#021A54] dark:text-zinc-100">Notes</h1>
            <span className="text-xs bg-[#FFCEE3] dark:bg-[#4A2038] text-[#021A54] dark:text-[#FFB3D1] px-2.5 py-0.5 rounded-full font-semibold">
              {data.notes.length} Total Notes
            </span>
          </div>
          <p className="text-xs text-[#021A54]/70 dark:text-zinc-300">
            Create clean notes with rich block formatting, tags, and course associations.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onNewNote()}
          className="px-4 py-2.5 rounded-2xl bg-[#021A54] dark:bg-[#FF85BB] hover:bg-[#FF85BB] dark:hover:bg-[#FF65A5] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          <span>New Note</span>
        </motion.button>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-white dark:bg-[#121212] p-4 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#FF85BB]" />
          <input
            type="text"
            placeholder="Search notes by title, tag, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3]/60 dark:border-[#222222] text-xs font-semibold text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
          />
        </div>

        {/* Course Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="p-2 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3]/60 dark:border-[#222222] text-xs font-semibold text-[#021A54] dark:text-zinc-200 focus:outline-hidden"
          >
            <option value="all">All Courses</option>
            {data.courses.map(c => (
              <option key={c.id} value={c.id}>{c.code}</option>
            ))}
          </select>

          {/* Tag Filter */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="p-2 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3]/60 dark:border-[#222222] text-xs font-semibold text-[#021A54] dark:text-zinc-200 focus:outline-hidden"
          >
            <option value="all">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>#{tag}</option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-[#F5F5F5] dark:bg-black p-1 rounded-2xl border border-[#FFCEE3]/60 dark:border-[#222222]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-[#FFCEE3] dark:bg-[#4A2038] text-[#021A54] dark:text-[#FFB3D1]' : 'text-[#021A54]/50 dark:text-zinc-400'}`}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xl transition-colors ${viewMode === 'list' ? 'bg-[#FFCEE3] dark:bg-[#4A2038] text-[#021A54] dark:text-[#FFB3D1]' : 'text-[#021A54]/50 dark:text-zinc-400'}`}
              title="List View"
            >
              <ListIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#021A54] dark:text-zinc-200 px-1">
            <Pin size={13} className="text-[#FF85BB] fill-[#FF85BB]" />
            <span>Pinned Notes ({pinnedNotes.length})</span>
          </div>

          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
            <AnimatePresence>
              {pinnedNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  viewMode={viewMode}
                  onSelect={() => onSelectNote(note.id)}
                  onTogglePin={() => togglePinNote(note.id)}
                  onDelete={() => deleteNote(note.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* All Notes Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#021A54] dark:text-zinc-200 px-1">
          <span>All Notes ({unpinnedNotes.length})</span>
          <span className="text-[10px] text-[#021A54]/50 dark:text-zinc-400">Sorted by recently updated</span>
        </div>

        {unpinnedNotes.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
            <AnimatePresence>
              {unpinnedNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  viewMode={viewMode}
                  onSelect={() => onSelectNote(note.id)}
                  onTogglePin={() => togglePinNote(note.id)}
                  onDelete={() => deleteNote(note.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#121212] p-12 rounded-3xl border border-dashed border-[#FFCEE3] dark:border-[#222222] text-center text-xs text-[#021A54]/60 dark:text-zinc-300">
            <FileText size={36} className="mx-auto text-[#FF85BB] mb-2" />
            <p className="font-bold text-[#021A54] dark:text-zinc-100">No notes matching your search!</p>
            <button
              onClick={() => onNewNote()}
              className="mt-3 px-4 py-2 rounded-2xl bg-[#FFCEE3] dark:bg-[#4A2038] text-[#021A54] dark:text-[#FFB3D1] font-bold text-xs hover:bg-[#FF85BB] hover:text-white transition-all"
            >
              + Create First Note
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Sub-component for individual note card
const NoteCard: React.FC<{
  note: Note;
  viewMode: 'grid' | 'list';
  onSelect: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}> = ({ note, viewMode, onSelect, onTogglePin, onDelete }) => {
  const { data } = useWorkspace();
  const course = note.courseId ? data.courses.find(c => c.id === note.courseId) : null;
  const snippet = note.blocks.find(b => b.type === 'paragraph' || b.type === 'heading-1')?.content || 'No text snippet';

  if (viewMode === 'list') {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        whileHover={{ x: 3 }}
        onClick={onSelect}
        className="p-3.5 rounded-2xl bg-white dark:bg-[#121212] border border-[#FFCEE3] dark:border-[#222222] hover:border-[#FF85BB] hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#FFF0F6] dark:bg-[#2A1828] border border-[#FFCEE3] dark:border-[#4A2038] flex items-center justify-center shrink-0">
            <FileText size={16} className="text-[#FF85BB]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-[#021A54] dark:text-zinc-100 truncate group-hover:text-[#FF85BB] transition-colors">
              {note.title || 'Untitled Note'}
            </h3>
            <p className="text-[10px] text-[#021A54]/50 dark:text-zinc-400 truncate">{snippet}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {course && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF0F6] dark:bg-[#2A1828] text-[#021A54] dark:text-[#FFB3D1] font-semibold border border-[#FFCEE3] dark:border-[#4A2038]">
              {course.icon ? `${course.icon} ${course.code}` : course.code}
            </span>
          )}
          <span className="text-[10px] text-[#021A54]/40 dark:text-zinc-400">{note.updatedAt}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className="p-1.5 rounded-lg hover:bg-[#FFCEE3] dark:hover:bg-zinc-800"
            title={note.pinned ? "Unpin" : "Pin"}
          >
            <Pin size={13} className={note.pinned ? 'fill-[#FF85BB] text-[#FF85BB]' : 'text-[#021A54]/40 dark:text-zinc-500'} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Delete Note"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      className="p-5 rounded-3xl border border-[#FFCEE3] dark:border-[#222222] bg-white dark:bg-[#121212] hover:border-[#FF85BB] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group h-full space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF0F6] dark:bg-[#2A1828] border border-[#FFCEE3] dark:border-[#4A2038] flex items-center justify-center text-[#FF85BB] shrink-0 group-hover:scale-105 transition-transform">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#021A54] dark:text-zinc-100 line-clamp-1 group-hover:text-[#FF85BB] transition-colors">
              {note.title || 'Untitled Note'}
            </h3>
            <span className="text-[10px] text-[#021A54]/40 dark:text-zinc-400">{note.updatedAt}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className="p-1.5 rounded-full hover:bg-[#FFCEE3]/50 dark:hover:bg-zinc-800 text-[#021A54] dark:text-zinc-300 transition-colors shrink-0"
            title={note.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={13} className={note.pinned ? 'fill-[#FF85BB] text-[#FF85BB]' : 'text-[#021A54]/40 dark:text-zinc-500'} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition-colors shrink-0"
            title="Delete Note"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-[#021A54]/70 dark:text-zinc-300 line-clamp-3 leading-relaxed">
        {snippet}
      </p>

      {/* Footer Meta */}
      <div className="pt-3 border-t border-[#FFCEE3]/50 dark:border-[#222222] flex items-center justify-between text-[10px] font-semibold text-[#021A54]">
        <div className="flex items-center gap-1.5 truncate">
          {course ? (
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFCEE3]/50 dark:bg-[#2A1828] text-[#021A54] dark:text-[#FFB3D1] border border-transparent dark:border-[#4A2038]">
              {course.icon ? `${course.icon} ${course.code}` : course.code}
            </span>
          ) : (
            <span className="text-[#021A54]/50 dark:text-zinc-400">#{note.tags[0] || 'General'}</span>
          )}
        </div>
        <span className="text-[#FF85BB] font-bold opacity-0 group-hover:opacity-100 transition-opacity">Open Note →</span>
      </div>
    </motion.div>
  );
};
