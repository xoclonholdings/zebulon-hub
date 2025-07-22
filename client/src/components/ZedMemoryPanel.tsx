import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Brain, Search, Plus, Shield, BarChart3, Trash2, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MemoryEntry {
  id: number;
  memoryType: string;
  category: string;
  key: string;
  content: any;
  importance: number;
  confidence: number;
  source: string;
  contextTags: string[];
  createdAt: string;
  updatedAt: string;
  lastAccessed: string;
  accessCount: number;
}

interface MemoryStats {
  totalMemories: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  totalAccess: number;
  encrypted: boolean;
  securityLevel: string;
}

interface ZedMemoryPanelProps {
  userId: number;
}

export function ZedMemoryPanel({ userId }: ZedMemoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newMemory, setNewMemory] = useState({
    type: 'fact',
    category: 'general',
    content: '',
    importance: 5
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch memory statistics
  const { data: memoryStats } = useQuery<MemoryStats>({
    queryKey: ['/api/memory', userId, 'stats'],
    queryFn: () => apiRequest(`/api/memory/${userId}/stats`)
  });

  // Search memories
  const { data: memories, isLoading: searchingMemories } = useQuery<MemoryEntry[]>({
    queryKey: ['/api/memory', userId, 'search', searchQuery, selectedType, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedType) params.set('types', selectedType);
      if (selectedCategory) params.set('categories', selectedCategory);
      params.set('limit', '50');
      
      return apiRequest(`/api/memory/${userId}/search?${params.toString()}`);
    }
  });

  // Create memory mutation
  const createMemoryMutation = useMutation({
    mutationFn: (memoryData: any) => 
      apiRequest(`/api/memory/${userId}/remember`, {
        method: 'POST',
        body: JSON.stringify(memoryData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memory', userId] });
      setNewMemory({ type: 'fact', category: 'general', content: '', importance: 5 });
      toast({
        title: "Memory Encrypted & Stored",
        description: "Your memory has been securely encrypted and saved to Zebulon's core.",
      });
    },
    onError: () => {
      toast({
        title: "Memory Storage Failed",
        description: "Failed to encrypt and store memory. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateMemory = () => {
    if (!newMemory.content.trim()) return;
    
    const memoryData = {
      type: newMemory.type,
      content: {
        [newMemory.type]: newMemory.content,
        category: newMemory.category,
        timestamp: new Date().toISOString()
      },
      importance: newMemory.importance
    };
    
    createMemoryMutation.mutate(memoryData);
  };

  const formatMemoryContent = (content: any, type: string) => {
    if (typeof content === 'string') return content;
    if (content.error) return `[DECRYPTION ERROR: ${content.error}]`;
    
    switch (type) {
      case 'preference':
        return `${content.preference}: ${content.value}`;
      case 'fact':
        return content.fact || JSON.stringify(content);
      case 'skill':
        return `${content.skill} (${content.proficiency})`;
      default:
        return JSON.stringify(content, null, 2);
    }
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header with Security Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-orange-500" />
          <div>
            <h3 className="text-lg font-semibold text-white">Zed Memory Core</h3>
            <p className="text-sm text-gray-400">Encrypted AI memory management system</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-green-500 text-green-400">
            <Lock className="h-3 w-3 mr-1" />
            AES-256 Encrypted
          </Badge>
          <Badge variant="outline" className="border-orange-500 text-orange-400">
            <Shield className="h-3 w-3 mr-1" />
            Secure
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
          <TabsTrigger value="search" className="data-[state=active]:bg-orange-600">Search</TabsTrigger>
          <TabsTrigger value="create" className="data-[state=active]:bg-orange-600">Create</TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-orange-600">Stats</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-orange-600">Security</TabsTrigger>
        </TabsList>

        {/* Search Memories Tab */}
        <TabsContent value="search" className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Search encrypted memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="preference">Preferences</SelectItem>
                <SelectItem value="fact">Facts</SelectItem>
                <SelectItem value="skill">Skills</SelectItem>
                <SelectItem value="context">Context</SelectItem>
                <SelectItem value="relationship">Relationships</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {searchingMemories ? (
              <div className="text-center py-8 text-gray-400">
                <Brain className="h-8 w-8 animate-spin mx-auto mb-2" />
                Decrypting memories...
              </div>
            ) : memories && memories.length > 0 ? (
              memories.map((memory) => (
                <Card key={memory.id} className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {memory.memoryType}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {memory.category}
                        </Badge>
                        <div className="flex items-center text-xs text-gray-400">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          {memory.importance}/10
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Accessed {memory.accessCount} times
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-300">
                      {formatMemoryContent(memory.content, memory.memoryType)}
                    </div>
                    {memory.contextTags && memory.contextTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {memory.contextTags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Source: {memory.source} • Updated: {new Date(memory.updatedAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Search className="h-8 w-8 mx-auto mb-2" />
                No encrypted memories found
              </div>
            )}
          </div>
        </TabsContent>

        {/* Create Memory Tab */}
        <TabsContent value="create" className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Memory Type</label>
                <Select value={newMemory.type} onValueChange={(value) => setNewMemory({...newMemory, type: value})}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="fact">Fact</SelectItem>
                    <SelectItem value="preference">Preference</SelectItem>
                    <SelectItem value="skill">Skill</SelectItem>
                    <SelectItem value="context">Context</SelectItem>
                    <SelectItem value="relationship">Relationship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
                <Select value={newMemory.category} onValueChange={(value) => setNewMemory({...newMemory, category: value})}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Content</label>
              <Textarea
                placeholder="Enter memory content to be encrypted..."
                value={newMemory.content}
                onChange={(e) => setNewMemory({...newMemory, content: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-24"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Importance: {newMemory.importance}/10
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={newMemory.importance}
                onChange={(e) => setNewMemory({...newMemory, importance: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <Button
              onClick={handleCreateMemory}
              disabled={createMemoryMutation.isPending || !newMemory.content.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createMemoryMutation.isPending ? 'Encrypting & Storing...' : 'Create Encrypted Memory'}
            </Button>
          </div>
        </TabsContent>

        {/* Memory Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          {memoryStats ? (
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-300">Total Memories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">{memoryStats.totalMemories}</div>
                  <div className="text-xs text-gray-500">Encrypted entries</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-300">Total Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">{memoryStats.totalAccess}</div>
                  <div className="text-xs text-gray-500">Memory retrievals</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-300">Memory Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(memoryStats.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">{type}</Badge>
                        <span className="text-orange-500 font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <BarChart3 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading encrypted statistics...
            </div>
          )}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Encryption Status
                </CardTitle>
                <CardDescription>
                  All memory data is protected with military-grade encryption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Algorithm</span>
                  <span className="text-orange-500 font-mono">AES-256-CTR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Key Derivation</span>
                  <span className="text-orange-500 font-mono">PBKDF2-SHA256</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Iterations</span>
                  <span className="text-orange-500 font-mono">100,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Status</span>
                  <Badge className="bg-green-600 text-white">
                    <Lock className="h-3 w-3 mr-1" />
                    Fully Encrypted
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-blue-400">Data Protection</CardTitle>
                <CardDescription>
                  Comprehensive security measures active
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Content Encryption</span>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Integrity Verification</span>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Access Logging</span>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Tag Encryption</span>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}