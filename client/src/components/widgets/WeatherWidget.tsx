import { Card, CardContent } from "@/components/ui/card";
import { Sun, Cloud, CloudRain, CloudSnow } from "lucide-react";
import { WeatherData } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export default function WeatherWidget() {
  const { data: weather, isLoading } = useQuery<WeatherData>({
    queryKey: ['/api/weather'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('sun') || lower.includes('clear')) return <Sun className="text-yellow-500 text-xl w-6 h-6" />;
    if (lower.includes('rain')) return <CloudRain className="text-blue-500 text-xl w-6 h-6" />;
    if (lower.includes('snow')) return <CloudSnow className="text-blue-300 text-xl w-6 h-6" />;
    return <Cloud className="text-gray-500 text-xl w-6 h-6" />;
  };

  if (isLoading) {
    return (
      <Card className="widget-card bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 bg-gray-200 rounded w-16"></div>
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="widget-card bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Weather</h3>
          {weather && getWeatherIcon(weather.condition)}
        </div>
        
        {weather && (
          <>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">{weather.temperature}</div>
              <div className="text-sm text-gray-600">{weather.condition}</div>
              <div className="text-sm text-gray-600">{weather.location}</div>
            </div>
            
            <div className="mt-4 flex space-x-4 text-xs text-gray-500">
              <span>High: {weather.high}</span>
              <span>Low: {weather.low}</span>
              <span>Humidity: {weather.humidity}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
