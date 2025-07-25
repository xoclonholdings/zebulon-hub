import ZebulonSimple from "@/components/ZebulonSimple";

export default function Dashboard() {
  const systemStatus = {
    zedCore: {
      active: true,
      memory: 85,
      tasks: 12
    }
  };

  return (
    <ZebulonSimple 
      userId={1} 
      systemStatus={systemStatus}
    />
  );
}
