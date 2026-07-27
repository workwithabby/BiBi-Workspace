import React, { useState, useRef } from 'react';
import { 
  FolderKanban, 
  Folder, 
  FolderOpen,
  UploadCloud, 
  FileText, 
  Download, 
  Trash2, 
  Search, 
  X, 
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  File,
  FileCheck,
  Eye,
  ArrowLeft,
  ChevronRight,
  Grid,
  List,
  Sparkles,
  Layers,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspace } from '../context/WorkspaceContext';
import { CourseFile, Course } from '../types';

export const FilesHub: React.FC = () => {
  const { data, addCourseFile, deleteCourseFile } = useWorkspace();

  // Active folder state: null = 'all-folders' view, or string courseId ('general' or course.id)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // File display view mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search & Type filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Drag & drop upload state
  const [targetUploadCourse, setTargetUploadCourse] = useState<string>('general');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<CourseFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const courseFiles = data.courseFiles || [];
  const courses = data.courses || [];

  // Helper to format byte sizes
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Helper to get badge icon and styling by file extension/MIME
  const getFileBadge = (fileName: string, mimeType: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf' || mimeType.includes('pdf')) {
      return { icon: FileText, label: 'PDF', bg: 'bg-red-100 dark:bg-red-950/60', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-900' };
    }
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext) || mimeType.includes('word') || mimeType.includes('text')) {
      return { icon: FileText, label: ext.toUpperCase(), bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900' };
    }
    if (['ppt', 'pptx'].includes(ext) || mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return { icon: FileText, label: 'PPT', bg: 'bg-orange-100 dark:bg-orange-950/60', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-900' };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return { icon: FileSpreadsheet, label: 'SHEET', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900' };
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext) || mimeType.includes('image')) {
      return { icon: ImageIcon, label: 'IMAGE', bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900' };
    }
    if (['js', 'ts', 'py', 'java', 'cpp', 'html', 'css', 'json'].includes(ext)) {
      return { icon: FileCode, label: 'CODE', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900' };
    }
    return { icon: File, label: ext.toUpperCase() || 'FILE', bg: 'bg-gray-100 dark:bg-zinc-800', text: 'text-gray-700 dark:text-zinc-300', border: 'border-gray-200 dark:border-zinc-700' };
  };

  // Upload file handler
  const processUploadedFiles = (filesList: FileList | null, overrideCourseId?: string) => {
    if (!filesList || filesList.length === 0) return;
    setIsUploading(true);

    const folderTarget = overrideCourseId || (activeFolderId && activeFolderId !== 'all' ? activeFolderId : targetUploadCourse);

    Array.from(filesList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        if (base64Data) {
          addCourseFile({
            name: file.name,
            size: file.size,
            type: file.type || file.name.split('.').pop() || 'file',
            courseId: folderTarget === 'general' ? undefined : folderTarget,
            fileData: base64Data
          });
        }
      };
      reader.readAsDataURL(file);
    });

    setTimeout(() => {
      setIsUploading(false);
    }, 400);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processUploadedFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent, overrideCourseId?: string) => {
    e.preventDefault();
    setIsDragOver(false);
    processUploadedFiles(e.dataTransfer.files, overrideCourseId);
  };

  const handleDownload = (file: CourseFile) => {
    const link = document.createElement('a');
    link.href = file.fileData;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to filter files by course ID
  const getFilesForCourse = (cId: string) => {
    if (cId === 'general') {
      return courseFiles.filter(f => !f.courseId);
    }
    return courseFiles.filter(f => f.courseId === cId);
  };

  // Folder categories
  const folderCategories = [
    ...courses.map(course => ({
      id: course.id,
      code: course.code,
      name: course.name,
      icon: course.icon || '📚',
      instructor: course.instructor,
      room: course.room,
      files: getFilesForCourse(course.id)
    })),
    {
      id: 'general',
      code: 'GENERAL',
      name: 'General & Uncategorized Files',
      icon: '📁',
      instructor: 'Shared Resources',
      room: 'Cloud Drive',
      files: getFilesForCourse('general')
    }
  ];

  const totalStorageBytes = courseFiles.reduce((acc, f) => acc + (f.size || 0), 0);

  // Active folder detail
  const activeFolderObj = folderCategories.find(f => f.id === activeFolderId);

  // Files in current scope (either all files or active folder files)
  const currentScopeFiles = activeFolderId 
    ? getFilesForCourse(activeFolderId)
    : courseFiles;

  // Filtered files in scope
  const filteredFiles = currentScopeFiles.filter((file) => {
    if (selectedTypeFilter !== 'all') {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (selectedTypeFilter === 'pdf' && ext !== 'pdf' && !file.type.includes('pdf')) return false;
      if (selectedTypeFilter === 'doc' && !['doc', 'docx', 'txt'].includes(ext) && !file.type.includes('word')) return false;
      if (selectedTypeFilter === 'ppt' && !['ppt', 'pptx'].includes(ext) && !file.type.includes('presentation')) return false;
      if (selectedTypeFilter === 'image' && !['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext) && !file.type.includes('image')) return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (!file.name.toLowerCase().includes(query)) return false;
    }

    return true;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-12"
    >
      {/* Hidden Global File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.svg,.zip"
        className="hidden"
      />

      {/* Top Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden bg-white dark:bg-[#121212] p-6 rounded-3xl border border-[#FFCEE3]/80 dark:border-[#222222] shadow-xs hover:shadow-lg transition-all group"
      >
        {/* Animated Background Decorative Blobs */}
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-gradient-to-br from-[#FF85BB]/20 to-[#FFCEE3]/10 dark:from-[#FF85BB]/10 dark:to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
        <div className="absolute left-1/3 -bottom-10 w-32 h-32 bg-[#FF85BB]/10 rounded-full blur-xl animate-pulse pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <motion.div 
                whileHover={{ rotate: 12, scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFF0F6] to-[#FFE4EF] dark:from-[#251522] dark:to-[#381B30] border border-[#FFCEE3] dark:border-[#4A2038] text-[#FF85BB] flex items-center justify-center shrink-0 shadow-2xs relative"
              >
                <FolderKanban size={22} className="relative z-10" />
                <span className="absolute inset-0 rounded-2xl bg-[#FF85BB]/20 blur-xs opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </motion.div>
              <div>
                <h1 className="text-xl font-black text-[#021A54] dark:text-zinc-100 flex items-center gap-2">
                  <span className="tracking-tight">Course Files & Resources</span>
                  <motion.span 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    className="text-xs bg-gradient-to-r from-[#FFCEE3] to-[#FF85BB] text-[#021A54] dark:text-[#021A54] px-3 py-0.5 rounded-full font-extrabold border border-white/50 shadow-2xs"
                  >
                    {courseFiles.length} {courseFiles.length === 1 ? 'file' : 'files'}
                  </motion.span>
                </h1>
              </div>
            </div>
            <p className="text-xs text-[#021A54]/70 dark:text-zinc-300 ml-13 font-medium max-w-xl">
              Organized course folder hub with interactive previewing, drag-and-drop categorizations, and instant download capabilities.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#021A54] to-[#0D2E7A] dark:from-[#FF85BB] dark:to-[#FF65A5] hover:shadow-md text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 border border-white/10"
            >
              <UploadCloud size={16} className="animate-bounce" />
              <span>Upload File</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Breadcrumb Navigation & Folder Selector Header */}
      <div className="bg-white dark:bg-[#121212] p-4 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#021A54] dark:text-zinc-200">
          <button
            onClick={() => setActiveFolderId(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              activeFolderId === null 
                ? 'bg-[#FFF0F6] dark:bg-[#20101C] text-[#FF85BB] border border-[#FFCEE3] dark:border-[#4A2038]' 
                : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-[#021A54]/70 dark:text-zinc-400'
            }`}
          >
            <Layers size={14} />
            <span>All Course Folders</span>
          </button>

          {activeFolderObj && (
            <>
              <ChevronRight size={14} className="text-[#FF85BB]" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF0F6] dark:bg-[#20101C] text-[#FF85BB] border border-[#FFCEE3] dark:border-[#4A2038]">
                <span>{activeFolderObj.icon}</span>
                <span>{activeFolderObj.code} - {activeFolderObj.name}</span>
              </div>
            </>
          )}
        </div>

        {/* Quick Folder Pills Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {folderCategories.map(cat => {
            const isActive = activeFolderId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFolderId(cat.id)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 shrink-0 ${
                  isActive
                    ? 'bg-[#021A54] dark:bg-[#FF85BB] text-white shadow-2xs'
                    : 'bg-[#F5F5F5] dark:bg-black hover:bg-[#FFF0F6] dark:hover:bg-[#20101C] text-[#021A54]/80 dark:text-zinc-300 border border-[#FFCEE3]/50 dark:border-[#222222]'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.code}</span>
                <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#FFCEE3] dark:bg-zinc-800 text-[#021A54] dark:text-zinc-200'
                }`}>
                  {cat.files.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW MODE 1: ALL FOLDERS GRID (WHEN activeFolderId === null) */}
      {activeFolderId === null && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-[#021A54] dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-[#FF85BB]" />
              <span>Categorized Course Folders ({folderCategories.length})</span>
            </h2>
            <span className="text-[11px] font-semibold text-[#021A54]/60 dark:text-zinc-400">
              Total Storage Used: <span className="font-bold text-[#FF85BB]">{formatFileSize(totalStorageBytes)}</span>
            </span>
          </div>

          {/* Folder Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {folderCategories.map((folder, idx) => {
              const totalFolderBytes = folder.files.reduce((a, b) => a + (b.size || 0), 0);

              return (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  whileHover={{ y: -6 }}
                  onClick={() => setActiveFolderId(folder.id)}
                  className="relative cursor-pointer group select-none"
                >
                  {/* Folder Tab / Notch */}
                  <div className="flex items-center">
                    <div className="h-6 px-4 rounded-t-2xl bg-[#FFF0F6] dark:bg-[#1E121B] border-t border-x border-[#FFCEE3] dark:border-[#4A2038] flex items-center gap-1.5 text-[11px] font-extrabold text-[#021A54] dark:text-[#FFB3D1] group-hover:bg-[#FF85BB] group-hover:text-white transition-colors">
                      <span className="text-xs">{folder.icon}</span>
                      <span>{folder.code}</span>
                    </div>
                    <div className="h-6 flex-1 border-b border-[#FFCEE3] dark:border-[#2D2D3A]"></div>
                  </div>

                  {/* Folder Main Body Card */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    className="p-5 rounded-b-3xl rounded-tr-3xl bg-white dark:bg-[#121212] border border-[#FFCEE3]/80 dark:border-[#2A2A38] shadow-xs group-hover:shadow-xl group-hover:border-[#FF85BB] dark:group-hover:border-[#FF85BB]/80 transition-all space-y-4 relative overflow-hidden"
                  >
                    {/* Subtle Gradient Glow */}
                    <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-[#FF85BB]/10 dark:bg-[#FF85BB]/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>

                    {/* Folder Card Header */}
                    <div className="flex items-start justify-between gap-2 relative z-10">
                      <div>
                        <h3 className="text-sm font-black text-[#021A54] dark:text-zinc-100 group-hover:text-[#FF85BB] transition-colors line-clamp-1">
                          {folder.name}
                        </h3>
                        {folder.instructor && (
                          <p className="text-[11px] text-[#021A54]/60 dark:text-zinc-400 font-medium">
                            {folder.instructor}
                          </p>
                        )}
                      </div>

                      <div className="w-10 h-10 rounded-2xl bg-[#FFF0F6] dark:bg-[#251522] border border-[#FFCEE3] dark:border-[#4A2038] text-[#FF85BB] flex items-center justify-center shrink-0 group-hover:rotate-6 group-hover:scale-110 transition-transform shadow-2xs">
                        <FolderOpen size={20} />
                      </div>
                    </div>

                    {/* Animated File Stack Preview Box */}
                    <div className="h-16 relative flex items-center justify-center pt-1 bg-[#FDF8FA] dark:bg-[#181820] rounded-2xl border border-[#FFCEE3]/40 dark:border-[#22222D]">
                      {folder.files.length === 0 ? (
                        <div className="text-[11px] text-[#021A54]/40 dark:text-zinc-500 font-medium italic">
                          Folder is empty • Drag files here
                        </div>
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                          {folder.files.slice(0, 3).map((file, fIdx) => {
                            const badge = getFileBadge(file.name, file.type);
                            const BadgeIcon = badge.icon;

                            // Fanning card offsets
                            const offsets = [
                              { rotate: -8, x: -22, y: 2, z: 30 },
                              { rotate: 0, x: 0, y: -3, z: 20 },
                              { rotate: 8, x: 22, y: 2, z: 10 }
                            ];
                            const off = offsets[fIdx] || offsets[1];

                            return (
                              <motion.div
                                key={file.id}
                                className={`absolute px-2.5 py-1 rounded-xl border ${badge.bg} ${badge.text} ${badge.border} shadow-2xs flex items-center gap-1.5 max-w-[130px] group-hover:scale-105 transition-all`}
                                style={{
                                  transform: `rotate(${off.rotate}deg) translate(${off.x}px, ${off.y}px)`,
                                  zIndex: off.z
                                }}
                              >
                                <BadgeIcon size={12} className="shrink-0" />
                                <span className="text-[10px] font-bold truncate">{file.name}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Folder Specs Footer */}
                    <div className="pt-3 border-t border-[#FFCEE3]/50 dark:border-[#222222] flex items-center justify-between text-[11px] font-bold text-[#021A54]/70 dark:text-zinc-400 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0F6] dark:bg-[#20101C] text-[#021A54] dark:text-[#FFB3D1] border border-[#FFCEE3] dark:border-[#4A2038]">
                          {folder.files.length} {folder.files.length === 1 ? 'file' : 'files'}
                        </span>
                        <span className="text-[10px] text-[#021A54]/50 dark:text-zinc-500">
                          ({formatFileSize(totalFolderBytes)})
                        </span>
                      </div>

                      <span className="text-[#FF85BB] font-black group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>Open Folder</span>
                        <ChevronRight size={14} />
                      </span>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: INSIDE A SPECIFIC FOLDER VIEW */}
      {activeFolderId !== null && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Folder Dropzone Uploader */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-[#121212] p-5 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222]">
                <h2 className="text-xs font-bold text-[#021A54] dark:text-zinc-200 flex items-center gap-1.5">
                  <UploadCloud size={16} className="text-[#FF85BB]" />
                  <span>Upload to {activeFolderObj?.code}</span>
                </h2>
                <button
                  onClick={() => setActiveFolderId(null)}
                  className="text-[11px] font-bold text-[#FF85BB] hover:underline flex items-center gap-1"
                >
                  <ArrowLeft size={12} />
                  <span>All Folders</span>
                </button>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => handleDrop(e, activeFolderId)}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all space-y-2
                  ${isDragOver 
                    ? 'border-[#FF85BB] bg-[#FFF0F6] dark:bg-[#22131D]' 
                    : 'border-[#FFCEE3] dark:border-[#333333] hover:border-[#FF85BB] hover:bg-[#FFF0F6]/40 dark:hover:bg-[#1A1A1A]'
                  }
                `}
              >
                <UploadCloud size={32} className="mx-auto text-[#FF85BB] animate-bounce" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#021A54] dark:text-zinc-100">
                    Click to browse or drop files here
                  </p>
                  <p className="text-[10px] text-[#021A54]/60 dark:text-zinc-400">
                    Files will be added directly into <span className="font-bold text-[#FF85BB]">{activeFolderObj?.code}</span>
                  </p>
                </div>
              </div>

              {isUploading && (
                <div className="p-2.5 rounded-xl bg-[#FFF0F6] dark:bg-[#22131D] text-xs text-[#FF85BB] font-bold flex items-center justify-center gap-2">
                  <FileCheck size={16} className="animate-spin" />
                  <span>Uploading file into folder...</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Files List/Grid inside Folder */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter & View Mode Controls */}
            <div className="bg-white dark:bg-[#121212] p-4 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-auto flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF85BB]" />
                <input
                  type="text"
                  placeholder={`Search files in ${activeFolderObj?.code}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-xs font-semibold text-[#021A54] dark:text-zinc-100 focus:outline-hidden focus:border-[#FF85BB]"
                />
              </div>

              {/* Type Filter & View Toggle */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="p-2 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-xs font-semibold text-[#021A54] dark:text-zinc-200"
                >
                  <option value="all">All File Types</option>
                  <option value="pdf">PDFs</option>
                  <option value="doc">Documents (Word/TXT)</option>
                  <option value="ppt">Slides (PPT)</option>
                  <option value="image">Images</option>
                </select>

                <div className="p-1 rounded-2xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] flex items-center gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-[#FF85BB] shadow-2xs' : 'text-gray-400'}`}
                    title="Grid View"
                  >
                    <Grid size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 text-[#FF85BB] shadow-2xs' : 'text-gray-400'}`}
                    title="List View"
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Rendered Files in Folder */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filteredFiles.map((file) => {
                    const badge = getFileBadge(file.name, file.type);
                    const BadgeIcon = badge.icon;

                    return (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -3 }}
                        className="p-4 rounded-3xl bg-white dark:bg-[#121212] border border-[#FFCEE3]/60 dark:border-[#222222] hover:border-[#FF85BB] transition-all shadow-2xs flex flex-col justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-3 rounded-2xl ${badge.bg} ${badge.text} ${badge.border} border shrink-0 flex items-center justify-center`}>
                            <BadgeIcon size={20} />
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <h3 className="text-xs font-bold text-[#021A54] dark:text-zinc-100 truncate group-hover:text-[#FF85BB] transition-colors" title={file.name}>
                              {file.name}
                            </h3>
                            <p className="text-[10px] text-[#021A54]/60 dark:text-zinc-400 font-semibold">
                              {formatFileSize(file.size)} • {file.uploadedAt}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#FFCEE3]/40 dark:border-[#222222] flex items-center justify-between">
                          {(file.type.includes('image') || file.type.includes('pdf')) ? (
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="text-[11px] font-bold text-[#021A54] dark:text-zinc-300 hover:text-[#FF85BB] flex items-center gap-1"
                            >
                              <Eye size={12} />
                              <span>Preview</span>
                            </button>
                          ) : <div />}

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDownload(file)}
                              className="p-1.5 rounded-xl bg-[#FFF0F6] dark:bg-zinc-800 text-[#FF85BB] hover:bg-[#FF85BB] hover:text-white transition-all"
                              title="Download File"
                            >
                              <Download size={13} />
                            </button>
                            <button
                              onClick={() => deleteCourseFile(file.id)}
                              className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete File"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              /* List View */
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredFiles.map((file) => {
                    const badge = getFileBadge(file.name, file.type);
                    const BadgeIcon = badge.icon;

                    return (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 rounded-3xl bg-white dark:bg-[#121212] border border-[#FFCEE3]/60 dark:border-[#222222] hover:border-[#FF85BB] transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`p-3 rounded-2xl ${badge.bg} ${badge.text} ${badge.border} border shrink-0 flex items-center justify-center`}>
                            <BadgeIcon size={20} />
                          </div>

                          <div className="space-y-1 min-w-0">
                            <h3 className="text-xs font-bold text-[#021A54] dark:text-zinc-100 truncate group-hover:text-[#FF85BB] transition-colors">
                              {file.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-[#021A54]/60 dark:text-zinc-400 font-semibold">
                              <span>{formatFileSize(file.size)}</span>
                              <span>•</span>
                              <span>{file.uploadedAt}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {(file.type.includes('image') || file.type.includes('pdf')) && (
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="px-3 py-1.5 rounded-xl bg-[#FFF0F6] dark:bg-zinc-800 text-[#021A54] dark:text-zinc-200 hover:bg-[#FFCEE3] dark:hover:bg-zinc-700 text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <Eye size={13} />
                              <span>Preview</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDownload(file)}
                            className="px-3 py-1.5 rounded-xl bg-[#021A54] dark:bg-[#FF85BB] hover:bg-[#FF85BB] dark:hover:bg-[#FF65A5] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </button>

                          <button
                            onClick={() => deleteCourseFile(file.id)}
                            className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {filteredFiles.length === 0 && (
              <div className="p-12 text-center bg-white dark:bg-[#121212] rounded-3xl border border-dashed border-[#FFCEE3] dark:border-[#222222] text-xs text-[#021A54]/60 dark:text-zinc-400 space-y-2">
                <FolderOpen size={36} className="mx-auto text-[#FF85BB] opacity-60 animate-pulse" />
                <p className="font-bold text-[#021A54] dark:text-zinc-200">No files found in {activeFolderObj?.code}.</p>
                <p className="text-[11px]">Upload documents directly into this folder using the box on the left.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#121212] w-full max-w-2xl max-h-[85vh] rounded-3xl p-6 border border-[#FFCEE3] dark:border-[#222222] shadow-2xl flex flex-col space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#FFCEE3]/60 dark:border-[#222222]">
                <div className="flex items-center gap-2 truncate pr-2">
                  <Eye size={18} className="text-[#FF85BB]" />
                  <h3 className="text-sm font-bold text-[#021A54] dark:text-zinc-100 truncate">{previewFile.name}</h3>
                </div>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-auto max-h-[60vh] flex items-center justify-center p-2 bg-gray-50 dark:bg-black rounded-2xl border border-gray-200 dark:border-[#222222]">
                {previewFile.type.includes('image') ? (
                  <img src={previewFile.fileData} alt={previewFile.name} className="max-w-full max-h-[50vh] object-contain rounded-xl" />
                ) : (
                  <iframe src={previewFile.fileData} title={previewFile.name} className="w-full h-[50vh] rounded-xl border-0" />
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-[#021A54]/60 dark:text-zinc-400 font-semibold">{formatFileSize(previewFile.size)}</span>
                <button
                  onClick={() => handleDownload(previewFile)}
                  className="px-4 py-2 bg-[#FF85BB] hover:bg-[#FF85BB]/90 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 shadow-xs"
                >
                  <Download size={14} />
                  <span>Download File</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
