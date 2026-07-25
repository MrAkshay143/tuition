import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store';
import { useStudentBookmarks } from '@/api/resources/students';
import { Card, Modal, Badge, Button } from '@/components/ui';
import { FileText, PlayCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PersonalNotesListProps {
  modulesList: any[];
  onNoteClick?: (lessonId: number) => void;
}

export const PersonalNotesList = ({ modulesList, onNoteClick }: PersonalNotesListProps) => {
  const { isAuthenticated } = useAuthStore();
  const { data: bookmarksData, isLoading } = useStudentBookmarks();
  
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any>(null);

  useEffect(() => {
    if (!modulesList || modulesList.length === 0) return;
    
    const allLessons = modulesList.flatMap(m => m.lessons || []);
    const foundNotes: any[] = [];
    
    if (isAuthenticated) {
       if (bookmarksData) {
         allLessons.forEach(lesson => {
           const bookmark = bookmarksData.find((b: any) => b.lesson_id === lesson.id);
           if (bookmark && bookmark.note) {
             foundNotes.push({
               lessonId: lesson.id,
               lessonTitle: lesson.title,
               moduleTitle: modulesList.find(m => m.lessons.some((l:any) => l.id === lesson.id))?.title || '',
               note: bookmark.note,
               updatedAt: bookmark.updated_at || new Date().toISOString()
             });
           }
         });
       }
    } else {
       allLessons.forEach(lesson => {
         try {
           const cachedNote = localStorage.getItem(`eduflow_guest_note_${lesson.id}`);
           if (cachedNote) {
             foundNotes.push({
               lessonId: lesson.id,
               lessonTitle: lesson.title,
               moduleTitle: modulesList.find(m => m.lessons.some((l:any) => l.id === lesson.id))?.title || '',
               note: cachedNote,
               updatedAt: new Date().toISOString()
             });
           }
         } catch(e) {}
       });
    }
    setNotes(foundNotes);
  }, [modulesList, bookmarksData, isAuthenticated]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-slate-900 dark:text-white font-extrabold text-sm sm:text-base font-[Outfit]">My Personal Notes</h3>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#8e91b5]">Review and manage your notes across this course.</p>
        </div>
        <Badge variant="primary">{notes.length} Notes</Badge>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8"><span className="animate-spin inline-block text-blue-500">⌛</span></div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 dark:bg-[#0c0d24] rounded-xl border border-slate-200 dark:border-[#1b1c3d]">
          <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No notes found yet.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Take notes while watching videos to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {notes.map(note => (
            <Card 
              key={note.lessonId} 
              className="p-4 cursor-pointer hover:border-blue-500/50 hover:shadow-lg transition-all border border-slate-200 dark:border-[#1b1c3d] bg-white dark:bg-[#0c0d24]"
              onClick={() => setSelectedNote(note)}
            >
               <div className="flex items-start justify-between mb-2">
                 <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 truncate max-w-[200px]">{note.moduleTitle}</p>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <PlayCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{note.lessonTitle}</span>
                    </h4>
                 </div>
               </div>
               <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 opacity-80 prose dark:prose-invert max-w-none">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.note}</ReactMarkdown>
               </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        title={
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="font-[Outfit] font-bold text-slate-900 dark:text-white">Note Preview</span>
          </div>
        }
        size="lg"
      >
        {selectedNote && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-white/5">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{selectedNote.moduleTitle}</p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                 <PlayCircle className="w-4 h-4 text-blue-500 shrink-0" />
                 {selectedNote.lessonTitle}
              </h4>
            </div>
            
            <div className="prose dark:prose-invert max-w-none prose-sm sm:prose-base bg-white dark:bg-[#0c0d24] p-4 rounded-xl border border-slate-100 dark:border-[#1b1c3d] max-h-[50vh] overflow-y-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedNote.note}</ReactMarkdown>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedNote(null)}>Close</Button>
              <Button 
                size="sm" 
                onClick={() => {
                   if(onNoteClick) onNoteClick(selectedNote.lessonId);
                   setSelectedNote(null);
                }}
              >
                Go to Lesson
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
