import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, 
  Pin, 
  Trash2, 
  Plus, 
  Copy, 
  Check, 
  Sparkles,
  ChevronUp,
  ChevronDown,
  Heading2,
  List,
  CheckSquare,
  AlertCircle,
  Quote,
  Code,
  Minus,
  AlignLeft,
  X,
  FileText,
  GraduationCap,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Note, NoteBlock, BlockType } from '../types';

interface NoteEditorProps {
  noteId: string;
  onBack: () => void;
}

interface AutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

const applyTextFormatting = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  format: 'bold' | 'italic' | 'underline'
) => {
  const wrappers = {
    bold: ['**', '**'],
    italic: ['*', '*'],
    underline: ['<u>', '</u>']
  } as const;

  const [prefix, suffix] = wrappers[format];
  const selectedText = value.slice(selectionStart, selectionEnd);
  const replacementText = selectionStart === selectionEnd
    ? `${prefix}${suffix}`
    : `${prefix}${selectedText}${suffix}`;

  return {
    nextValue: `${value.slice(0, selectionStart)}${replacementText}${value.slice(selectionEnd)}`,
    cursorPosition: selectionStart === selectionEnd
      ? selectionStart + prefix.length
      : selectionEnd + suffix.length
  };
};

const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  rows = 4
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 96)}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={className}
    />
  );
};

export const NoteEditor: React.FC<NoteEditorProps> = ({ noteId, onBack }) => {
  const { data, updateNote, deleteNote, togglePinNote } = useWorkspace();
  const note = data.notes.find(n => n.id === noteId);

  const [newTagInput, setNewTagInput] = useState('');
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  if (!note) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#121212] rounded-3xl border border-[#FFCEE3] dark:border-[#222222]">
        <p className="text-xs font-bold text-[#021A54] dark:text-zinc-100">Note not found!</p>
        <button onClick={onBack} className="mt-2 text-xs text-[#FF85BB] underline font-semibold">
          Back to Notes
        </button>
      </div>
    );
  }

  const handleTitleChange = (newTitle: string) => {
    updateNote({ ...note, title: newTitle });
  };

  const handleCourseChange = (courseId: string) => {
    updateNote({ ...note, courseId: courseId === 'none' ? undefined : courseId });
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim();
    if (!note.tags.includes(tag)) {
      updateNote({ ...note, tags: [...note.tags, tag] });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateNote({ ...note, tags: note.tags.filter(t => t !== tagToRemove) });
  };

  // Block Manipulation
  const handleBlockContentChange = (blockId: string, content: string) => {
    const updatedBlocks = note.blocks.map(b => b.id === blockId ? { ...b, content } : b);
    updateNote({ ...note, blocks: updatedBlocks });
  };

  const handleBlockCheckedToggle = (blockId: string) => {
    const updatedBlocks = note.blocks.map(b => b.id === blockId ? { ...b, checked: !b.checked } : b);
    updateNote({ ...note, blocks: updatedBlocks });
  };

  const handleBlockTypeChange = (blockId: string, newType: BlockType) => {
    const updatedBlocks = note.blocks.map(b => b.id === blockId ? { ...b, type: newType } : b);
    updateNote({ ...note, blocks: updatedBlocks });
  };

  const handleAddBlock = (afterIndex: number, type: BlockType = 'paragraph') => {
    const newBlock: NoteBlock = {
      id: 'b-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type,
      content: '',
      checked: false,
      calloutIcon: '💡',
      language: 'typescript'
    };
    const updatedBlocks = [...note.blocks];
    updatedBlocks.splice(afterIndex + 1, 0, newBlock);
    updateNote({ ...note, blocks: updatedBlocks });
  };

  const handleDeleteBlock = (blockId: string) => {
    if (note.blocks.length <= 1) return; // keep at least 1 block
    const updatedBlocks = note.blocks.filter(b => b.id !== blockId);
    updateNote({ ...note, blocks: updatedBlocks });
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= note.blocks.length) return;
    const updatedBlocks = [...note.blocks];
    const [moved] = updatedBlocks.splice(index, 1);
    updatedBlocks.splice(newIndex, 0, moved);
    updateNote({ ...note, blocks: updatedBlocks });
  };

  const handleCopyCode = (blockId: string, codeContent: string) => {
    navigator.clipboard.writeText(codeContent);
    setCopiedBlockId(blockId);
    setTimeout(() => setCopiedBlockId(null), 2000);
  };

  const handleTextShortcut = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    currentValue: string,
    onValueChange: (value: string) => void
  ) => {
    const isModifierPressed = event.ctrlKey || event.metaKey;
    if (!isModifierPressed) return;

    let format: 'bold' | 'italic' | 'underline' | null = null;
    if (event.key.toLowerCase() === 'b') format = 'bold';
    if (event.key.toLowerCase() === 'i') format = 'italic';
    if (event.key.toLowerCase() === 'u') format = 'underline';

    if (!format) return;

    event.preventDefault();
    const textarea = event.currentTarget;
    const { selectionStart, selectionEnd } = textarea;
    const { nextValue, cursorPosition } = applyTextFormatting(currentValue, selectionStart, selectionEnd, format);

    onValueChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const handleDeleteNoteConfirm = () => {
    deleteNote(note.id);
    onBack();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 pb-16 max-w-4xl mx-auto"
    >
      {/* Top Bar Actions */}
      <div className="flex items-center justify-between bg-white dark:bg-[#121212] p-4 rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-2xs">
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-2xl bg-[#F5F5F5] dark:bg-black hover:bg-[#FFCEE3]/30 text-[#021A54] dark:text-zinc-100 text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <ArrowLeft size={15} />
          <span>Back to Notes</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Toggle Pin */}
          <button
            onClick={() => togglePinNote(note.id)}
            className={`
              px-3 py-1.5 rounded-2xl border text-xs font-semibold transition-all flex items-center gap-1.5
              ${note.pinned 
                ? 'bg-[#FFCEE3] dark:bg-[#4A2038] border-[#FF85BB] text-[#021A54] dark:text-[#FFB3D1]' 
                : 'border-gray-200 dark:border-[#333333] text-[#021A54]/60 dark:text-zinc-300 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800'
              }
            `}
            title={note.pinned ? "Unpin note" : "Pin note"}
          >
            <Pin size={14} className={note.pinned ? 'fill-[#FF85BB] text-[#FF85BB]' : ''} />
            <span className="text-[11px]">{note.pinned ? 'Pinned' : 'Pin'}</span>
          </button>

          {/* Delete Note */}
          <button
            onClick={handleDeleteNoteConfirm}
            className="p-2 rounded-2xl border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs transition-colors"
            title="Delete Note"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Note Document Card */}
      <div className="bg-white dark:bg-[#121212] rounded-3xl border border-[#FFCEE3]/60 dark:border-[#222222] shadow-sm overflow-hidden p-6 sm:p-10 space-y-6">
        {/* Document Header & Metadata Bar */}
        <div className="space-y-4 border-b border-[#FFCEE3]/50 dark:border-[#222222] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0F6] dark:bg-[#2A1828] border border-[#FFCEE3] dark:border-[#4A2038] flex items-center justify-center text-[#FF85BB] shrink-0 shadow-2xs">
              <FileText size={22} />
            </div>

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={note.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled Note..."
                className="w-full text-2xl sm:text-3xl font-black text-[#021A54] dark:text-zinc-100 placeholder-[#021A54]/30 dark:placeholder-zinc-600 border-none outline-hidden bg-transparent"
              />
              <p className="text-[10px] text-[#021A54]/40 dark:text-zinc-400 font-semibold mt-0.5">
                Last modified {note.updatedAt}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs pt-2">
            {/* Course Link Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#FFF0F6] dark:bg-[#2A1828] px-3 py-1.5 rounded-2xl border border-[#FFCEE3] dark:border-[#4A2038]">
              <GraduationCap size={15} className="text-[#FF85BB]" />
              <select
                value={note.courseId || 'none'}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="bg-transparent text-[#021A54] dark:text-[#FFB3D1] font-bold text-xs focus:outline-hidden"
              >
                <option value="none" className="dark:bg-[#121212] dark:text-zinc-100">No Specific Course</option>
                {data.courses.map(c => (
                  <option key={c.id} value={c.id} className="dark:bg-[#121212] dark:text-zinc-100">{c.code} - {c.name}</option>
                ))}
              </select>
            </div>

            {/* Tags Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {note.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-[#FFCEE3]/50 dark:bg-[#2A1828] text-[#021A54] dark:text-[#FFB3D1] font-semibold text-[11px] flex items-center gap-1 border border-transparent dark:border-[#4A2038]"
                >
                  <span>#{tag}</span>
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                    <X size={10} />
                  </button>
                </span>
              ))}

              {/* Add Tag Input */}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="+ Tag"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                  }}
                  className="w-16 p-1 px-2 text-[11px] rounded-xl bg-[#F5F5F5] dark:bg-black border border-[#FFCEE3] dark:border-[#222222] text-[#021A54] dark:text-zinc-100 focus:w-24 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Blocks Container */}
        <div className="space-y-3 pt-2">
          {note.blocks.map((block, index) => (
            <div 
              key={block.id}
              className="group/block relative flex items-start gap-2 rounded-2xl p-1.5 transition-colors hover:bg-[#FFF0F6]/40 dark:hover:bg-zinc-900/40"
            >
              {/* Block Controls Bar (Shows on Hover) */}
              <div className="opacity-0 group-hover/block:opacity-100 transition-opacity flex items-center gap-0.5 pt-1.5 shrink-0">
                <button
                  onClick={() => handleMoveBlock(index, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded-md text-[#021A54]/40 dark:text-zinc-400 hover:text-[#021A54] dark:hover:text-zinc-100 disabled:opacity-20"
                  title="Move block up"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={() => handleMoveBlock(index, 'down')}
                  disabled={index === note.blocks.length - 1}
                  className="p-1 rounded-md text-[#021A54]/40 dark:text-zinc-400 hover:text-[#021A54] dark:hover:text-zinc-100 disabled:opacity-20"
                  title="Move block down"
                >
                  <ChevronDown size={12} />
                </button>

                {/* Block Type Change Dropdown */}
                <select
                  value={block.type}
                  onChange={(e) => handleBlockTypeChange(block.id, e.target.value as BlockType)}
                  className="text-[10px] p-1 bg-white dark:bg-black border border-[#FFCEE3] dark:border-[#222222] rounded-lg text-[#021A54] dark:text-zinc-200 font-semibold"
                >
                  <option value="paragraph">Text</option>
                  <option value="heading-1">H1 Heading</option>
                  <option value="heading-2">H2 Subheading</option>
                  <option value="heading-3">H3 Topic</option>
                  <option value="todo">Checkbox Todo</option>
                  <option value="bullet">Bullet Item</option>
                  <option value="callout">Callout Box</option>
                  <option value="quote">Quote Box</option>
                  <option value="code">Code Block</option>
                  <option value="divider">Divider Line</option>
                </select>

                <button
                  onClick={() => handleDeleteBlock(block.id)}
                  className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Delete block"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Main Render Block Content */}
              <div className="flex-1 min-w-0">
                {block.type === 'paragraph' && (
                  <AutoResizeTextarea
                    value={block.content}
                    onChange={(value) => handleBlockContentChange(block.id, value)}
                    onKeyDown={(event) => handleTextShortcut(event, block.content, (value) => handleBlockContentChange(block.id, value))}
                    placeholder="Type text..."
                    rows={4}
                    className="w-full min-h-[7rem] text-sm text-[#021A54] dark:text-zinc-200 leading-7 bg-transparent border-none outline-hidden resize-none overflow-hidden py-1 placeholder-[#021A54]/30 dark:placeholder-zinc-500"
                  />
                )}

                {block.type === 'heading-1' && (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => handleBlockContentChange(block.id, e.target.value)}
                    placeholder="Heading 1..."
                    className="w-full text-xl font-bold text-[#021A54] dark:text-zinc-100 bg-transparent border-none outline-hidden placeholder-[#021A54]/30 dark:placeholder-zinc-500"
                  />
                )}

                {block.type === 'heading-2' && (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => handleBlockContentChange(block.id, e.target.value)}
                    placeholder="Heading 2..."
                    className="w-full text-lg font-bold text-[#021A54] dark:text-zinc-100 bg-transparent border-none outline-hidden placeholder-[#021A54]/30 dark:placeholder-zinc-500"
                  />
                )}

                {block.type === 'heading-3' && (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => handleBlockContentChange(block.id, e.target.value)}
                    placeholder="Heading 3..."
                    className="w-full text-base font-semibold text-[#FF85BB] dark:text-[#FF85BB] bg-transparent border-none outline-hidden placeholder-[#021A54]/30 dark:placeholder-zinc-500"
                  />
                )}

                {block.type === 'todo' && (
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={block.checked || false}
                      onChange={() => handleBlockCheckedToggle(block.id)}
                      className="w-4 h-4 accent-[#FF85BB] rounded-md cursor-pointer"
                    />
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => handleBlockContentChange(block.id, e.target.value)}
                      placeholder="Task to do..."
                      className={`w-full text-sm bg-transparent border-none outline-hidden ${block.checked ? 'line-through text-[#021A54]/40 dark:text-zinc-500' : 'text-[#021A54] dark:text-zinc-200'}`}
                    />
                  </div>
                )}

                {block.type === 'bullet' && (
                  <div className="flex items-start gap-2">
                    <span className="text-[#FF85BB] font-bold text-base leading-snug">•</span>
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => handleBlockContentChange(block.id, e.target.value)}
                      placeholder="Bullet list item..."
                      className="w-full text-sm text-[#021A54] dark:text-zinc-200 bg-transparent border-none outline-hidden"
                    />
                  </div>
                )}

                {block.type === 'callout' && (
                  <div className="p-3.5 rounded-2xl bg-[#FFF0F6] dark:bg-[#2A1828] border border-[#FFCEE3] dark:border-[#4A2038] flex items-start gap-3">
                    <Info size={18} className="text-[#FF85BB] shrink-0 mt-0.5" />
                    <AutoResizeTextarea
                      value={block.content}
                      onChange={(value) => handleBlockContentChange(block.id, value)}
                      onKeyDown={(event) => handleTextShortcut(event, block.content, (value) => handleBlockContentChange(block.id, value))}
                      placeholder="Callout note or key takeaway..."
                      rows={3}
                      className="w-full min-h-[4rem] text-xs font-semibold text-[#021A54] dark:text-[#FFB3D1] bg-transparent border-none outline-hidden resize-none overflow-hidden"
                    />
                  </div>
                )}

                {block.type === 'quote' && (
                  <div className="pl-4 border-l-4 border-[#FF85BB] py-1 italic bg-[#FFF0F6]/40 dark:bg-zinc-900/40 rounded-r-xl">
                    <AutoResizeTextarea
                      value={block.content}
                      onChange={(value) => handleBlockContentChange(block.id, value)}
                      onKeyDown={(event) => handleTextShortcut(event, block.content, (value) => handleBlockContentChange(block.id, value))}
                      placeholder="Quote or inspirational thought..."
                      rows={3}
                      className="w-full min-h-[4rem] text-sm text-[#021A54]/80 dark:text-zinc-300 bg-transparent border-none outline-hidden resize-none overflow-hidden"
                    />
                  </div>
                )}

                {block.type === 'code' && (
                  <div className="bg-[#021A54] dark:bg-black text-white p-4 rounded-2xl font-mono text-xs relative group/code border border-transparent dark:border-[#222222]">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 dark:border-zinc-800 text-[10px] text-white/60 dark:text-zinc-400">
                      <span>TypeScript / Code Snippet</span>
                      <button
                        onClick={() => handleCopyCode(block.id, block.content)}
                        className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white flex items-center gap-1"
                      >
                        {copiedBlockId === block.id ? (
                          <>
                            <Check size={12} className="text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <AutoResizeTextarea
                      value={block.content}
                      onChange={(value) => handleBlockContentChange(block.id, value)}
                      onKeyDown={(event) => handleTextShortcut(event, block.content, (value) => handleBlockContentChange(block.id, value))}
                      placeholder="// Type code here..."
                      rows={6}
                      className="w-full min-h-[6rem] text-xs font-mono bg-transparent border-none outline-hidden resize-none overflow-hidden text-pink-200 dark:text-pink-300"
                    />
                  </div>
                )}

                {block.type === 'divider' && (
                  <div className="py-2">
                    <hr className="border-t-2 border-dashed border-[#FFCEE3] dark:border-[#222222]" />
                  </div>
                )}
              </div>

              {/* Quick Add Block Button next to block */}
              <button
                onClick={() => handleAddBlock(index)}
                className="opacity-0 group-hover/block:opacity-100 transition-opacity p-1.5 rounded-xl hover:bg-[#FFCEE3] dark:hover:bg-zinc-800 text-[#021A54] dark:text-zinc-100 text-xs shrink-0 self-center"
                title="Insert new block below"
              >
                <Plus size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Toolbar to Add Block */}
        <div className="pt-6 border-t border-[#FFCEE3]/60 dark:border-[#222222] flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#021A54]/60 dark:text-zinc-400 mr-2 flex items-center gap-1">
            <Sparkles size={13} className="text-[#FF85BB]" />
            <span>+ Add Block:</span>
          </span>

          {[
            { type: 'paragraph', label: 'Text', icon: AlignLeft },
            { type: 'heading-2', label: 'Heading', icon: Heading2 },
            { type: 'todo', label: 'Todo', icon: CheckSquare },
            { type: 'bullet', label: 'Bullet', icon: List },
            { type: 'callout', label: 'Callout', icon: AlertCircle },
            { type: 'quote', label: 'Quote', icon: Quote },
            { type: 'code', label: 'Code', icon: Code },
            { type: 'divider', label: 'Divider', icon: Minus },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                onClick={() => handleAddBlock(note.blocks.length - 1, item.type as BlockType)}
                className="px-3 py-1.5 rounded-2xl bg-[#F5F5F5] dark:bg-black hover:bg-[#FFCEE3] dark:hover:bg-[#2A1828] text-[#021A54] dark:text-zinc-100 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs border border-transparent dark:border-[#222222]"
              >
                <Icon size={13} className="text-[#FF85BB]" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
