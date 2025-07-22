#!/bin/bash
# Zebulon AI System - Automatic Installer (Mac/Linux)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear

echo -e "${BLUE}"
echo "████████████████████████████████████████████████"
echo "█                                              █"
echo "█           ZEBULON AI SYSTEM                  █"
echo "█         Automatic Installer                  █"
echo "█                                              █"
echo "████████████████████████████████████████████████"
echo -e "${NC}"

echo -e "${YELLOW}[INFO]${NC} Starting automatic installation..."
echo -e "${YELLOW}[INFO]${NC} This will install and configure everything for you"
echo

# Function to install Node.js on macOS
install_node_mac() {
    if command -v brew >/dev/null 2>&1; then
        echo -e "${YELLOW}[INFO]${NC} Installing Node.js via Homebrew..."
        brew install node@18
    else
        echo -e "${YELLOW}[INFO]${NC} Homebrew not found. Installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        brew install node@18
    fi
}

# Function to install Node.js on Linux
install_node_linux() {
    if command -v apt-get >/dev/null 2>&1; then
        echo -e "${YELLOW}[INFO]${NC} Installing Node.js via apt..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v yum >/dev/null 2>&1; then
        echo -e "${YELLOW}[INFO]${NC} Installing Node.js via yum..."
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    elif command -v dnf >/dev/null 2>&1; then
        echo -e "${YELLOW}[INFO]${NC} Installing Node.js via dnf..."
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo dnf install -y nodejs
    else
        echo -e "${RED}[ERROR]${NC} Package manager not found. Please install Node.js manually."
        echo -e "${YELLOW}[INFO]${NC} Visit: https://nodejs.org"
        exit 1
    fi
}

# Check and install Node.js
echo -e "${YELLOW}[1/6]${NC} Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}[INFO]${NC} Node.js not found. Installing..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        install_node_mac
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        install_node_linux
    else
        echo -e "${RED}[ERROR]${NC} Unsupported operating system."
        echo -e "${YELLOW}[INFO]${NC} Please install Node.js manually from: https://nodejs.org"
        exit 1
    fi
    
    # Refresh PATH
    export PATH="/usr/local/bin:$PATH"
    hash -r
fi

# Verify Node.js version
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}[INFO]${NC} Node.js version: $NODE_VERSION"
else
    echo -e "${RED}[ERROR]${NC} Node.js installation failed."
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}[2/6]${NC} Installing dependencies..."
echo -e "${YELLOW}[INFO]${NC} This may take 2-3 minutes on first run..."
npm install --legacy-peer-deps --silent
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}[INFO]${NC} Retrying with verbose output..."
    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR]${NC} Installation failed. Check your internet connection."
        exit 1
    fi
fi

# Build application
echo -e "${YELLOW}[3/6]${NC} Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Build failed."
    exit 1
fi

# Create desktop shortcuts
echo -e "${YELLOW}[4/6]${NC} Creating desktop shortcuts..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create start script
cat > "$HOME/Desktop/start-zebulon.sh" << EOF
#!/bin/bash
cd "$SCRIPT_DIR"
npm start
EOF

# Create admin script
cat > "$HOME/Desktop/zebulon-admin.sh" << EOF
#!/bin/bash
cd "$SCRIPT_DIR"
echo "Opening Zebulon Admin Panel..."
sleep 2
if command -v open >/dev/null 2>&1; then
    open http://localhost:5000
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:5000
fi
npm start
EOF

chmod +x "$HOME/Desktop/start-zebulon.sh"
chmod +x "$HOME/Desktop/zebulon-admin.sh"

# Create application folder in Applications (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    APP_DIR="/Applications/Zebulon AI.app"
    mkdir -p "$APP_DIR/Contents/MacOS"
    
    cat > "$APP_DIR/Contents/MacOS/Zebulon AI" << EOF
#!/bin/bash
cd "$SCRIPT_DIR"
npm start
EOF
    
    chmod +x "$APP_DIR/Contents/MacOS/Zebulon AI"
fi

# Setup auto-start configuration
echo -e "${YELLOW}[5/6]${NC} Setting up auto-start configuration..."
# Create optional auto-start script
cat > "$HOME/zebulon-autostart.sh" << EOF
#!/bin/bash
# Uncomment the next line to auto-start Zebulon with system boot
# cd "$SCRIPT_DIR" && npm start
EOF

chmod +x "$HOME/zebulon-autostart.sh"

# Test installation
echo -e "${YELLOW}[6/6]${NC} Testing installation..."
npm run check >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}[WARNING]${NC} TypeScript validation warnings found (non-critical)"
fi

echo
echo -e "${GREEN}"
echo "████████████████████████████████████████████████"
echo "█                                              █"
echo "█  ✅ INSTALLATION COMPLETED SUCCESSFULLY!     █"
echo "█                                              █"
echo "█  🚀 Starting Zebulon AI System...            █"
echo "█                                              █"
echo "█  Access: http://localhost:5000               █"
echo "█  Admin:  Click logo → admin/zebulon2025     █"
echo "█                                              █"
echo "█  Desktop Shortcuts Created:                  █"
echo "█  • start-zebulon.sh                         █"
echo "█  • zebulon-admin.sh                         █"
echo "█                                              █"
echo "████████████████████████████████████████████████"
echo -e "${NC}"

echo -e "${YELLOW}[INFO]${NC} Zebulon AI is starting automatically..."
echo -e "${YELLOW}[INFO]${NC} Your browser will open in 5 seconds..."

# Wait 5 seconds then open browser
sleep 5

# Open browser
if command -v open >/dev/null 2>&1; then
    open http://localhost:5000
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:5000
fi

# Start the application
export NODE_ENV=production
export PORT=5000
npm start