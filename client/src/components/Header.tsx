import { Link } from 'wouter';
import ZebulonLogo from './ZebulonLogo';

export default function Header() {
  return (
    <header className="zebulon-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                <ZebulonLogo size={32} className="hover:scale-110 transition-transform" />
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold zebulon-text-gradient">
                  Zebulon AI System
                </h1>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-xs sm:text-sm text-muted-foreground">
              AI Assistant • Local Processing • Chat Interface
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}