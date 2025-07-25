import { useQuery } from "@tanstack/react-query";

interface HealthResponse {
  status: string;
  message: string;
}

interface StatusEntry {
  id: number;
  component: string;
  status: string;
  lastChecked: string;
  details: string;
}

export default function ApiTest() {
  const { data: healthData, isLoading: healthLoading, error: healthError } = useQuery<HealthResponse>({
    queryKey: ["/api/health"],
  });

  const { data: statusData, isLoading: statusLoading, error: statusError } = useQuery<StatusEntry[]>({
    queryKey: ["/api/system/status"],
  });

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg">
      <h3 className="text-lg font-bold mb-4">🔗 API Connection Test</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold">Health Check:</h4>
          {healthLoading && <p className="text-yellow-400">Loading...</p>}
          {healthError && <p className="text-red-400">Error: {String(healthError)}</p>}
          {healthData && (
            <div className="text-green-400">
              ✅ {healthData.status} - {healthData.message}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-semibold">System Status:</h4>
          {statusLoading && <p className="text-yellow-400">Loading...</p>}
          {statusError && <p className="text-red-400">Error: {String(statusError)}</p>}
          {statusData && (
            <div className="text-green-400">
              ✅ Connected - {statusData.length} active components
            </div>
          )}
        </div>
      </div>
    </div>
  );
}