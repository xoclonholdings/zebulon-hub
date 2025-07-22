import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, AlertTriangle, TrendingUp } from "lucide-react";
import { Recommendation } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

interface ZebulonLiteWidgetProps {
  userId: number;
}

export default function ZebulonLiteWidget({ userId }: ZebulonLiteWidgetProps) {
  const { data: recommendations, isLoading } = useQuery<{ tips: Recommendation[] }>({
    queryKey: ['/api/recommendations', userId],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const getRecommendationIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-300" />;
      case 'medium': return <TrendingUp className="w-4 h-4 text-yellow-300" />;
      default: return <Lightbulb className="w-4 h-4 text-orange-300" />;
    }
  };

  const mockRecommendations: Recommendation[] = [
    {
      title: "Oracle Performance Tip",
      description: "Consider indexing the USER_ACTIVITY table for faster queries",
      priority: "medium"
    },
    {
      title: "Security Alert",
      description: "Update recommended for database security patches",
      priority: "high"
    }
  ];

  const tips = recommendations?.tips || mockRecommendations;

  return (
    <Card className="widget-card bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm border border-orange-300 hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center space-x-2">
            <span>Recommends</span>
            <span className="text-lg">🤷‍♂️</span>
          </h3>
          <Lightbulb className="text-white w-5 h-5" />
        </div>
        
        <div className="space-y-3 text-white">
          {isLoading ? (
            <div className="space-y-3">
              <div className="animate-pulse">
                <div className="h-4 bg-white bg-opacity-20 rounded mb-1"></div>
                <div className="h-3 bg-white bg-opacity-10 rounded"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-4 bg-white bg-opacity-20 rounded mb-1"></div>
                <div className="h-3 bg-white bg-opacity-10 rounded"></div>
              </div>
            </div>
          ) : (
            tips.slice(0, 2).map((tip, index) => (
              <div key={index} className="text-sm">
                <div className="font-medium mb-1 flex items-center space-x-2">
                  {getRecommendationIcon(tip.priority)}
                  <span>{tip.title}</span>
                </div>
                <div className="text-orange-100 text-xs leading-relaxed">
                  {tip.description}
                </div>
              </div>
            ))
          )}
        </div>
        
        <Button
          className="mt-4 w-full bg-white bg-opacity-20 text-white py-2 px-4 rounded-lg text-sm hover:bg-opacity-30 transition-colors border-none shadow-none"
          disabled={isLoading}
        >
          View All Recommendations
        </Button>
      </CardContent>
    </Card>
  );
}
