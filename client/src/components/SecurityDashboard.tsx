import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Search, 
  Refresh,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface SecurityVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  location: string;
  recommendation: string;
  cve?: string;
}

interface SecurityReport {
  timestamp: string;
  totalVulnerabilities: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  vulnerabilities: SecurityVulnerability[];
  systemHealth: {
    encryptionStatus: boolean;
    authenticationStrength: number;
    dataIntegrity: boolean;
    accessControls: boolean;
  };
}

interface SecurityStatus {
  securityLevel: 'high' | 'medium' | 'low';
  vulnerabilities: number;
  encrypted: boolean;
  lastScan: string;
  systemHealth: {
    encryptionStatus: boolean;
    authenticationStrength: number;
    dataIntegrity: boolean;
    accessControls: boolean;
  };
}

const SecurityDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);

  // Fetch security status
  const { data: securityStatus, isLoading: statusLoading } = useQuery<SecurityStatus>({
    queryKey: ['/api/security/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch full security report
  const { data: securityReport, isLoading: reportLoading } = useQuery<SecurityReport>({
    queryKey: ['/api/security/scan'],
    enabled: showDetails, // Only fetch when details are requested
  });

  // Run security scan mutation
  const scanMutation = useMutation({
    mutationFn: () => apiRequest('/api/security/scan'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/security/scan'] });
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive' as const;
      case 'high': return 'destructive' as const;
      case 'medium': return 'secondary' as const;
      case 'low': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (statusLoading) {
    return (
      <Card className="zebulon-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview Card */}
      <Card className="zebulon-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Security Status</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => scanMutation.mutate()}
                disabled={scanMutation.isPending}
              >
                {scanMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <Refresh className="h-4 w-4" />
                )}
                Scan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                Details
              </Button>
            </div>
          </div>
          <CardDescription>
            Real-time security monitoring and vulnerability assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getSecurityLevelColor(securityStatus?.securityLevel || 'low')}`}>
                {securityStatus?.securityLevel?.toUpperCase() || 'UNKNOWN'}
              </div>
              <div className="text-sm text-muted-foreground">Security Level</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {securityStatus?.vulnerabilities || 0}
              </div>
              <div className="text-sm text-muted-foreground">Vulnerabilities</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-1">
                {securityStatus?.encrypted ? (
                  <Lock className="h-6 w-6 text-green-500" />
                ) : (
                  <Unlock className="h-6 w-6 text-red-500" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">Encryption</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {securityStatus?.systemHealth?.authenticationStrength || 0}
              </div>
              <div className="text-sm text-muted-foreground">Auth Score</div>
            </div>
          </div>

          {/* System Health Indicators */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm font-medium">Data Encryption</span>
              {securityStatus?.systemHealth?.encryptionStatus ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm font-medium">Data Integrity</span>
              {securityStatus?.systemHealth?.dataIntegrity ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm font-medium">Access Controls</span>
              {securityStatus?.systemHealth?.accessControls ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm font-medium">Authentication</span>
              <div className="flex items-center space-x-2">
                <Progress 
                  value={securityStatus?.systemHealth?.authenticationStrength || 0} 
                  className="w-16 h-2" 
                />
                <span className="text-xs">
                  {securityStatus?.systemHealth?.authenticationStrength || 0}/10
                </span>
              </div>
            </div>
          </div>

          {securityStatus?.lastScan && (
            <div className="text-xs text-muted-foreground mt-4">
              Last scan: {new Date(securityStatus.lastScan).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Vulnerability Report */}
      {showDetails && (
        <Card className="zebulon-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Vulnerability Report</span>
            </CardTitle>
            <CardDescription>
              Comprehensive security vulnerability analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : securityReport ? (
              <Tabs defaultValue="summary" className="w-full">
                <TabsList>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-500">
                        {securityReport.critical}
                      </div>
                      <div className="text-sm text-muted-foreground">Critical</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-500">
                        {securityReport.high}
                      </div>
                      <div className="text-sm text-muted-foreground">High</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-500">
                        {securityReport.medium}
                      </div>
                      <div className="text-sm text-muted-foreground">Medium</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-500">
                        {securityReport.low}
                      </div>
                      <div className="text-sm text-muted-foreground">Low</div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="vulnerabilities">
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {securityReport.vulnerabilities.map((vuln) => (
                        <div key={vuln.id} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className={`h-4 w-4 ${getSeverityColor(vuln.severity)}`} />
                              <span className="font-medium">{vuln.id}</span>
                            </div>
                            <Badge variant={getSeverityBadgeVariant(vuln.severity)}>
                              {vuln.severity.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div>
                            <div className="font-medium">{vuln.category}</div>
                            <div className="text-sm text-muted-foreground">{vuln.description}</div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            Location: {vuln.location}
                          </div>
                          
                          <div className="text-xs">
                            <span className="font-medium">Recommendation: </span>
                            {vuln.recommendation}
                          </div>
                          
                          {vuln.cve && (
                            <div className="text-xs text-blue-600">
                              CVE: {vuln.cve}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center text-muted-foreground">
                No security report available. Click "Scan" to run a security assessment.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityDashboard;