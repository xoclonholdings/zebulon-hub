import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Images, ChevronLeft, ChevronRight } from "lucide-react";

export default function PhotoCarouselWidget() {
  // Mock photo URLs - in production these would come from user's photo library
  const photos = [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop",
    "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=200&fit=crop",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=200&fit=crop",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=200&fit=crop"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <Card className="widget-card bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Photos</h3>
          <Images className="text-orange-500 w-5 h-5" />
        </div>
        
        <div className="relative group">
          {/* Main photo */}
          <div className="relative overflow-hidden rounded-lg">
            <img
              src={photos[currentIndex]}
              alt={`Photo ${currentIndex + 1}`}
              className="w-full h-32 object-cover transition-opacity duration-300"
            />
            
            {/* Navigation arrows */}
            <Button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity p-0 border-none"
              size="icon"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity p-0 border-none"
              size="icon"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Navigation dots */}
          <div className="flex justify-center space-x-2 mt-3">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
