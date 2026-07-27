import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Flame, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Filter, 
  Calendar,
  X,
  Tag,
  Edit3,
  MapPin,
  Clock,
  FileText,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspace } from '../context/WorkspaceContext';
import { QuickTask } from '../types';
import confetti from 'canvas-confetti';

export const PlannerView: React.FC = () => {
  const { 
    data, 
    addQuickTask, 
    updateQuickTask,
    toggleQuickTask, 
    deleteQuickTask, 
    clearCompletedQuickTasks, 
    deleteCountdown,
    addTaskCategory,
    removeTaskCategory
  } = useWorkspace();

  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('Academic');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [taskLocation, setTaskLocation] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskIsEvent, setTaskIsEvent] = useState(false);

  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterTab, setFilterTab] = useState<'all' | 'tasks' | 'events'>('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Editing Task state
  const [editingTask, setEditingTask] = useState<QuickTask | null>(null);

  const categories = data.settings.taskCategories || ["Academic", "Assignment", "Exam Prep", "Personal", "Project"];

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const cat = newCategoryName.trim();
    addTaskCategory(cat);
    setTaskCategory(cat);
    setNewCategoryName('');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addQuickTask({
      title: taskTitle.trim(),
      category: taskCategory,
      priority: taskPriority,
      dueDate: taskDueDate || undefined,
      time: taskTime || undefined,
      location: taskLocation || undefined,
      notes: taskNotes || undefined,
      isEvent: taskIsEvent
    });

    setTaskTitle('');
    setTaskDueDate('');
    setTaskTime('');
    setTaskLocation('');
    setTaskNotes('');
    setTaskIsEvent(false);
  };

  const handleSaveEditedTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;
    updateQuickTask(editingTask);
    setEditingTask(null);
  };

  const handleToggle = (id: string, isCompletedNow: boolean) => {
    toggleQuickTask(id);
    if (!isCompletedNow) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF85BB', '#FFCEE3', '#021A54']
      });
    }
  };

  const filteredTasks = data.quickTasks.filter(task => {
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterTab === 'tasks' && task.isEvent) return false;
    if (filterTab === 'events' && !task.isEvent) return false;
    return true;
  });

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

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
            <CheckSquare size={22} className="text-[#FF85BB]" />
            <h1 className="text-xl font-bold text-[#021A54] dark:text-zinc-100">Tasks & Planner</h1>
            <span className="text-xs bg-[#FFCEE3] dark:bg-[#321323] text-[#021A54] dark:text-[#FFB3D1] px-2.5 py-0.5 rounded-full font-semibold border border-transparent dark:border-[#4A2038]">
              {pendingTasks.length} Remaining
            </span>
          </div>
          <p className="text-xs text-[#021A54]/70 dark:text-zinc-300">
            Organize study tasks, assignments, and calendar events. Events automatically reflect on your dashboard calendar!
          </p>
        </div>

        {/* View Tabs & Priority Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Filter */}
          <div className="flex bg-[#F5F5F5] dark:bg-black p-1 rounded-2xl border border-[#FFCEE3] dark:border-[#222222]">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${filterTab === 'all' ? 'bg-[#FF85BB] text-white' : 'text-[#021A54]/70 dark:text-zinc-300'}`}
            >
              All ({data.quickTasks.length})
            </button>
            <button
              onClick={() => setFilterTab('tasks')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${filterTab === 'tasks' ? 'bg-[#FF85BB] text-white' : 'text-[#021A54]/70 dark:text-zinc-300'}`}
            >
              Tasks
            </button>
            <button
              onClick={() => setFilterTab('events')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${filterTab === 'events' ? 'bg-[#FF85BB] text-white' : 'text-[#021A54]/70 dark:text-zinc-300'}`}
            >
              Events
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#FF85BB]" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="p-2 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-xs font-semibold text-[#021A54] dark:text-zinc-200"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Add Task & Active Tasks, Right Countdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Task Creator & Task List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Create Task/Event Form Card */}
          <div className="bg-white dark:bg-[#121212] p-5 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#021A54] dark:text-zinc-200 flex items-center gap-1.5">
                <Plus size={15} className="text-[#FF85BB]" />
                <span>Add New Task or Calendar Event</span>
              </h2>

              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#021A54] dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={taskIsEvent}
                  onChange={(e) => setTaskIsEvent(e.target.checked)}
                  className="rounded-md border-[#FF85BB] text-[#FF85BB] focus:ring-0"
                />
                <span className={taskIsEvent ? 'text-[#FF85BB]' : ''}>Mark as Calendar Event</span>
              </label>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs font-semibold">
              <input
                type="text"
                placeholder={taskIsEvent ? "Event title (e.g., Physics Group Study Session)..." : "Task description (e.g., Read Economics Chapter 4)..."}
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
                className="w-full p-3 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#021A54]/70 dark:text-zinc-400">Category</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[10px] text-[#FF85BB] hover:underline font-bold flex items-center gap-0.5"
                    >
                      <Plus size={11} />
                      <span>Manage</span>
                    </button>
                  </div>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#021A54]/70 dark:text-zinc-400 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full p-2 rounded-xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#021A54]/70 dark:text-zinc-400 mb-1">{taskIsEvent ? 'Event Date' : 'Due Date'}</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* Extended fields: Time & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[#021A54]/70 dark:text-zinc-400 mb-1">Time (Optional)</label>
                  <input
                    type="time"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-[#021A54]/70 dark:text-zinc-400 mb-1">Location / Room (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Science Hall 102"
                    value={taskLocation}
                    onChange={(e) => setTaskLocation(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                className="w-full py-2.5 rounded-2xl bg-[#021A54] dark:bg-[#FF85BB] hover:bg-[#FF85BB] dark:hover:bg-[#FF65A5] text-white font-bold transition-all shadow-xs"
              >
                + {taskIsEvent ? 'Add Calendar Event' : 'Save Task to Planner'}
              </motion.button>
            </form>
          </div>

          {/* Pending Tasks List */}
          <div className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#021A54] dark:text-zinc-100 flex items-center justify-between pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222]">
              <span>Active Planner Items ({pendingTasks.length})</span>
              <span className="text-[10px] text-[#FF85BB]">Click card to view/edit details</span>
            </h2>

            <div className="space-y-2.5">
              <AnimatePresence>
                {pendingTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-2xl border border-[#FFCEE3] dark:border-[#222222] bg-[#FFF0F6]/30 dark:bg-[#22131D]/50 hover:bg-[#FFF0F6] dark:hover:bg-[#22131D] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold group cursor-pointer"
                    onClick={() => setEditingTask(task)}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(task.id, task.completed);
                        }}
                        className="p-1 hover:scale-110 transition-transform shrink-0"
                        title="Toggle completion status"
                      >
                        <Circle size={20} className="text-[#021A54]/30 dark:text-zinc-500 group-hover:text-[#FF85BB] transition-colors" />
                      </button>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {task.isEvent ? (
                            <span className="px-2 py-0.2 rounded-md bg-[#021A54] text-white text-[10px] font-bold flex items-center gap-1">
                              <Calendar size={10} />
                              Event
                            </span>
                          ) : (
                            <span className="px-2 py-0.2 rounded-md bg-[#FFCEE3] text-[#021A54] text-[10px] font-bold">
                              Task
                            </span>
                          )}
                          <span className="text-[#021A54] dark:text-zinc-100 font-bold truncate text-xs">{task.title}</span>
                        </div>

                        {/* Extended Details Preview */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#021A54]/60 dark:text-zinc-400 font-medium">
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar size={10} className="text-[#FF85BB]" />
                              <span>{task.dueDate}</span>
                            </span>
                          )}
                          {task.time && (
                            <span className="flex items-center gap-1">
                              <Clock size={10} className="text-[#FF85BB]" />
                              <span>{task.time}</span>
                            </span>
                          )}
                          {task.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={10} className="text-[#FF85BB]" />
                              <span>{task.location}</span>
                            </span>
                          )}
                          {task.notes && (
                            <span className="flex items-center gap-1 text-[#021A54]/80 dark:text-zinc-300 italic">
                              <FileText size={10} />
                              <span className="truncate max-w-[150px]">{task.notes}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {task.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-300">
                          {task.category}
                        </span>
                      )}

                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        task.priority === 'high' ? 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-300' :
                        task.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300' :
                        'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {task.priority.toUpperCase()}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTask(task);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-[#021A54]/60 dark:text-zinc-300 transition-colors"
                        title="Edit Details"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuickTask(task.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-300 dark:text-zinc-500 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {pendingTasks.length === 0 && (
                <p className="text-center py-8 text-xs italic text-[#021A54]/50 dark:text-zinc-400">
                  No active planner items! You are all caught up.
                </p>
              )}
            </div>
          </div>

          {/* Completed Tasks Accordion */}
          {completedTasks.length > 0 && (
            <div className="bg-white dark:bg-[#121212] p-5 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-[#021A54]/70 dark:text-zinc-400">
                  Completed Items ({completedTasks.length})
                </h2>
                <button
                  onClick={clearCompletedQuickTasks}
                  className="px-2.5 py-1 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 text-[11px] font-bold border border-red-200 dark:border-red-900/50 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={12} />
                  <span>Delete All Completed</span>
                </button>
              </div>
              <div className="space-y-1.5 opacity-60">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-2xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#222222] flex items-center justify-between text-xs line-through text-[#021A54]/50 dark:text-zinc-400 cursor-pointer hover:opacity-100 transition-opacity"
                    onClick={() => setEditingTask(task)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(task.id, task.completed);
                        }}
                      >
                        <CheckCircle2 size={16} className="text-[#FF85BB] shrink-0" />
                      </button>
                      <span className="truncate font-bold">{task.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuickTask(task.id);
                      }}
                      className="text-gray-300 dark:text-zinc-500 hover:text-red-500 transition-colors shrink-0"
                      title="Delete Task"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Countdown Timers */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#021A54] dark:text-zinc-100 flex items-center gap-2 pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222]">
              <Flame size={18} className="text-[#FF85BB]" />
              <span>Target Milestones</span>
            </h2>

            <div className="space-y-3">
              {data.countdowns.map((cd) => (
                <div key={cd.id} className="p-3.5 rounded-2xl bg-[#FFF0F6] dark:bg-[#22131D] border border-[#FFCEE3] dark:border-[#4A2038] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#021A54] dark:text-zinc-200">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-[#FF85BB]" />
                      <span>{cd.title}</span>
                    </span>
                    <button onClick={() => deleteCountdown(cd.id)} className="text-gray-300 dark:text-zinc-500 hover:text-red-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="text-[11px] text-[#021A54]/60 dark:text-zinc-400">Target: {cd.targetDate}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT / VIEW TASK DETAILS MODAL */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 bg-[#021A54]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#121212] w-full max-w-lg rounded-3xl p-6 border border-[#FFCEE3] dark:border-[#222222] shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222]">
                <div className="flex items-center gap-2">
                  <Edit3 size={18} className="text-[#FF85BB]" />
                  <h3 className="text-sm font-bold text-[#021A54] dark:text-zinc-100">Task & Event Details</h3>
                </div>
                <button
                  onClick={() => setEditingTask(null)}
                  className="p-1.5 rounded-xl hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 text-[#021A54]/60 dark:text-zinc-300"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditedTask} className="space-y-4 text-xs font-semibold">
                {/* Title */}
                <div>
                  <label className="block text-[#021A54]/70 dark:text-zinc-300 mb-1">Title / Description</label>
                  <input
                    type="text"
                    required
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 font-bold focus:outline-hidden focus:border-[#FF85BB]"
                  />
                </div>

                {/* Event Check & Status */}
                <div className="flex items-center justify-between p-3 bg-[#FFF0F6] dark:bg-[#22131D] rounded-2xl border border-[#FFCEE3] dark:border-[#4A2038]">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-[#021A54] dark:text-zinc-200">
                    <input
                      type="checkbox"
                      checked={editingTask.isEvent || false}
                      onChange={(e) => setEditingTask({ ...editingTask, isEvent: e.target.checked })}
                      className="rounded-md border-[#FF85BB] text-[#FF85BB] focus:ring-0"
                    />
                    <span>Show as Event on Calendar</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-[#021A54] dark:text-zinc-200">
                    <input
                      type="checkbox"
                      checked={editingTask.completed}
                      onChange={(e) => setEditingTask({ ...editingTask, completed: e.target.checked })}
                      className="rounded-md border-[#FF85BB] text-[#FF85BB] focus:ring-0"
                    />
                    <span>Completed</span>
                  </label>
                </div>

                {/* Grid: Category, Priority, Due Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#021A54]/70 dark:text-zinc-300 mb-1">Category</label>
                    <select
                      value={editingTask.category || 'Academic'}
                      onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                      className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#021A54]/70 dark:text-zinc-300 mb-1">Priority</label>
                    <select
                      value={editingTask.priority}
                      onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                      className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#021A54]/70 dark:text-zinc-300 mb-1">Date</label>
                    <input
                      type="date"
                      value={editingTask.dueDate || ''}
                      onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                      className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200"
                    />
                  </div>
                </div>

                {/* Time & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#021A54]/70 dark:text-zinc-300 mb-1">Time</label>
                    <input
                      type="time"
                      value={editingTask.time || ''}
                      onChange={(e) => setEditingTask({ ...editingTask, time: e.target.value })}
                      className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[#021A54]/70 dark:text-zinc-300 mb-1">Location / Room</label>
                    <input
                      type="text"
                      placeholder="e.g. Campus Library"
                      value={editingTask.location || ''}
                      onChange={(e) => setEditingTask({ ...editingTask, location: e.target.value })}
                      className="w-full p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-200"
                    />
                  </div>
                </div>

                {/* Notes / Description */}
                <div>
                  <label className="block text-[#021A54]/70 dark:text-zinc-300 mb-1">Detailed Notes / Description</label>
                  <textarea
                    rows={3}
                    placeholder="Add extra instructions, checklist items, or study notes..."
                    value={editingTask.notes || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
                    className="w-full p-3 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 font-normal focus:outline-hidden focus:border-[#FF85BB]"
                  />
                </div>

                {/* Modal Action Buttons */}
                <div className="pt-3 border-t border-[#FFCEE3]/60 dark:border-[#222222] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      deleteQuickTask(editingTask.id);
                      setEditingTask(null);
                    }}
                    className="px-3 py-2 rounded-2xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    <span>Delete Task</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="px-4 py-2 rounded-2xl border border-[#021A54]/20 dark:border-[#222222] text-[#021A54] dark:text-zinc-200 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-2xl bg-[#FF85BB] hover:bg-[#FF85BB]/90 text-white font-bold text-xs shadow-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Manager Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-[#021A54]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#121212] w-full max-w-sm rounded-3xl p-6 border border-[#FFCEE3] dark:border-[#222222] shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222]">
                <div className="flex items-center gap-2">
                  <Tag size={18} className="text-[#FF85BB]" />
                  <h3 className="text-sm font-bold text-[#021A54] dark:text-zinc-100">Manage Task Categories</h3>
                </div>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1 rounded-xl hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 text-[#021A54]/60 dark:text-zinc-300"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} className="flex gap-2 text-xs">
                <input
                  type="text"
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 font-semibold focus:outline-hidden focus:border-[#FF85BB]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#FF85BB] hover:bg-[#FF85BB]/90 text-white font-bold rounded-2xl shadow-xs transition-all shrink-0"
                >
                  Add
                </button>
              </form>

              {/* Existing Categories List */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-[#021A54]/60 dark:text-zinc-400 block">Current Categories ({categories.length}):</span>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                  {categories.map((cat) => (
                    <div
                      key={cat}
                      className="px-3 py-1.5 rounded-2xl bg-[#FFF0F6] dark:bg-[#22131D] border border-[#FFCEE3] dark:border-[#4A2038] text-xs font-semibold text-[#021A54] dark:text-zinc-200 flex items-center gap-2"
                    >
                      <span>{cat}</span>
                      <button
                        type="button"
                        onClick={() => removeTaskCategory(cat)}
                        className="text-[#021A54]/40 dark:text-zinc-400 hover:text-red-500 transition-colors"
                        title={`Remove category "${cat}"`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#FFCEE3]/60 dark:border-[#222222] flex justify-end">
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#021A54] text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
