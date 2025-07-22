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
    <Card className="widget-card bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Notes & Tasks</h3>
          <Button
            onClick={handleAddTask}
            disabled={!newTask.trim() || addTaskMutation.isPending}
            className="text-blue-600 hover:text-blue-700 p-1 h-auto w-auto bg-transparent hover:bg-transparent border-none shadow-none"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Add new task */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleAddTask)}
            className="text-sm"
          />
        </div>
        
        {/* Tasks list */}
        <div className="space-y-3 mb-4">
          {tasks.slice(0, 3).map((task) => (
            <div key={task.id} className="flex items-center space-x-3">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => handleTaskToggle(task.id, task.completed)}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <span className={`text-sm flex-1 ${
                task.completed ? 'text-gray-500 line-through' : 'text-gray-700'
              }`}>
                {task.title}
              </span>
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-2">
              No tasks yet
            </div>
          )}
        </div>
        
        {/* Quick note */}
        <div className="pt-3 border-t border-gray-100">
          <Textarea
            placeholder="Quick note..."
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleAddNote)}
            className="text-sm border-none p-0 resize-none focus:ring-0 focus:border-none shadow-none"
            rows={2}
          />
          {quickNote.trim() && (
            <Button
              onClick={handleAddNote}
              disabled={addNoteMutation.isPending}
              className="mt-2 text-xs"
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
