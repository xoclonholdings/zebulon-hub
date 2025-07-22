import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { CalendarEvent } from "@/lib/types";

export default function CalendarWidget() {
  // Mock events - in a real app, this would come from an API
  const events: CalendarEvent[] = [
    { id: '1', title: 'Database Maintenance', time: '2 PM', color: 'bg-orange-500' },
    { id: '2', title: 'Team Standup', time: '10 AM', color: 'bg-green-500' },
    { id: '3', title: 'Performance Review', time: '3 PM', color: 'bg-blue-500' }
  ];

  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card className="widget-card bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Calendar</h3>
          <Calendar className="text-blue-600 w-5 h-5" />
        </div>
        
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-gray-900">{day}</div>
          <div className="text-sm text-gray-600">{month}</div>
        </div>
        
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${event.color}`} />
              <span className="text-gray-700 flex-1">{event.title}</span>
              <span className="text-gray-500">{event.time}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
