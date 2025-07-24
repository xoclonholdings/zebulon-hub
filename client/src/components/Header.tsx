import { Link } from 'wouter';

export default function Header() {
  return (
    <header className="zebulon-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="url(#headerGradient)" />
                    <text x="12" y="16" textAnchor="middle" className="fill-white font-bold text-xs">Z</text>
                    <defs>
                      <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:'#3b82f6'}} />
                        <stop offset="100%" style={{stopColor:'#8b5cf6'}} />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold zebulon-text-gradient">
                  Zebulon Oracle AI
                </h1>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-xs sm:text-sm text-muted-foreground">
              AI Ecosystem • Oracle Management • Security Monitoring
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}