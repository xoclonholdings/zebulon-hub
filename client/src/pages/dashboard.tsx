import { useState } from "react";
import ZebulonCommandCenter from "@/components/ZebulonCommandCenter";
import ApiTest from "@/components/ApiTest";

export default function Dashboard() {
  const mockSystemStatus = {
    oracle: {
      connected: true,
      activeConnections: 24,
      maxConnections: 100,
      responseTime: 12,
      memoryUsage: 68,
      uptime: "99.8%"
    },
    security: {
      level: 'high' as const,
      vulnerabilities: 0,
      encrypted: true
    },
    zedCore: {
      active: true,
      memory: 85,
      tasks: 12
    },
    zetaCore: {
      monitoring: true,
      threats: 0,
      alerts: 0
    },
    fantasmaFirewall: {
      active: true,
      blocked: 0,
      stealth: true
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="p-4">
        <ApiTest />
      </div>
      <ZebulonCommandCenter 
        userId={1} 
        systemStatus={mockSystemStatus}
      />
    </div>
  );
}
