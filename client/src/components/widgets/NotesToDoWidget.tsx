import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { Task, Note } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface NotesToDoWidgetProps {
  userId: number;
}

export default function NotesToDoWidget({ userId }: NotesToDoWidgetProps) {
  const [newTask, setNewTask] = useState("");
  const [quickNote, setQuickNote] = useState("");
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks', userId],
  });

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['/api/notes', userId],
  });

  const addTaskMutation = useMutation({
    mutationFn: (task: { userId: number; title: string }) =>
      apiRequest('POST', '/api/tasks', task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', userId] });
      setNewTask("");
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      apiRequest('PATCH', `/api/tasks/${id}`, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', userId] });
    }
  });

  const addNoteMutation = useMutation({
    mutationFn: (note: { userId: number; content: string }) =>
      apiRequest('POST', '/api/notes', note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes', userId] });
      setQuickNote("");
    }
  });

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    addTaskMutation.mutate({ userId, title: newTask.trim() });
  };

  const handleTaskToggle = (id: number, completed: boolean) => {
    updateTaskMutation.mutate({ id, completed: !completed });
  };

  const handleAddNote = () => {
    if (!quickNote.trim()) return;
    addNoteMutation.mutate({ userId, content: quickNote.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  };

  return (
    <Card className="zebulon-card border border-white/20 text-white h-full flex flex-col shadow-lg">
      <CardContent className="p-6 flex-1 flex flex-col overflow-hidden space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold zebulon-text-gradient">Tasks & Notes</h3>
          <Button
            onClick={handleAddTask}
            disabled={!newTask.trim() || addTaskMutation.isPending}
            className="bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary p-2 rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Add new task - Enhanced styling */}
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleAddTask)}
            className="zebulon-input text-sm rounded-lg"
          />
        </div>
        
        {/* Tasks list - Enhanced with Zebulon styling */}
        <div className="space-y-4 flex-1">
          <div className="space-y-3">
            {tasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleTaskToggle(task.id, task.completed)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary border-white/40"
                />
                <span className={`text-sm flex-1 transition-all ${
                  task.completed ? 'text-gray-400 line-through' : 'text-white'
                }`}>
                  {task.title}
                </span>
              </div>
            ))}
            
            {tasks.length === 0 && (
              <div className="text-sm zebulon-text-muted text-center py-8 border border-dashed border-white/20 rounded-lg">
                No tasks yet - add one above
              </div>
            )}
          </div>
        </div>
        
        {/* Quick note - Enhanced styling */}
        <div className="zebulon-divider">
          <Textarea
            placeholder="Quick note..."
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleAddNote)}
            className="zebulon-input resize-none text-sm rounded-lg min-h-[80px]"
            rows={3}
          />
          {quickNote.trim() && (
            <Button
              onClick={handleAddNote}
              disabled={addNoteMutation.isPending}
              className="mt-3 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary px-4 py-2 text-xs rounded-lg transition-all"
              size="sm"
            >
              Save Note
            </Button>
          )}
        </div>
        
        {/* Recent notes preview */}
        {notes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Recent notes:</div>
            {notes.slice(0, 2).map((note) => (
              <div key={note.id} className="text-xs text-gray-600 truncate">
                {note.content.slice(0, 50)}...
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
