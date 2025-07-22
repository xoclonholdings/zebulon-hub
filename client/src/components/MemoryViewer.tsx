import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Database, MessageSquare, CheckSquare, Trash2, FileText } from 'lucide-react';

interface MemoryData {
  storageLocation: {
    file: string;
    class: string;
    type: string;
    dataStructures: Record<string, string>;
  };
  conversationHistory: Array<{
    id: number;
    message: string;
    timestamp: string;
  }>;
  databaseQueries: Array<{
    id: number;
    query: string;
    sqlQuery: string;
    timestamp: string;
  }>;
  tasks: Array<{
    id: number;
    title: string;
    description: string;
    completed: boolean;
    createdAt: string;
  }>;
  memoryStats: {
    totalConversations: number;
    totalQueries: number;
    totalTasks: number;
    completedTasks: number;
  };
}

export function MemoryViewer({ userId }: { userId: number }) {
  const { data: memoryData, isLoading, refetch } = useQuery<MemoryData>({
    queryKey: ['/api/memory', userId],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="w-8 h-8 animate-pulse mx-auto mb-2" />
          <p>Loading Zed's memory...</p>
        </div>
      </div>
    );
  }

  if (!memoryData) {
    return (
      <div className="text-center text-gray-500 p-8">
        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Unable to access memory data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Memory Storage Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Zed's Memory Storage Location
          </CardTitle>
          <CardDescription>
            Where Zed stores his memories and how you can access them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h4 className="font-semibold mb-2">Storage Details</h4>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm">
                <p><strong>File:</strong> {memoryData.storageLocation.file}</p>
                <p><strong>Class:</strong> {memoryData.storageLocation.class}</p>
                <p><strong>Type:</strong> {memoryData.storageLocation.type}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Data Structures</h4>
              <div className="grid gap-2">
                {Object.entries(memoryData.storageLocation.dataStructures).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="font-medium">{key}</span>
                    <code className="text-sm text-blue-600 dark:text-blue-400">{value}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Memory Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{memoryData.memoryStats.totalConversations}</div>
              <div className="text-sm text-gray-600">Conversations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{memoryData.memoryStats.totalQueries}</div>
              <div className="text-sm text-gray-600">DB Queries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{memoryData.memoryStats.totalTasks}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{memoryData.memoryStats.completedTasks}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory Contents */}
      <Tabs defaultValue="conversations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="queries" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Database Queries
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
              <CardDescription>
                Messages Zed remembers from your interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {memoryData.conversationHistory.length > 0 ? (
                  <div className="space-y-3">
                    {memoryData.conversationHistory.map((msg) => (
                      <div key={msg.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-sm font-medium mb-1">{msg.message}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No conversations in memory</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries">
          <Card>
            <CardHeader>
              <CardTitle>Database Query History</CardTitle>
              <CardDescription>
                Oracle queries Zed has processed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {memoryData.databaseQueries.length > 0 ? (
                  <div className="space-y-3">
                    {memoryData.databaseQueries.map((query) => (
                      <div key={query.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-sm font-medium mb-1">{query.query}</div>
                        {query.sqlQuery && (
                          <code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded block mt-1">
                            {query.sqlQuery}
                          </code>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(query.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No database queries in memory</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task Memory</CardTitle>
              <CardDescription>
                Tasks and notes Zed is tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {memoryData.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {memoryData.tasks.map((task) => (
                      <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium">{task.title}</div>
                          <Badge variant={task.completed ? "default" : "secondary"}>
                            {task.completed ? "Done" : "Pending"}
                          </Badge>
                        </div>
                        {task.description && (
                          <div className="text-sm text-gray-600 mb-1">{task.description}</div>
                        )}
                        <div className="text-xs text-gray-500">
                          {new Date(task.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No tasks in memory</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Memory Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Memory Management
          </CardTitle>
          <CardDescription>
            Actions to manage Zed's memory (editing will require restarting the system)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <p className="text-sm text-gray-600">
              To edit Zed's memory directly, you can:
            </p>
            <ul className="text-sm space-y-2 text-gray-600">
              <li>• Edit the <code>server/storage.ts</code> file</li>
              <li>• Modify the MemStorage class data structures</li>
              <li>• Clear specific memory types by restarting the server</li>
              <li>• Add memory clearing methods to the storage interface</li>
            </ul>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              className="w-full mt-4"
            >
              Refresh Memory View
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}