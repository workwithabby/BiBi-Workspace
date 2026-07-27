import { WorkspaceData } from '../types';

export const INITIAL_WORKSPACE_DATA: WorkspaceData = {
  settings: {
    userName: "User",
    userAvatar: "U",
    userBio: "Student • Academic Workspace",
    headerCover: "#021A54",
    motd: "Organize your schedule, track courses, and take notes effectively.",
    workspaceTitle: "Personal Workspace",
    taskCategories: ["Academic", "Assignment", "Exam Prep", "Personal", "Project"],
  },
  courses: [],
  timetableSlots: [],
  notes: [],
  quickTasks: [],
  countdowns: [],
  courseFiles: []
};

