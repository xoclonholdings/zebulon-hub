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
    <div className="w-full h-full p-6 bg-black text-white space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Oracle Administration
            </h2>
            <p className="text-gray-400">Secured by Zeta Core • Enterprise Database Management</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-green-900/30 text-green-400 border-green-500/30">
            <Shield className="w-3 h-3 mr-1" />
            Zeta Protected
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-900 border-gray-700">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="connections" className="data-[state=active]:bg-purple-600">
            <Server className="w-4 h-4 mr-2" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="query" className="data-[state=active]:bg-purple-600">
            <Database className="w-4 h-4 mr-2" />
            Query Editor
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-purple-600">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-purple-600">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {metricsLoading ? (
            <div className="text-center py-8">Loading dashboard metrics...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Connections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{metrics?.totalConnections || 0}</div>
                  <div className="text-xs text-green-400">
                    {metrics?.activeConnections || 0} active
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Today's Queries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{metrics?.todayQueries || 0}</div>
                  <div className="text-xs text-blue-400">
                    <Activity className="w-3 h-3 inline mr-1" />
                    Active monitoring
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Security Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">{metrics?.securityAlerts || 0}</div>
                  <div className="text-xs text-red-400">
                    <Shield className="w-3 h-3 inline mr-1" />
                    Zeta monitored
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">Optimal</div>
                  <div className="text-xs text-green-400">
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    All systems normal
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {metrics?.recentActivity && metrics.recentActivity.length > 0 && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription>Latest Oracle database operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Database className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="text-sm text-white font-medium">
                          {activity.queryText?.substring(0, 50)}...
                        </div>
                        <div className="text-xs text-gray-400">
                          {activity.executionTime?.toFixed(2)}s • {activity.status}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`${getRiskColor(activity.securityRisk)} border-current`}
                    >
                      {activity.securityRisk}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Create Connection</CardTitle>
                <CardDescription>Add a new Oracle database connection</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateConnection} className="space-y-4">
                  <div>
                    <Label htmlFor="connectionName">Connection Name</Label>
                    <Input
                      id="connectionName"
                      value={newConnection.connectionName}
                      onChange={(e) => setNewConnection(prev => ({ ...prev, connectionName: e.target.value }))}
                      placeholder="Production DB"
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="host">Host</Label>
                      <Input
                        id="host"
                        value={newConnection.host}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="localhost"
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        type="number"
                        value={newConnection.port}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, port: parseInt(e.target.value) || 1521 }))}
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="serviceName">Service Name</Label>
                    <Input
                      id="serviceName"
                      value={newConnection.serviceName}
                      onChange={(e) => setNewConnection(prev => ({ ...prev, serviceName: e.target.value }))}
                      placeholder="ORCL"
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newConnection.username}
                      onChange={(e) => setNewConnection(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="oracle_user"
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newConnection.password}
                      onChange={(e) => setNewConnection(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    disabled={createConnectionMutation.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createConnectionMutation.isPending ? 'Creating...' : 'Create Connection'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Active Connections</CardTitle>
                <CardDescription>Manage your Oracle database connections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {connectionsLoading ? (
                  <div className="text-center py-4">Loading connections...</div>
                ) : connections && connections.length > 0 ? (
                  connections.map((conn) => (
                    <div 
                      key={conn.id} 
                      className={`p-4 bg-gray-800 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedConnection === conn.id 
                          ? 'border-purple-500 bg-purple-900/20' 
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => setSelectedConnection(conn.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{conn.connectionName}</div>
                          <div className="text-sm text-gray-400">
                            {conn.host}:{conn.port}/{conn.serviceName}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {conn.testResult === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )}
                          <Badge variant={conn.isActive ? "default" : "secondary"}>
                            {conn.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No connections configured. Create your first connection to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="query" className="space-y-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">SQL Query Editor</CardTitle>
              <CardDescription>Execute SQL queries with Zeta Core security monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="queryEditor">SQL Query</Label>
                <Textarea
                  id="queryEditor"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Enter your SQL query here..."
                  className="bg-gray-800 border-gray-600 font-mono text-sm h-32"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <Label htmlFor="connectionSelect">Connection</Label>
                    <select
                      id="connectionSelect"
                      value={selectedConnection || ''}
                      onChange={(e) => setSelectedConnection(parseInt(e.target.value))}
                      className="bg-gray-800 border-gray-600 text-white rounded px-3 py-2"
                    >
                      <option value="">Select connection...</option>
                      {connections?.map(conn => (
                        <option key={conn.id} value={conn.id}>
                          {conn.connectionName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button 
                  onClick={handleExecuteQuery}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  disabled={executeQueryMutation.isPending || !selectedConnection}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {executeQueryMutation.isPending ? 'Executing...' : 'Execute Query'}
                </Button>
              </div>
              
              {!selectedConnection && (
                <Alert className="bg-yellow-900/30 border-yellow-500/30">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>No Connection Selected</AlertTitle>
                  <AlertDescription>
                    Please select an active Oracle connection before executing queries.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Query History</CardTitle>
              <CardDescription>Recent SQL query executions and their results</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8">Loading query history...</div>
              ) : queryHistory && queryHistory.length > 0 ? (
                <div className="space-y-3">
                  {queryHistory.map((query: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-mono text-sm text-gray-300 mb-2">
                            {query.queryText}
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span><Clock className="w-3 h-3 inline mr-1" />{query.executionTime?.toFixed(2)}s</span>
                            <span>{query.rowsAffected || 0} rows</span>
                            <span>{new Date(query.executedAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="secondary" 
                            className={query.status === 'success' ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'}
                          >
                            {query.status}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className={`${getRiskColor(query.securityRisk)} border-current`}
                          >
                            {query.securityRisk}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No query history available. Execute your first query to see history.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Security Audits</CardTitle>
              <CardDescription>Zeta Core security monitoring and threat analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {securityAudits && securityAudits.length > 0 ? (
                <div className="space-y-3">
                  {securityAudits.map((audit: any, index: number) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      audit.blocked ? 'bg-red-900/30 border-red-500' : 
                      audit.riskLevel === 'high' ? 'bg-orange-900/30 border-orange-500' : 
                      audit.riskLevel === 'medium' ? 'bg-yellow-900/30 border-yellow-500' : 
                      'bg-green-900/30 border-green-500'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-white mb-1">
                            {audit.operation} - {audit.auditType.toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-400 mb-2">
                            User: {audit.oracleUser} • {new Date(audit.timestamp).toLocaleString()}
                          </div>
                          {audit.objectName && (
                            <div className="text-xs text-gray-500">
                              Object: {audit.objectName}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {audit.blocked && (
                            <Badge variant="destructive" className="bg-red-600">
                              <Lock className="w-3 h-3 mr-1" />
                              Blocked
                            </Badge>
                          )}
                          <Badge 
                            variant="secondary" 
                            className={`${getRiskColor(audit.riskLevel)} border-current`}
                          >
                            {audit.riskLevel}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <div className="text-lg font-medium text-green-400 mb-2">All Clear</div>
                  <div>No security incidents detected. Zeta Core is actively monitoring all database operations.</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}