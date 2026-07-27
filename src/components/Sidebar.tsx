import React from 'react';
import { 
  Calendar, 
  BookOpen, 
  FileText, 
  CheckSquare, 
  Settings, 
  Plus, 
  Search, 
  LayoutDashboard,
  Pin,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  FolderKanban
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onNewNote: () => void;
  onOpenSearch: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedNoteId,
  onSelectNote,
  onNewNote,
  onOpenSearch,
  isOpen,
  setIsOpen,
  onLogout,
}) => {
  const { data, isDarkMode, toggleDarkMode } = useWorkspace();
  const pinnedNotes = data.notes.filter(n => n.pinned && !n.archived);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'timetable', label: 'Schedule', icon: Calendar, badge: `${data.timetableSlots.length}` },
    { id: 'courses', label: 'Courses', icon: BookOpen, badge: `${data.courses.length}` },
    { id: 'notes', label: 'Notes', icon: FileText, badge: `${data.notes.length}` },
    { id: 'planner', label: 'Tasks & Planner', icon: CheckSquare, badge: `${data.quickTasks.filter(t => !t.completed).length}` },
    { id: 'files', label: 'Course Files', icon: FolderKanban, badge: `${(data.courseFiles || []).length}` },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#021A54]/20 dark:bg-black/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 bg-white dark:bg-[#0A0A0A] border-r border-[#FFCEE3]/60 dark:border-[#222222]
        transition-all duration-300 ease-in-out flex flex-col justify-between overflow-x-hidden
        ${isOpen 
          ? 'translate-x-0 w-64' 
          : '-translate-x-full lg:translate-x-0 lg:w-16'
        }
        shadow-sm
      `}>
        {/* Top Header / Profile */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {isOpen ? (
            <div className="p-4 border-b border-[#FFCEE3]/50 dark:border-[#222222] flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                {data.settings.profileImage ? (
                  <img
                    src={data.settings.profileImage}
                    alt={data.settings.userName}
                    className="w-10 h-10 rounded-2xl object-cover shrink-0 border border-[#FF85BB] shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-[#FFCEE3] dark:bg-[#321323] flex items-center justify-center text-sm font-bold text-[#021A54] dark:text-[#FFB3D1] shadow-xs shrink-0 border border-transparent dark:border-[#4A2038]">
                    {data.settings.userAvatar || data.settings.userName.charAt(0) || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-bold text-sm text-[#021A54] dark:text-zinc-100 truncate">
                    {data.settings.userName}
                  </h2>
                  <p className="text-[11px] text-[#021A54]/60 dark:text-zinc-400 truncate font-medium">
                    {data.settings.workspaceTitle || "Personal Workspace"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#FFCEE3]/30 dark:hover:bg-[#1F1F1F] text-[#021A54]/70 dark:text-zinc-400 hover:text-[#021A54] dark:hover:text-zinc-200 transition-colors shrink-0"
                title="Collapse sidebar"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          ) : (
            <div className="p-3 border-b border-[#FFCEE3]/50 dark:border-[#222222] flex items-center justify-center">
              <button
                onClick={() => setIsOpen(true)}
                className="w-10 h-10 rounded-2xl bg-[#FFCEE3] dark:bg-[#321323] hover:bg-[#FF85BB] text-[#021A54] dark:text-[#FFB3D1] hover:text-white flex items-center justify-center text-sm font-bold shadow-xs transition-all relative group shrink-0 border border-transparent dark:border-[#4A2038]"
                title="Expand sidebar"
              >
                <span>{data.settings.userName.charAt(0)}</span>
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#1A1A1A] rounded-full p-0.5 border border-[#FFCEE3] dark:border-[#333333] group-hover:bg-[#021A54] group-hover:border-[#021A54] transition-colors">
                  <ChevronRight size={10} className="text-[#021A54] dark:text-zinc-200 group-hover:text-white" />
                </div>
              </button>
            </div>
          )}

          {/* Quick Search Button */}
          {isOpen ? (
            <div className="px-3 pt-3">
              <button
                onClick={onOpenSearch}
                className="w-full py-2 px-3 bg-[#F5F5F5] dark:bg-[#141414] hover:bg-[#FFCEE3]/30 dark:hover:bg-[#222222] text-[#021A54]/70 dark:text-zinc-300 text-xs font-medium rounded-2xl flex items-center justify-between border border-transparent dark:border-[#222222] transition-all group"
              >
                <span className="flex items-center gap-2">
                  <Search size={14} className="text-[#FF85BB]" />
                  <span>Search workspace...</span>
                </span>
                <kbd className="text-[10px] bg-white dark:bg-[#1F1F1F] px-1.5 py-0.5 rounded-md border border-[#021A54]/10 dark:border-[#333333] text-[#021A54]/50 dark:text-zinc-400">
                  ⌘K
                </kbd>
              </button>
            </div>
          ) : (
            <div className="p-2 flex justify-center">
              <button
                onClick={onOpenSearch}
                className="p-2.5 rounded-xl bg-[#F5F5F5] dark:bg-[#141414] text-[#021A54]/70 dark:text-zinc-300 hover:bg-[#FFCEE3]/40 dark:hover:bg-[#222222] transition-colors border border-transparent dark:border-[#222222]"
                title="Search workspace"
              >
                <Search size={16} />
              </button>
            </div>
          )}

          {/* Nav Items */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as ActiveTab);
                    if (window.innerWidth < 1024) setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center rounded-2xl transition-all duration-200 text-xs font-semibold
                    ${isOpen ? 'px-3 py-2.5 justify-between' : 'p-2.5 justify-center'}
                    ${isActive 
                      ? 'bg-[#FF85BB] text-white shadow-sm' 
                      : 'text-[#021A54] dark:text-zinc-300 hover:bg-[#FFCEE3]/30 dark:hover:bg-[#181818] hover:text-[#021A54] dark:hover:text-white'
                    }
                  `}
                  title={!isOpen ? item.label : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={18} className={isActive ? 'text-white' : 'text-[#021A54]/80 dark:text-zinc-300'} />
                    {isOpen && <span>{item.label}</span>}
                  </div>
                  {isOpen && item.badge && (
                    <span className={`
                      text-[10px] px-2 py-0.5 rounded-full font-bold
                      ${isActive ? 'bg-white/25 text-white' : 'bg-[#FFCEE3] dark:bg-[#321323] text-[#021A54] dark:text-[#FFB3D1] border border-transparent dark:border-[#4A2038]'}
                    `}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Note Add Button */}
          {isOpen && (
            <div className="px-3 py-2">
              <button
                onClick={onNewNote}
                className="w-full py-2.5 px-3 bg-[#021A54] dark:bg-[#FF85BB] hover:bg-[#FF85BB] dark:hover:bg-[#FF65A5] text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all transform active:scale-98 group"
              >
                <Plus size={15} className="group-hover:rotate-90 transition-transform" />
                <span>New Note</span>
              </button>
            </div>
          )}

          {/* Pinned / Favorite Notes section in sidebar */}
          {isOpen && pinnedNotes.length > 0 && (
            <div className="px-3 pt-4 pb-2">
              <div className="text-[10px] font-bold text-[#021A54]/50 dark:text-zinc-500 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1">
                <Pin size={10} className="text-[#FF85BB]" />
                <span>Pinned Notes</span>
              </div>
              <div className="space-y-0.5">
                {pinnedNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => {
                      onSelectNote(note.id);
                      setActiveTab('note-detail');
                    }}
                    className={`
                      w-full px-2.5 py-1.5 rounded-xl text-left text-xs flex items-center gap-2 truncate transition-colors
                      ${activeTab === 'note-detail' && selectedNoteId === note.id
                        ? 'bg-[#FFCEE3] dark:bg-[#321323] text-[#021A54] dark:text-[#FFB3D1] font-semibold border border-transparent dark:border-[#4A2038]'
                        : 'text-[#021A54]/80 dark:text-zinc-300 hover:bg-[#F5F5F5] dark:hover:bg-[#181818]'
                      }
                    `}
                  >
                    <FileText size={13} className="text-[#FF85BB] shrink-0" />
                    <span className="truncate">{note.title || 'Untitled Note'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar Settings & Dark Mode Toggle */}
        <div className="p-3 border-t border-[#FFCEE3]/50 dark:border-[#222222] space-y-1.5 shrink-0">
          <button
            onClick={toggleDarkMode}
            className={`
              w-full flex items-center rounded-2xl transition-all text-xs font-semibold
              ${isOpen ? 'px-3 py-2 justify-between' : 'p-2.5 justify-center'}
              text-[#021A54]/70 dark:text-zinc-300 hover:bg-[#F5F5F5] dark:hover:bg-[#181818] hover:text-[#021A54] dark:hover:text-white
            `}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="flex items-center gap-2.5">
              {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-[#021A54]" />}
              {isOpen && <span>{isDarkMode ? 'Light Theme' : 'Dark Theme'}</span>}
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              setIsOpen(false);
            }}
            className={`
              w-full flex items-center rounded-2xl transition-all text-xs font-semibold
              ${isOpen ? 'px-3 py-2 justify-start gap-2.5' : 'p-2.5 justify-center'}
              ${activeTab === 'settings'
                ? 'bg-[#FFCEE3] dark:bg-[#321323] text-[#021A54] dark:text-[#FFB3D1] border border-transparent dark:border-[#4A2038]'
                : 'text-[#021A54]/70 dark:text-zinc-300 hover:bg-[#F5F5F5] dark:hover:bg-[#181818] hover:text-[#021A54] dark:hover:text-white'
              }
            `}
            title="Workspace Settings"
          >
            <Settings size={18} />
            {isOpen && <span>Settings</span>}
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className={`
                w-full flex items-center rounded-2xl transition-all text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40
                ${isOpen ? 'px-3 py-2 justify-start gap-2.5' : 'p-2.5 justify-center'}
              `}
              title="Log Out & Return to Landing Page"
            >
              <LogOut size={18} />
              {isOpen && <span>Log Out</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
