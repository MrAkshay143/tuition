import React, { useState, useEffect, useRef } from 'react';
import { useSaveBookmark, useStudentBookmarks } from '@/api/resources/students';
import { Card, Textarea, Spinner } from '@/components/ui';
import { Save, CheckCircle2, ChevronDown, ChevronUp, FileText, Database, HardDrive, Bold, Italic, List, Code } from 'lucide-react';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';

export const PersonalNotesEditor = ({ lessonId }: { lessonId: number }) => {
  const { isAuthenticated } = useAuthStore();
  const { data: bookmarksData, isLoading } = useStudentBookmarks();
  const saveMutation = useSaveBookmark();
  
  const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default as requested!
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load note from Database (logged in user) or localStorage (guest user)
  useEffect(() => {
    if (!lessonId) return;

    if (isAuthenticated) {
      if (bookmarksData) {
        const bookmark = bookmarksData.find((b: any) => b.lesson_id === lessonId);
        if (bookmark && bookmark.note) {
          setNote(bookmark.note);
        } else {
          setNote('');
        }
      }
    } else {
      // Guest User: Load from browser Local Storage cache
      try {
        const cachedNote = localStorage.getItem(`eduflow_guest_note_${lessonId}`);
        setNote(cachedNote || '');
      } catch (e) {
        setNote('');
      }
    }
  }, [lessonId, bookmarksData, isAuthenticated]);

  const handleSave = (currentNote: string) => {
    setIsSaving(true);
    if (isAuthenticated) {
      // Logged in user: Save to backend database API
      saveMutation.mutate(
        { lessonId, data: { note: currentNote } },
        {
          onSuccess: () => {
            setIsSaving(false);
            setLastSaved(new Date());
          },
          onError: () => {
            setIsSaving(false);
            toast.error('Failed to save note');
          }
        }
      );
    } else {
      // Guest user: Save locally to browser cache
      try {
        localStorage.setItem(`eduflow_guest_note_${lessonId}`, currentNote);
        setIsSaving(false);
        setLastSaved(new Date());
      } catch (e) {
        setIsSaving(false);
        toast.error('Failed to save local note');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNote(val);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Debounce autosave (700ms)
    typingTimeoutRef.current = setTimeout(() => {
      handleSave(val);
    }, 700);
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById(`markdown-notes-input-${lessonId}`) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = note.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    const newNote = note.substring(0, start) + replacement + note.substring(end);
    setNote(newNote);
    handleSave(newNote);
  };

  if (isAuthenticated && isLoading) return <Spinner size={20} />;

  return (
    <Card className="p-3 sm:p-3.5 border border-indigo-500/30 rounded-2xl shadow-xs bg-[rgb(var(--bg-surface))] mt-3 text-left">
      {/* Header Bar with Toggle (Collapsed by default) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="flex justify-between items-center cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <FileText size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-xs sm:text-sm text-[rgb(var(--text-primary))] font-[Outfit]">Personal Notes</h4>
              {note.trim() && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" title="Has notes" />
              )}
            </div>
            <div className="text-[10px] text-[rgb(var(--text-muted))] flex items-center gap-1 font-semibold">
              {isAuthenticated ? (
                <span className="text-emerald-500 flex items-center gap-1">
                  <Database size={10} /> Cloud Synced
                </span>
              ) : (
                <span className="text-amber-500 flex items-center gap-1">
                  <HardDrive size={10} /> Local Cache
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="text-[10px] sm:text-[11px] text-[rgb(var(--text-muted))] font-medium">
            {isSaving ? (
              <span className="flex items-center gap-1"><Spinner size={11} /> Saving...</span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-emerald-500 font-bold"><CheckCircle2 size={11} /> Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            ) : (
              <span className="flex items-center gap-1"><Save size={11} /> Autosaved</span>
            )}
          </div>
          <button className="p-1 rounded-lg hover:bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))]">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Editor Area */}
      {isExpanded && (
        <div className="space-y-2 pt-2.5 mt-2.5 border-t border-[rgb(var(--border))]">
          {/* Toolbar formatting buttons */}
          <div className="flex items-center gap-1 pb-1">
            <button type="button" onClick={() => insertMarkdown('**', '**')} className="p-1.5 rounded-lg bg-[rgb(var(--bg-elevated))] hover:bg-indigo-500/10 text-[rgb(var(--text-secondary))] hover:text-indigo-500 transition-colors" title="Bold">
              <Bold size={12} />
            </button>
            <button type="button" onClick={() => insertMarkdown('*', '*')} className="p-1.5 rounded-lg bg-[rgb(var(--bg-elevated))] hover:bg-indigo-500/10 text-[rgb(var(--text-secondary))] hover:text-indigo-500 transition-colors" title="Italic">
              <Italic size={12} />
            </button>
            <button type="button" onClick={() => insertMarkdown('- ')} className="p-1.5 rounded-lg bg-[rgb(var(--bg-elevated))] hover:bg-indigo-500/10 text-[rgb(var(--text-secondary))] hover:text-indigo-500 transition-colors" title="Bullet List">
              <List size={12} />
            </button>
            <button type="button" onClick={() => insertMarkdown('`', '`')} className="p-1.5 rounded-lg bg-[rgb(var(--bg-elevated))] hover:bg-indigo-500/10 text-[rgb(var(--text-secondary))] hover:text-indigo-500 transition-colors" title="Code">
              <Code size={12} />
            </button>
          </div>

          <Textarea
            id={`markdown-notes-input-${lessonId}`}
            value={note}
            onChange={handleChange}
            placeholder="Write notes here... Markdown supported (**bold**, *italic*, - list)"
            className="min-h-[120px] font-mono text-xs bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] rounded-xl p-2.5 text-[rgb(var(--text-primary))]"
          />
          {!isAuthenticated && (
            <p className="text-[10px] text-amber-500 font-semibold px-0.5">
              Saved locally. Login to sync across devices.
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
