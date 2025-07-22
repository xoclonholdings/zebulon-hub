import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  Eye,
  Lock,
  RefreshCw,
  Activity
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface SecurityVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  recommendation: string;
  cwe_id?: string;
  affected_components: string[];
  risk_score: number;
  detected_at: string;
}

interface SecurityScanResult {
  scan_id: string;
  started_at: string;
  completed_at: string;
  total_vulnerabilities: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  overall_risk_score: number;
  vulnerabilities: SecurityVulnerability[];
  recommendations: string[];
}

interface SecurityDashboardData {
  securityLevel: string;
  lastScanDate: string | null;
  vulnerabilityCount: number;
  criticalIssues: number;
  highPriorityIssues: number;
  riskScore: number;
  securityFeatures: {
    rateLimiting: boolean;
    securityHeaders: boolean;
    inputValidation: boolean;
    passwordPolicy: boolean;
    sessionSecurity: boolean;
  };
  recommendations: string[];
}

const SecurityDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<SecurityDashboardData | null>(null);
  const [scanResult, setScanResult] = useState<SecurityScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    loadLastScan();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/security/dashboard');
      if (!response.ok) {
        throw new Error('Dashboard API failed');
      }
      const data = await response.json();
      setDashboard(data.dashboard);
    } catch (error) {
      console.error('Failed to load security dashboard:', error);
      toast({
        title: "Security Dashboard Error", 
        description: "Failed to load security dashboard",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadLastScan = async () => {
    try {
      const response = await fetch('/api/security/scan/latest');
      if (response.ok) {
        const data = await response.json();
        setScanResult(data.scan);
      }
    } catch (error) {
      // No previous scan results
      console.log('No previous scan results found');
    }
  };

  const performSecurityScan = async () => {
    setIsScanning(true);
    try {
      toast({
        title: "Security Scan Started",
        description: "Performing comprehensive security vulnerability assessment...",
      });

      const response = await fetch('/api/security/scan', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Security scan failed');
      }
      const data = await response.json();
      
      setScanResult(data.scan);
      await loadDashboard(); // Refresh dashboard data
      
      toast({
        title: "Security Scan Complete",
        description: `Found ${data.scan.total_vulnerabilities} vulnerabilities`,
        variant: data.scan.critical_count > 0 ? "destructive" : "default",
      });
    } catch (error) {
      console.error('Security scan failed:', error);
      toast({
        title: "Security Scan Failed",
        description: "Failed to perform security scan",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const enableEmergencyMode = async () => {
    try {
      const response = await fetch('/api/security/emergency', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Emergency mode activation failed');
      }
      
      toast({
        title: "Emergency Security Mode",
        description: "Maximum security protocols activated",
        variant: "destructive",
      });
      
      await loadDashboard();
    } catch (error) {
      toast({
        title: "Emergency Mode Failed",
        description: "Failed to activate emergency security mode",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 8) return 'text-red-400';
    if (score >= 6) return 'text-orange-400';
    if (score >= 4) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card className="bg-black/50 border-primary/30">
        <CardHeader>
          <CardTitle className="text-primary flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Overview</span>
            {dashboard?.securityLevel === 'enhanced' && (
              <Badge className="bg-green-500/20 text-green-300">Enhanced</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{dashboard?.criticalIssues || 0}</div>
              <div className="text-sm text-gray-400">Critical Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{dashboard?.highPriorityIssues || 0}</div>
              <div className="text-sm text-gray-400">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{dashboard?.vulnerabilityCount || 0}</div>
              <div className="text-sm text-gray-400">Total Vulnerabilities</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getRiskScoreColor(dashboard?.riskScore || 0)}`}>
                {dashboard?.riskScore?.toFixed(1) || '0.0'}
              </div>
              <div className="text-sm text-gray-400">Risk Score</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Overall Security Level</span>
              <Progress 
                value={dashboard?.riskScore ? Math.max(0, 100 - (dashboard.riskScore * 10)) : 100} 
                className="w-32" 
              />
            </div>
            
            {dashboard?.lastScanDate && (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Last scan: {new Date(dashboard.lastScanDate).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Features Status */}
      <Card className="bg-black/50 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-blue-400 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Security Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dashboard?.securityFeatures && Object.entries(dashboard.securityFeatures).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center justify-between">
                <span className="capitalize text-white">
                  {feature.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <Badge variant={enabled ? "default" : "destructive"}>
                  {enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scan Controls */}
      <Card className="bg-black/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-purple-400 flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Security Assessment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-3">
            <Button 
              onClick={performSecurityScan}
              disabled={isScanning}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Run Security Scan
                </>
              )}
            </Button>
            
            <Button 
              onClick={enableEmergencyMode}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Emergency Mode
            </Button>
          </div>

          {scanResult && (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>
                Last scan completed on {new Date(scanResult.completed_at).toLocaleString()}
                {scanResult.critical_count > 0 && (
                  <span className="text-red-400 font-bold">
                    {" "}• {scanResult.critical_count} critical issues found
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Vulnerability Details */}
      {scanResult && scanResult.vulnerabilities.length > 0 && (
        <Card className="bg-black/50 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Security Vulnerabilities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full">
              <div className="space-y-3">
                {scanResult.vulnerabilities.map((vuln) => (
                  <div key={vuln.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getSeverityColor(vuln.severity)}>
                            {vuln.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium text-white">{vuln.title}</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{vuln.description}</p>
                        <div className="text-xs text-blue-400">
                          Components: {vuln.affected_components.join(', ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${getRiskScoreColor(vuln.risk_score)}`}>
                          {vuln.risk_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">Risk Score</div>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded p-2 text-xs text-gray-300">
                      <strong>Recommendation:</strong> {vuln.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Security Recommendations */}
      {dashboard?.recommendations && dashboard.recommendations.length > 0 && (
        <Card className="bg-black/50 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Security Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityDashboard;