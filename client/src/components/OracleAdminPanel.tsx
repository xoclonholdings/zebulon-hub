import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Database, 
  Shield, 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Plus,
  Play,
  History,
  Lock,
  Server,
  BarChart3
} from 'lucide-react';

interface OracleConnection {
  id: number;
  connectionName: string;
  host: string;
  port: number;
  serviceName: string;
  username: string;
  isActive: boolean;
  lastTested: string;
  testResult: string;
}

interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  securityAnalysis: {
    riskLevel: string;
    securityFlags: string[];
    recommendations: string[];
    blocked: boolean;
    reason?: string;
  };
  executionTime: number;
}

interface DashboardMetrics {
  totalConnections: number;
  activeConnections: number;
  todayQueries: number;
  securityAlerts: number;
  performanceAlerts: number;
  recentActivity: any[];
}

interface OracleAdminPanelProps {
  userId: number;
}

export function OracleAdminPanel({ userId }: OracleAdminPanelProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [queryText, setQueryText] = useState('SELECT * FROM EMPLOYEES WHERE ROWNUM <= 10');
  const [newConnection, setNewConnection] = useState({
    connectionName: '',
    host: '',
    port: 1521,
    serviceName: '',
    username: '',
    password: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/oracle/dashboard', userId],
    queryFn: async () => {
      const res = await apiRequest(`/api/oracle/dashboard/${userId}`);
      return await res.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch connections
  const { data: connections, isLoading: connectionsLoading } = useQuery<OracleConnection[]>({
    queryKey: ['/api/oracle/connections', userId],
    queryFn: async () => {
      const res = await apiRequest(`/api/oracle/connections/${userId}`);
      return await res.json();
    }
  });

  // Fetch query history
  const { data: queryHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/oracle/history', userId],
    queryFn: async () => {
      const res = await apiRequest(`/api/oracle/history/${userId}?limit=20`);
      return await res.json();
    }
  });

  // Fetch security audits
  const { data: securityAudits } = useQuery({
    queryKey: ['/api/oracle/security-audits', userId],
    queryFn: async () => {
      const res = await apiRequest(`/api/oracle/security-audits/${userId}?limit=10`);
      return await res.json();
    }
  });

  // Create connection mutation
  const createConnectionMutation = useMutation({
    mutationFn: (connectionData: any) => 
      apiRequest('/api/oracle/connections', 'POST', {
        ...connectionData,
        userId
      }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/oracle/connections', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/oracle/dashboard', userId] });
      setNewConnection({
        connectionName: '',
        host: '',
        port: 1521,
        serviceName: '',
        username: '',
        password: ''
      });
      toast({
        title: "✓ Connection Created",
        description: "Oracle connection has been securely configured and tested.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to create Oracle connection.",
        variant: "destructive"
      });
    }
  });

  // Execute query mutation
  const executeQueryMutation = useMutation({
    mutationFn: (queryData: { connectionId: number; query: string; timeout?: number }) =>
      apiRequest('/api/oracle/execute', 'POST', {
        userId,
        ...queryData
      }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/oracle/history', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/oracle/security-audits', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/oracle/dashboard', userId] });
    }
  });

  const handleCreateConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConnection.connectionName || !newConnection.host || !newConnection.serviceName || !newConnection.username) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required connection details.",
        variant: "destructive"
      });
      return;
    }

    createConnectionMutation.mutate(newConnection);
  };

  const handleExecuteQuery = async () => {
    if (!selectedConnection || !queryText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a connection and enter a query.",
        variant: "destructive"
      });
      return;
    }

    const result = await executeQueryMutation.mutateAsync({
      connectionId: selectedConnection,
      query: queryText,
      timeout: 30000
    });

    const queryResult = await result.json() as QueryResult;
    
    if (queryResult.success) {
      toast({
        title: `✓ Query Executed (${queryResult.executionTime.toFixed(2)}s)`,
        description: `Returned ${queryResult.data?.length || 0} rows. Security: ${queryResult.securityAnalysis.riskLevel}`,
      });
    } else {
      toast({
        title: queryResult.securityAnalysis.blocked ? "🛡️ Query Blocked by Zeta Core" : "Query Failed",
        description: queryResult.error || "Unknown error occurred.",
        variant: "destructive"
      });
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="w-full h-full bg-black bg-opacity-20 rounded-lg p-4 text-white space-y-4">
      {/* Simple Header */}
      <div className="text-center border-b border-white border-opacity-10 pb-3">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Database className="h-5 w-5 text-blue-400" />
          <span className="font-semibold text-lg">Oracle Database</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <Badge className="bg-green-900 bg-opacity-30 text-green-400 border-green-500 border-opacity-30 text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Zeta Secured
          </Badge>
        </div>
      </div>

      {/* Simple Tab Navigation */}
      <div className="flex justify-center space-x-1">
        <Button
          variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('dashboard')}
          className="h-8 px-3 text-xs bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20"
        >
          <BarChart3 className="h-3 w-3 mr-1" />
          Status
        </Button>
        <Button
          variant={activeTab === 'connections' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('connections')}
          className="h-8 px-3 text-xs bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20"
        >
          <Server className="h-3 w-3 mr-1" />
          Connect
        </Button>
        <Button
          variant={activeTab === 'query' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('query')}
          className="h-8 px-3 text-xs bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20"
        >
          <Database className="h-3 w-3 mr-1" />
          Query
        </Button>
      </div>

      {/* Dashboard Content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {metricsLoading ? (
            <div className="text-center py-4 text-white text-opacity-75">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black bg-opacity-30 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Server className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium">Connections</span>
                </div>
                <div className="text-lg font-bold">{metrics?.totalConnections || 0}</div>
                <div className="text-xs text-green-400">{metrics?.activeConnections || 0} active</div>
              </div>

              <div className="bg-black bg-opacity-30 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Activity className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium">Queries</span>
                </div>
                <div className="text-lg font-bold">{metrics?.todayQueries || 0}</div>
                <div className="text-xs text-blue-400">Today</div>
              </div>

              <div className="bg-black bg-opacity-30 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium">Security</span>
                </div>
                <div className="text-lg font-bold text-green-400">Secure</div>
                <div className="text-xs text-green-400">Zeta Active</div>
              </div>

              <div className="bg-black bg-opacity-30 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <div className="text-lg font-bold text-green-400">Online</div>
                <div className="text-xs text-green-400">Optimal</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connections Content */}
      {activeTab === 'connections' && (
        <div className="space-y-4">
          <div className="bg-black bg-opacity-30 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-3">
              <Plus className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-sm">New Connection</span>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Connection Name"
                value={newConnection.connectionName}
                onChange={(e) => setNewConnection(prev => ({ ...prev, connectionName: e.target.value }))}
                className="bg-white bg-opacity-10 border-white border-opacity-20 text-white placeholder-white placeholder-opacity-60 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Host"
                  value={newConnection.host}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, host: e.target.value }))}
                  className="bg-white bg-opacity-10 border-white border-opacity-20 text-white placeholder-white placeholder-opacity-60 text-sm"
                />
                <Input
                  placeholder="1521"
                  type="number"
                  value={newConnection.port}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, port: parseInt(e.target.value) || 1521 }))}
                  className="bg-white bg-opacity-10 border-white border-opacity-20 text-white placeholder-white placeholder-opacity-60 text-sm"
                />
              </div>
              <Input
                placeholder="Username"
                value={newConnection.username}
                onChange={(e) => setNewConnection(prev => ({ ...prev, username: e.target.value }))}
                className="bg-white bg-opacity-10 border-white border-opacity-20 text-white placeholder-white placeholder-opacity-60 text-sm"
              />
              <Input
                placeholder="Password"
                type="password"
                value={newConnection.password}
                onChange={(e) => setNewConnection(prev => ({ ...prev, password: e.target.value }))}
                className="bg-white bg-opacity-10 border-white border-opacity-20 text-white placeholder-white placeholder-opacity-60 text-sm"
              />
              <Button 
                onClick={handleCreateConnection}
                disabled={createConnectionMutation.isPending}
                className="w-full bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 text-white text-sm"
              >
                <Plus className="h-3 w-3 mr-1" />
                Connect
              </Button>
            </div>
          </div>

          {/* Active Connections */}
          {connections && connections.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-white text-opacity-75">Active Connections</div>
              {connections.map((conn) => (
                <div key={conn.id} className="bg-black bg-opacity-30 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{conn.connectionName}</div>
                    <div className="text-xs text-white text-opacity-60">{conn.host}:{conn.port}</div>
                  </div>
                  <Badge className={conn.isActive ? 'bg-green-900 bg-opacity-30 text-green-400' : 'bg-red-900 bg-opacity-30 text-red-400'}>
                    {conn.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Query Content */}
      {activeTab === 'query' && (
        <div className="space-y-4">
          <div className="bg-black bg-opacity-30 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-3">
              <Database className="h-4 w-4 text-purple-400" />
              <span className="font-medium text-sm">SQL Query</span>
            </div>
            <div className="space-y-3">
              <Textarea
                placeholder="SELECT * FROM EMPLOYEES WHERE ROWNUM <= 10"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                className="bg-white bg-opacity-10 border-white border-opacity-20 text-white placeholder-white placeholder-opacity-60 text-sm h-20"
              />
              <div className="flex space-x-2">
                <Button 
                  onClick={handleExecuteQuery}
                  disabled={executeQueryMutation.isPending || !selectedConnection}
                  className="bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 text-white text-sm flex-1"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Execute
                </Button>
                {connections && connections.length > 0 && (
                  <select 
                    value={selectedConnection || ''}
                    onChange={(e) => setSelectedConnection(e.target.value ? Number(e.target.value) : null)}
                    className="bg-white bg-opacity-10 border border-white border-opacity-20 text-white text-sm rounded px-2 py-1"
                  >
                    <option value="">Select Connection</option>
                    {connections.map((conn) => (
                      <option key={conn.id} value={conn.id} className="bg-black text-white">
                        {conn.connectionName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}