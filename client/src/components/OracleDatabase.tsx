import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Lock, Unlock, Download, Edit, Trash2, Database, Shield, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OracleMemory {
  id: number;
  label: string;
  description: string;
  content: string;
  memoryType: 'workflow' | 'response' | 'repair' | 'security' | 'data-tag' | 'custom';
  status: 'active' | 'locked';
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

interface OracleDatabaseProps {
  onClose: () => void;
}

export default function OracleDatabase({ onClose }: OracleDatabaseProps) {
  const [memories, setMemories] = useState<OracleMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<OracleMemory | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newMemory, setNewMemory] = useState({
    label: '',
    description: '',
    content: '',
    memoryType: 'custom' as OracleMemory['memoryType']
  });

  const memoryTypes = [
    { value: 'workflow', label: 'Workflow', icon: <FileText className="w-4 h-4" /> },
    { value: 'response', label: 'Response', icon: <FileText className="w-4 h-4" /> },
    { value: 'repair', label: 'Repair', icon: <Shield className="w-4 h-4" /> },
    { value: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { value: 'data-tag', label: 'Data Tag', icon: <Database className="w-4 h-4" /> },
    { value: 'custom', label: 'Custom', icon: <FileText className="w-4 h-4" /> }
  ];

  const fetchMemories = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/oracle/memories?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMemories(data.memories || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch Oracle memories",
          variant: "destructive"
        });
      }
    } catch (error) {
      // Error fetching memories
      toast({
        title: "Error",
        description: "Failed to fetch Oracle memories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [searchTerm, statusFilter, typeFilter]);

  const handleStoreMemory = async () => {
    if (!newMemory.label || !newMemory.description || !newMemory.content) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/oracle/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemory)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Memory stored successfully"
        });
        setNewMemory({ label: '', description: '', content: '', memoryType: 'custom' });
        setIsStoreDialogOpen(false);
        fetchMemories();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to store memory",
          variant: "destructive"
        });
      }
    } catch (error) {
      // Error storing memory
      toast({
        title: "Error",
        description: "Failed to store memory",
        variant: "destructive"
      });
    }
  };

  const handleToggleLock = async (label: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    
    try {
      const response = await fetch('/api/oracle/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, status: newStatus })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Memory ${newStatus === 'locked' ? 'locked' : 'unlocked'} successfully`
        });
        fetchMemories();
      } else {
        toast({
          title: "Error",
          description: "Failed to update memory status",
          variant: "destructive"
        });
      }
    } catch (error) {
      // Error toggling lock
      toast({
        title: "Error",
        description: "Failed to update memory status",
        variant: "destructive"
      });
    }
  };

  const handleExport = async (label: string, format: 'json' | 'txt') => {
    try {
      const response = await fetch(`/api/oracle/export/${label}?format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${label}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Success",
          description: `Memory exported as ${format.toUpperCase()}`
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to export memory",
          variant: "destructive"
        });
      }
    } catch (error) {
      // Error exporting memory
      toast({
        title: "Error",
        description: "Failed to export memory",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    const typeObj = memoryTypes.find(t => t.value === type);
    return typeObj?.icon || <FileText className="w-4 h-4" />;
  };

  const filteredMemories = memories.filter(memory => {
    if (statusFilter !== 'all' && memory.status !== statusFilter) return false;
    if (typeFilter !== 'all' && memory.memoryType !== typeFilter) return false;
    if (searchTerm && !memory.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !memory.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-400 mb-2">Zebulon Oracle Database</h1>
            <p className="text-gray-400">Master memory hub for the Zebulon system</p>
          </div>
          <Button onClick={onClose} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
            Back to Dashboard
          </Button>
        </div>

        <Tabs defaultValue="memories" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-700">
            <TabsTrigger value="memories" className="data-[state=active]:bg-purple-600">Memory Bank</TabsTrigger>
            <TabsTrigger value="store" className="data-[state=active]:bg-purple-600">Store New</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="memories" className="space-y-6">
            {/* Controls */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-purple-400">Memory Control Panel</CardTitle>
                <CardDescription>Search, filter, and manage Oracle memories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search Memories</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search by label or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status Filter</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="locked">Locked Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Type Filter</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="all">All Types</SelectItem>
                        {memoryTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Memory Table */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-purple-400">Memory Bank ({filteredMemories.length} entries)</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Loading memories...</div>
                ) : filteredMemories.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No memories found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-purple-400">Label</TableHead>
                        <TableHead className="text-purple-400">Description</TableHead>
                        <TableHead className="text-purple-400">Type</TableHead>
                        <TableHead className="text-purple-400">Status</TableHead>
                        <TableHead className="text-purple-400">Last Modified</TableHead>
                        <TableHead className="text-purple-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMemories.map((memory) => (
                        <TableRow key={memory.id} className="border-gray-700 hover:bg-gray-800">
                          <TableCell className="font-medium text-white">{memory.label}</TableCell>
                          <TableCell className="text-gray-300 max-w-xs truncate">
                            {memory.description}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(memory.memoryType)}
                              <span className="text-gray-300 capitalize">{memory.memoryType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={memory.status === 'active' ? 'default' : 'secondary'}>
                              {memory.status === 'active' ? (
                                <Unlock className="w-3 h-3 mr-1" />
                              ) : (
                                <Lock className="w-3 h-3 mr-1" />
                              )}
                              {memory.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {new Date(memory.lastModified).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMemory(memory);
                                  setIsViewDialogOpen(true);
                                }}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleLock(memory.label, memory.status)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                              >
                                {memory.status === 'active' ? (
                                  <Lock className="w-4 h-4" />
                                ) : (
                                  <Unlock className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExport(memory.label, 'json')}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="store" className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-purple-400">Store New Memory</CardTitle>
                <CardDescription>Create a new memory entry in the Oracle Database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="label">Memory Label *</Label>
                    <Input
                      id="label"
                      placeholder="unique_memory_label"
                      value={newMemory.label}
                      onChange={(e) => setNewMemory(prev => ({ ...prev, label: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Memory Type *</Label>
                    <Select 
                      value={newMemory.memoryType} 
                      onValueChange={(value) => setNewMemory(prev => ({ ...prev, memoryType: value as OracleMemory['memoryType'] }))}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {memoryTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              {type.icon}
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of this memory..."
                    value={newMemory.description}
                    onChange={(e) => setNewMemory(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Memory Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter the memory content, logic, or data to store..."
                    value={newMemory.content}
                    onChange={(e) => setNewMemory(prev => ({ ...prev, content: e.target.value }))}
                    className="bg-gray-800 border-gray-600 text-white min-h-32"
                  />
                </div>
                
                <Button onClick={handleStoreMemory} className="w-full bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Store Memory
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-purple-400">Total Memories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{memories.length}</div>
                  <p className="text-gray-400">Stored memories</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-purple-400">Active Memories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-400">
                    {memories.filter(m => m.status === 'active').length}
                  </div>
                  <p className="text-gray-400">Unlocked entries</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-purple-400">Locked Memories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-400">
                    {memories.filter(m => m.status === 'locked').length}
                  </div>
                  <p className="text-gray-400">Protected entries</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* View Memory Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-purple-400">Memory Details: {selectedMemory?.label}</DialogTitle>
              <DialogDescription className="text-gray-400">
                View and export memory content
              </DialogDescription>
            </DialogHeader>
            {selectedMemory && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-purple-400">Type</Label>
                    <p className="text-white capitalize">{selectedMemory.memoryType}</p>
                  </div>
                  <div>
                    <Label className="text-purple-400">Status</Label>
                    <Badge variant={selectedMemory.status === 'active' ? 'default' : 'secondary'}>
                      {selectedMemory.status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-purple-400">Description</Label>
                  <p className="text-white">{selectedMemory.description}</p>
                </div>
                
                <div>
                  <Label className="text-purple-400">Content</Label>
                  <Textarea
                    value={selectedMemory.content}
                    readOnly
                    className="bg-gray-800 border-gray-600 text-white min-h-48"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleExport(selectedMemory.label, 'json')}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button
                    onClick={() => handleExport(selectedMemory.label, 'txt')}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export TXT
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}