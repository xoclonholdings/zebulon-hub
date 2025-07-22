import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, SkipBack, SkipForward, Play, Pause } from "lucide-react";
import { MusicTrack } from "@/lib/types";

export default function MusicPlayerWidget() {
  const [track] = useState<MusicTrack>({
    title: "Focus Flow",
    artist: "Lo-Fi Beats",
    duration: "3:07",
    currentTime: "1:23",
    isPlaying: true,
    progress: 45
  });

  const [isPlaying, setIsPlaying] = useState(track.isPlaying);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <Card className="widget-card bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Music</h3>
          <Music className="text-orange-500 w-5 h-5" />
        </div>
        
        {/* Currently playing track */}
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg mx-auto mb-3 flex items-center justify-center">
            <Music className="w-8 h-8 text-white" />
          </div>
          <div className="text-sm font-medium text-gray-900">{track.title}</div>
          <div className="text-xs text-gray-600">{track.artist}</div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-blue-600 w-8 h-8"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={handlePlayPause}
            className="w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center justify-center"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-blue-600 w-8 h-8"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Progress bar */}
        <div>
          <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
            <div
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${track.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{track.currentTime}</span>
            <span>{track.duration}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
