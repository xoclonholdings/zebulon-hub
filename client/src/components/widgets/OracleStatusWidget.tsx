import { Card, CardContent } from "@/components/ui/card";
import { Database } from "lucide-react";
import { OracleStatus } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export default function OracleStatusWidget() {
  const { data: status, isLoading } = useQuery<OracleStatus>({
    queryKey: ['/api/oracle/status'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <Card className="widget-card bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-3 w-3 bg-gray-200 rounded-full"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="widget-card bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 oracle-glow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Oracle Status</span>
          </h3>
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            status?.connected ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
        
        {status && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Database</span>
              <span className={`font-medium ${
                status.connected ? 'text-green-600' : 'text-red-600'
              }`}>
                {status.connected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Connections</span>
              <span className="font-medium">
                {status.activeConnections}/{status.maxConnections}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Response Time</span>
              <span className="font-medium">{status.responseTime}ms</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Memory Usage</span>
              <span className="font-medium">{status.memoryUsage}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
