import { Link } from 'wouter';
import ZebulonLogo from '@assets/B0D5FD57-DDBC-4F91-9877-81CD04F42684_1753150322908.png';

export default function Header() {
  return (
    <header className="zebulon-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                <img 
                  src={ZebulonLogo} 
                  alt="Zebulon™ Logo" 
                  className="h-8 w-8"
                />
                <h1 className="text-2xl font-bold zebulon-text-gradient">
                  Zebulon™ Oracle AI
                </h1>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              AI Ecosystem • Oracle Management • Security Monitoring
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}