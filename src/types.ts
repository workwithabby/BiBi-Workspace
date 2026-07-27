export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export function format12HourTime(timeStr: string | undefined): string {
  if (!timeStr) return '';
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  if (isNaN(h)) return timeStr;
  const m = parts[1].slice(0, 2).padEnd(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export interface CourseSyllabusItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  type?: 'assignment' | 'exam' | 'quiz' | 'reading' | 'project';
}

export interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  room: string;
  color: string; // Tailwind bg & text color pairing or hex
  credits: number;
  days: DayOfWeek[];
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  syllabus: CourseSyllabusItem[];
  icon: string;
}

export interface TimetableSlot {
  id: string;
  day: DayOfWeek;
  startTime: string; // "08:00"
  endTime: string;   // "09:00"
  courseId?: string;
  customTitle?: string;
  customRoom?: string;
  customColor?: string;
  notes?: string;
}

export type BlockType = 
  | 'paragraph' 
  | 'heading-1' 
  | 'heading-2' 
  | 'heading-3' 
  | 'todo' 
  | 'bullet' 
  | 'numbered' 
  | 'callout' 
  | 'quote' 
  | 'code' 
  | 'divider';

export interface NoteBlock {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  calloutIcon?: string;
  language?: string;
}

export interface Note {
  id: string;
  title: string;
  icon: string;
  cover?: string;
  courseId?: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  blocks: NoteBlock[];
  updatedAt: string;
  createdAt: string;
}

export interface QuickTask {
  id: string;
  title: string;
  completed: boolean;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  time?: string;
  location?: string;
  notes?: string;
  isEvent?: boolean;
}

export interface CountdownItem {
  id: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  icon: string;
}

export interface CourseFile {
  id: string;
  name: string;
  size: number;
  type: string;
  courseId?: string;
  uploadedAt: string;
  fileData: string;
}

export interface WorkspaceSettings {
  userName: string;
  userAvatar: string;
  userBio: string;
  headerCover: string;
  motd: string;
  darkMode?: boolean;
  workspaceTitle?: string;
  profileImage?: string;
  taskCategories?: string[];
}

export interface WorkspaceData {
  settings: WorkspaceSettings;
  courses: Course[];
  timetableSlots: TimetableSlot[];
  notes: Note[];
  quickTasks: QuickTask[];
  countdowns: CountdownItem[];
  courseFiles?: CourseFile[];
}

export type ActiveTab = 'dashboard' | 'timetable' | 'courses' | 'notes' | 'note-detail' | 'planner' | 'files' | 'settings';
