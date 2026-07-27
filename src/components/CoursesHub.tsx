import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  MapPin, 
  User, 
  Clock, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Circle, 
  FileText, 
  Sparkles,
  X,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Course, CourseSyllabusItem, DayOfWeek, format12HourTime } from '../types';

interface CoursesHubProps {
  onOpenNote: (noteId: string) => void;
  onCreateNoteForCourse: (courseId: string) => void;
}

const WEEKDAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const CoursesHub: React.FC<CoursesHubProps> = ({ onOpenNote, onCreateNoteForCourse }) => {
  const { data, addCourse, updateCourse, deleteCourse } = useWorkspace();

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formInstructor, setFormInstructor] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formColor, setFormColor] = useState('#FF85BB');
  const [formCredits, setFormCredits] = useState(3);
  const [formDays, setFormDays] = useState<DayOfWeek[]>(['Monday', 'Wednesday']);
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:15');
  const [formIcon, setFormIcon] = useState('📚');
  const [formSyllabus, setFormSyllabus] = useState<CourseSyllabusItem[]>([]);
  const [newSyllabusTitle, setNewSyllabusTitle] = useState('');

  const openAddCourseModal = () => {
    setEditingCourse(null);
    setFormCode('');
    setFormName('');
    setFormInstructor('');
    setFormRoom('');
    setFormColor('#FF85BB');
    setFormCredits(3);
    setFormDays(['Monday', 'Wednesday']);
    setFormStartTime('09:00');
    setFormEndTime('10:15');
    setFormIcon('📚');
    setFormSyllabus([]);
    setIsModalOpen(true);
  };

  const openEditCourseModal = (course: Course) => {
    setEditingCourse(course);
    setFormCode(course.code);
    setFormName(course.name);
    setFormInstructor(course.instructor);
    setFormRoom(course.room);
    setFormColor(course.color);
    setFormCredits(course.credits);
    setFormDays(course.days);
    setFormStartTime(course.startTime);
    setFormEndTime(course.endTime);
    setFormIcon(course.icon || '📚');
    setFormSyllabus(course.syllabus || []);
    setIsModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      code: formCode || 'COURSE',
      name: formName || 'Untitled Course',
      instructor: formInstructor || 'TBD',
      room: formRoom || 'TBD',
      color: formColor,
      credits: formCredits,
      days: formDays,
      startTime: formStartTime,
      endTime: formEndTime,
      icon: formIcon,
      syllabus: formSyllabus
    };

    if (editingCourse) {
      updateCourse({ ...payload, id: editingCourse.id });
    } else {
      addCourse(payload);
    }

    setIsModalOpen(false);
  };

  const handleDeleteCourse = (id: string) => {
    deleteCourse(id);
    if (selectedCourseId === id) setSelectedCourseId(null);
    setIsModalOpen(false);
  };

  const toggleSyllabusItem = (course: Course, item: CourseSyllabusItem) => {
    const updatedSyllabus = course.syllabus.map(s => 
      s.id === item.id ? { ...s, completed: !s.completed } : s
    );
    updateCourse({ ...course, syllabus: updatedSyllabus });
  };

  const addSyllabusToCourse = (course: Course, title: string) => {
    if (!title.trim()) return;
    const newItem: CourseSyllabusItem = {
      id: 'syl-' + Date.now(),
      title: title.trim(),
      completed: false,
      type: 'assignment'
    };
    updateCourse({ ...course, syllabus: [...course.syllabus, newItem] });
  };

  const activeCourse = selectedCourseId ? data.courses.find(c => c.id === selectedCourseId) : null;

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
            <GraduationCap size={24} className="text-[#FF85BB]" />
            <h1 className="text-xl font-bold text-[#021A54] dark:text-zinc-100">Courses & Academics Hub</h1>
            <span className="text-xs bg-[#FFCEE3] dark:bg-[#321323] text-[#021A54] dark:text-[#FFB3D1] px-2.5 py-0.5 rounded-full font-semibold border border-transparent dark:border-[#4A2038]">
              {data.courses.length} Enrolled
            </span>
          </div>
          <p className="text-xs text-[#021A54]/70 dark:text-zinc-300">
            Manage your subject syllabi, class rooms, professors, credit units, and linked study notes.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={openAddCourseModal}
          className="px-4 py-2.5 rounded-2xl bg-[#021A54] dark:bg-[#FF85BB] hover:bg-[#FF85BB] dark:hover:bg-[#FF65A5] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          <span>Add New Course</span>
        </motion.button>
      </div>

      {/* Main Grid: Left Course Cards, Right Course Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Courses List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-[#021A54] dark:text-zinc-200 px-1">
            <span>My Courses ({data.courses.length})</span>
          </div>

          <div className="space-y-3">
            {data.courses.map((course) => {
              const isSelected = selectedCourseId === course.id;
              const courseNotes = data.notes.filter(n => n.courseId === course.id);
              const completedTasks = course.syllabus.filter(s => s.completed).length;

              return (
                <motion.div
                  key={course.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedCourseId(course.id)}
                  style={{ borderColor: isSelected ? course.color : undefined }}
                  className={`
                    p-4 rounded-3xl border-2 bg-white dark:bg-[#121212] cursor-pointer transition-all duration-200 hover:shadow-md relative group
                    ${isSelected ? 'bg-[#FFF0F6]/50 dark:bg-[#22131D] shadow-sm' : 'border-[#FFCEE3] dark:border-[#222222] hover:border-[#FF85BB]/50'}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div 
                        style={{ backgroundColor: course.color + '33' }}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-[#021A54] dark:text-zinc-100 text-lg font-bold shrink-0"
                      >
                        {course.icon || '📚'}
                      </div>
                      <div>
                        <span className="text-xs font-black text-[#021A54] dark:text-zinc-100 block">
                          {course.code}
                        </span>
                        <h3 className="text-xs font-bold text-[#021A54]/80 dark:text-zinc-300 line-clamp-1">
                          {course.name}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditCourseModal(course);
                      }}
                      className="p-1.5 rounded-xl hover:bg-[#FFCEE3]/40 dark:hover:bg-zinc-800 text-[#021A54]/50 dark:text-zinc-400 hover:text-[#021A54] dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit Course"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-[#021A54]/70 dark:text-zinc-300 mb-3">
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-[#FF85BB]" />
                      <span className="truncate">{course.instructor}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-[#FF85BB]" />
                      <span className="truncate">{course.room}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-[#FF85BB]" />
                      <span>{course.days.join(', ')} • {format12HourTime(course.startTime)} - {format12HourTime(course.endTime)}</span>
                    </div>
                  </div>

                  {/* Progress & Quick Links */}
                  <div className="pt-2 border-t border-[#FFCEE3]/50 dark:border-[#222222] flex items-center justify-between text-[10px] font-semibold text-[#021A54] dark:text-zinc-300">
                    <span className="px-2 py-0.5 rounded-full bg-[#FFCEE3]/40 dark:bg-[#321323] dark:text-[#FFB3D1] border border-transparent dark:border-[#4A2038]">
                      {course.credits} Credits
                    </span>
                    <span className="text-[#021A54]/60 dark:text-zinc-400">
                      {courseNotes.length} Notes • {completedTasks}/{course.syllabus.length} Tasks
                    </span>
                  </div>
                </motion.div>
              );
            })}

            {data.courses.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-[#121212] rounded-3xl border border-dashed border-[#FFCEE3] dark:border-[#222222] text-xs text-[#021A54]/60 dark:text-zinc-300">
                <GraduationCap size={32} className="mx-auto text-[#FF85BB] mb-2" />
                <p className="font-semibold text-[#021A54] dark:text-zinc-100">No courses created yet!</p>
                <p className="mt-1 text-[11px]">Click "Add New Course" above to build your subject catalog.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Course Syllabus & Linked Notes */}
        <div className="lg:col-span-2">
          {activeCourse ? (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs space-y-6"
            >
              {/* Active Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#FFCEE3]/60 dark:border-[#222222]">
                <div className="flex items-center gap-3">
                  <div 
                    style={{ backgroundColor: activeCourse.color + '33' }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#021A54] dark:text-zinc-100 text-xl font-bold shadow-2xs shrink-0"
                  >
                    {activeCourse.icon || '📚'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-[#021A54] dark:text-zinc-100">{activeCourse.code}</h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFCEE3] dark:bg-[#321323] text-[#021A54] dark:text-[#FFB3D1] font-bold border border-transparent dark:border-[#4A2038]">
                        {activeCourse.credits} Credits
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#021A54]/70 dark:text-zinc-300">{activeCourse.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onCreateNoteForCourse(activeCourse.id)}
                    className="px-3.5 py-2 rounded-2xl bg-[#FFCEE3] dark:bg-[#321323] hover:bg-[#FF85BB] dark:hover:bg-[#FF65A5] text-[#021A54] dark:text-[#FFB3D1] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-transparent dark:border-[#4A2038]"
                  >
                    <FileText size={14} />
                    <span>+ Note for Course</span>
                  </button>
                  <button
                    onClick={() => openEditCourseModal(activeCourse)}
                    className="p-2 rounded-2xl border border-[#021A54]/10 dark:border-[#222222] hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 text-[#021A54] dark:text-zinc-200 transition-colors"
                    title="Edit Course"
                  >
                    <Edit3 size={15} />
                  </button>
                </div>
              </div>

              {/* Course Meta Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#FFF0F6] dark:bg-[#22131D] border border-[#FFCEE3] dark:border-[#4A2038]">
                  <span className="text-[10px] text-[#021A54]/50 dark:text-zinc-400 block font-semibold">Instructor</span>
                  <span className="font-bold text-[#021A54] dark:text-zinc-100">{activeCourse.instructor}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFF0F6] dark:bg-[#22131D] border border-[#FFCEE3] dark:border-[#4A2038]">
                  <span className="text-[10px] text-[#021A54]/50 dark:text-zinc-400 block font-semibold">Room / Location</span>
                  <span className="font-bold text-[#021A54] dark:text-zinc-100">{activeCourse.room}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFF0F6] dark:bg-[#22131D] border border-[#FFCEE3] dark:border-[#4A2038] col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-[#021A54]/50 dark:text-zinc-400 block font-semibold">Schedule Time</span>
                  <span className="font-bold text-[#021A54] dark:text-zinc-100">
                    {activeCourse.days.join(', ')} ({format12HourTime(activeCourse.startTime)} - {format12HourTime(activeCourse.endTime)})
                  </span>
                </div>
              </div>

              {/* Syllabus & Assignments Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#021A54] dark:text-zinc-100 flex items-center gap-2">
                    <Sparkles size={16} className="text-[#FF85BB]" />
                    <span>Syllabus & Assignment Tracker</span>
                  </h3>
                  <span className="text-xs text-[#021A54]/60 dark:text-zinc-400 font-semibold">
                    {activeCourse.syllabus.filter(s => s.completed).length} of {activeCourse.syllabus.length} completed
                  </span>
                </div>

                {/* Quick Add Syllabus Item */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add assignment, reading, or exam topic..."
                    value={newSyllabusTitle}
                    onChange={(e) => setNewSyllabusTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addSyllabusToCourse(activeCourse, newSyllabusTitle);
                        setNewSyllabusTitle('');
                      }
                    }}
                    className="flex-1 p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-xs font-semibold text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
                  />
                  <button
                    onClick={() => {
                      addSyllabusToCourse(activeCourse, newSyllabusTitle);
                      setNewSyllabusTitle('');
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-[#FF85BB] hover:bg-[#FF85BB]/90 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Add
                  </button>
                </div>

                {/* Syllabus List */}
                <div className="space-y-2 pt-1">
                  {activeCourse.syllabus.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleSyllabusItem(activeCourse, item)}
                      className={`
                        p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs font-semibold
                        ${item.completed 
                          ? 'bg-gray-50 dark:bg-[#181818] border-gray-200 dark:border-[#222222] text-[#021A54]/40 dark:text-zinc-500 line-through' 
                          : 'bg-white dark:bg-[#121212] border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200 hover:bg-[#FFF0F6]/60 dark:hover:bg-[#1A1A1A]'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {item.completed ? (
                          <CheckCircle2 size={18} className="text-[#FF85BB] shrink-0" />
                        ) : (
                          <Circle size={18} className="text-[#021A54]/30 dark:text-zinc-600 shrink-0" />
                        )}
                        <span>{item.title}</span>
                      </div>
                      {item.dueDate && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFCEE3]/40 dark:bg-[#321323] text-[#021A54]/70 dark:text-[#FFB3D1] shrink-0 border border-transparent dark:border-[#4A2038]">
                          Due {item.dueDate}
                        </span>
                      )}
                    </div>
                  ))}

                  {activeCourse.syllabus.length === 0 && (
                    <p className="text-center py-4 text-xs italic text-[#021A54]/50 dark:text-zinc-400">
                      No syllabus items added yet. Type an assignment above to get started!
                    </p>
                  )}
                </div>
              </div>

              {/* Linked Notes Section */}
              <div className="pt-4 border-t border-[#FFCEE3]/60 dark:border-[#222222] space-y-3">
                <h3 className="text-sm font-bold text-[#021A54] dark:text-zinc-100 flex items-center gap-2">
                  <FileText size={16} className="text-[#FF85BB]" />
                  <span>Linked Study Notes</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.notes.filter(n => n.courseId === activeCourse.id).map((note) => (
                    <div
                      key={note.id}
                      onClick={() => onOpenNote(note.id)}
                      className="p-3.5 rounded-2xl border border-[#FFCEE3] dark:border-[#222222] bg-white dark:bg-[#121212] hover:border-[#FF85BB] hover:shadow-xs transition-all cursor-pointer flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#FFF0F6] dark:bg-[#22131D] border border-[#FFCEE3] dark:border-[#4A2038] flex items-center justify-center shrink-0">
                        <FileText size={16} className="text-[#FF85BB]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-[#021A54] dark:text-zinc-100 truncate group-hover:text-[#FF85BB] transition-colors">
                          {note.title || 'Untitled Note'}
                        </h4>
                        <p className="text-[10px] text-[#021A54]/50 dark:text-zinc-400">
                          Updated {note.updatedAt} • {note.blocks.length} blocks
                        </p>
                      </div>
                    </div>
                  ))}

                  {data.notes.filter(n => n.courseId === activeCourse.id).length === 0 && (
                    <div className="col-span-2 p-4 text-center rounded-2xl bg-[#F5F5F5] dark:bg-black border border-dashed border-[#FFCEE3] dark:border-[#222222] text-xs text-[#021A54]/60 dark:text-zinc-400">
                      No notes created for this course yet. Click "+ Note for Course" above!
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white dark:bg-[#121212] p-12 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] text-center text-xs text-[#021A54]/60 dark:text-zinc-300">
              <BookOpen size={40} className="mx-auto text-[#FF85BB] mb-3" />
              <h3 className="font-bold text-[#021A54] dark:text-zinc-100 text-sm">Select a course to inspect syllabus</h3>
              <p className="mt-1">Click any course card on the left to track syllabus items, room info, and study notes.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Course Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#021A54]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#121212] w-full max-w-lg rounded-3xl p-6 border border-[#FFCEE3] dark:border-[#222222] shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222] mb-4">
                <h3 className="text-base font-bold text-[#021A54] dark:text-zinc-100">
                  {editingCourse ? 'Edit Course Details' : 'Add New Course'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-xl hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 text-[#021A54]/60 dark:text-zinc-300"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCourse} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#021A54] dark:text-zinc-200 mb-1">Course Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CS 102"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[#021A54] dark:text-zinc-200 mb-1 font-semibold">Full Course Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Data Structures & Algorithms"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#021A54] dark:text-zinc-200 mb-1 font-semibold">Instructor / Professor</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Vance"
                      value={formInstructor}
                      onChange={(e) => setFormInstructor(e.target.value)}
                      className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[#021A54] dark:text-zinc-200 mb-1 font-semibold">Room / Building</label>
                    <input
                      type="text"
                      placeholder="e.g. Tech Hall 302"
                      value={formRoom}
                      onChange={(e) => setFormRoom(e.target.value)}
                      className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
                    />
                  </div>
                </div>

                {/* Days selection */}
                <div>
                  <label className="block text-[#021A54] dark:text-zinc-200 mb-1 font-semibold">Meeting Days</label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map(day => {
                      const isSelected = formDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setFormDays(formDays.filter(d => d !== day));
                            } else {
                              setFormDays([...formDays, day]);
                            }
                          }}
                          className={`
                            px-3 py-1.5 rounded-xl border text-[11px] transition-all
                            ${isSelected 
                              ? 'bg-[#FF85BB] text-white border-[#FF85BB]' 
                              : 'bg-white dark:bg-black border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200'
                            }
                          `}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Class Times & Credits */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#021A54] dark:text-zinc-200 mb-1 font-semibold">Start Time</label>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full p-2 rounded-xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[#021A54] dark:text-zinc-200 mb-1 font-semibold">End Time</label>
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full p-2 rounded-xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[#021A54] dark:text-zinc-200 mb-1 font-semibold">Credits</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={formCredits}
                      onChange={(e) => setFormCredits(parseInt(e.target.value, 10) || 3)}
                      className="w-full p-2 rounded-xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100"
                    />
                  </div>
                </div>

                {/* Course Symbol / Emoji Selection */}
                <div className="p-3 bg-[#FFF0F6] dark:bg-[#22131D] rounded-2xl border border-[#FFCEE3] dark:border-[#4A2038]">
                  <label className="block text-[#021A54] dark:text-zinc-200 mb-1 font-bold">Course Symbol / Icon</label>
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-[11px] text-[#021A54]/70 dark:text-zinc-400 font-semibold">Custom Symbol:</span>
                    <input
                      type="text"
                      maxLength={4}
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                      placeholder="e.g. 🚀"
                      className="w-20 p-1.5 text-center text-xs rounded-xl bg-white dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 font-bold focus:outline-hidden focus:border-[#FF85BB]"
                    />
                  </div>
                </div>

                {/* Color Selection with Custom Hex Code Picker */}
                <div className="p-3 bg-[#FFF0F6] dark:bg-[#22131D] rounded-2xl border border-[#FFCEE3] dark:border-[#4A2038] space-y-2">
                  <label className="block text-[#021A54] dark:text-zinc-200 text-xs font-bold">Theme Accent Color</label>
                  
                  {/* Preset Swatches */}
                  <div className="flex flex-wrap items-center gap-2">
                    {['#FF85BB', '#FFCEE3', '#021A54', '#E8C5E5'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-7 h-7 rounded-full border-2 transition-transform shadow-2xs ${formColor.toLowerCase() === color.toLowerCase() ? 'border-[#021A54] dark:border-white scale-110 ring-2 ring-[#FF85BB]' : 'border-transparent hover:scale-105'}`}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* Custom Hex Color Picker Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-[#021A54]/70 dark:text-zinc-300 font-semibold">Custom Hex Code:</span>
                    <div className="flex items-center gap-2 bg-white dark:bg-black p-1 pl-2.5 rounded-xl border border-[#FFCEE3] dark:border-[#222222]">
                      <input
                        type="color"
                        value={formColor.startsWith('#') && formColor.length === 7 ? formColor : '#FF85BB'}
                        onChange={(e) => setFormColor(e.target.value.toUpperCase())}
                        className="w-6 h-6 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
                        title="Pick custom color"
                      />
                      <input
                        type="text"
                        maxLength={7}
                        value={formColor}
                        onChange={(e) => {
                          let val = e.target.value.trim();
                          if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                          setFormColor(val);
                        }}
                        placeholder="#FF85BB"
                        className="w-20 text-xs font-mono font-bold text-[#021A54] dark:text-zinc-100 bg-transparent focus:outline-hidden"
                      />
                      <div 
                        style={{ backgroundColor: formColor }}
                        className="w-4 h-4 rounded-full border border-gray-300 dark:border-zinc-700 shrink-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Action buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-[#FFCEE3] dark:border-[#222222]">
                  {editingCourse ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(editingCourse.id)}
                      className="px-3 py-2 rounded-2xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      <span>Delete Course</span>
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
                      className="px-5 py-2 rounded-2xl bg-[#FF85BB] hover:bg-[#FF85BB]/90 text-white font-bold shadow-xs"
                    >
                      Save Course
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
