import { useState, useEffect } from 'react';
import { Upload, FolderTree, Users, Calendar, ArrowLeft, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface FamilyTree {
  id: string;
  filename: string;
  uploadedAt: string;
}

interface UploadResponse {
  success: boolean;
  id: string;
  filename: string;
  uploadedAt: string;
  summary: {
    individuals: number;
    families: number;
    sources: number;
  };
}

interface GenealogyModuleProps {
  onBack: () => void;
}

export default function GenealogyModule({ onBack }: GenealogyModuleProps) {
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedTree, setSelectedTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFamilyTrees();
  }, []);

  const fetchFamilyTrees = async () => {
    try {
      const response = await fetch('/api/gedcom/trees');
      if (response.ok) {
        const trees = await response.json();
        setFamilyTrees(trees);
      } else {
        toast({
          title: "Error",
          description: "Failed to load family trees",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching family trees:', error);
      toast({
        title: "Error",
        description: "Failed to load family trees",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.ged') && !file.name.toLowerCase().endsWith('.gedcom')) {
      toast({
        title: "Invalid File",
        description: "Please upload a GEDCOM (.ged) file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('gedcom', file);

    try {
      const response = await fetch('/api/gedcom/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result: UploadResponse = await response.json();
        toast({
          title: "Upload Successful",
          description: `${result.filename} uploaded with ${result.summary.individuals} individuals and ${result.summary.families} families`
        });
        fetchFamilyTrees();
      } else {
        const error = await response.json();
        toast({
          title: "Upload Failed",
          description: error.error || "Failed to upload GEDCOM file",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload GEDCOM file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const loadTreeData = async (treeId: string) => {
    try {
      const response = await fetch(`/api/gedcom/tree/${treeId}`);
      if (response.ok) {
        const tree = await response.json();
        setSelectedTree(tree);
      } else {
        toast({
          title: "Error",
          description: "Failed to load family tree data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading tree data:', error);
      toast({
        title: "Error",
        description: "Failed to load family tree data",
        variant: "destructive"
      });
    }
  };

  const deleteTree = async (treeId: string) => {
    if (!confirm('Are you sure you want to delete this family tree?')) return;

    try {
      const response = await fetch(`/api/gedcom/tree/${treeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Family tree deleted successfully"
        });
        fetchFamilyTrees();
        if (selectedTree?.id === treeId) {
          setSelectedTree(null);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to delete family tree",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete family tree",
        variant: "destructive"
      });
    }
  };

  const exportTree = (tree: any, format: 'json' | 'txt' = 'json') => {
    const data = format === 'json' ? JSON.stringify(tree.data, null, 2) : 
      `Family Tree: ${tree.filename}\nUploaded: ${tree.uploadedAt}\n\nData:\n${JSON.stringify(tree.data, null, 2)}`;
    
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tree.filename.replace('.ged', '')}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (selectedTree) {
    const individuals = selectedTree.data.filter((item: any) => item.tag === 'INDI');
    const families = selectedTree.data.filter((item: any) => item.tag === 'FAM');

    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setSelectedTree(null)}
                variant="outline" 
                size="sm"
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Trees
              </Button>
              <h1 className="text-3xl font-bold text-white">{selectedTree.filename}</h1>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => exportTree(selectedTree, 'json')}
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button 
                onClick={() => exportTree(selectedTree, 'txt')}
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export TXT
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-400" />
                  Individuals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{individuals.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center">
                  <FolderTree className="h-5 w-5 mr-2 text-green-400" />
                  Families
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{families.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                  Uploaded
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-400">
                  {new Date(selectedTree.uploadedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sample individuals display */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Sample Individuals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {individuals.slice(0, 10).map((individual: any, index: number) => {
                  const name = individual.data?.find((d: any) => d.tag === 'NAME')?.data || 'Unknown';
                  const birth = individual.data?.find((d: any) => d.tag === 'BIRT')?.data?.[0]?.data?.find((bd: any) => bd.tag === 'DATE')?.data || 'Unknown';
                  
                  return (
                    <div key={index} className="p-3 bg-gray-800 rounded border border-gray-700">
                      <div className="text-white font-medium">{name}</div>
                      <div className="text-gray-400 text-sm">Born: {birth}</div>
                      <div className="text-gray-500 text-xs">ID: {individual.data?.find((d: any) => d.tag === 'XREF')?.data || individual.pointer}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={onBack}
              variant="outline" 
              size="sm"
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-white">Legacy Archive</h1>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Upload className="h-5 w-5 mr-2 text-purple-400" />
              Upload GEDCOM File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-400">
                Upload a GEDCOM (.ged) file to import your family tree data. Supported formats include standard GEDCOM files from most genealogy software.
              </p>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept=".ged,.gedcom"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1 text-white bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
                {uploading && (
                  <div className="text-purple-400">Uploading...</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Family Trees List */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <FolderTree className="h-5 w-5 mr-2 text-green-400" />
              Your Family Trees
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-gray-400">Loading family trees...</div>
            ) : familyTrees.length === 0 ? (
              <div className="text-gray-400">No family trees uploaded yet. Upload a GEDCOM file to get started.</div>
            ) : (
              <div className="space-y-3">
                {familyTrees.map((tree) => (
                  <div key={tree.id} className="flex items-center justify-between p-4 bg-gray-800 rounded border border-gray-700">
                    <div className="flex-1">
                      <div className="text-white font-medium">{tree.filename}</div>
                      <div className="text-gray-400 text-sm">
                        Uploaded: {new Date(tree.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => loadTreeData(tree.id)}
                        variant="outline"
                        size="sm"
                        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      >
                        View
                      </Button>
                      <Button
                        onClick={() => deleteTree(tree.id)}
                        variant="outline"
                        size="sm"
                        className="bg-red-800 border-red-700 text-white hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}