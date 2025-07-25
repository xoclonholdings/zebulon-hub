// PM2 Configuration for Zebulon Oracle System on xoclon.online

module.exports = {
  apps: [{
    name: 'zebulon-oracle',
    script: 'dist/server/index.js',
    cwd: '/path/to/your/zebulon-project', // Update this path
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Restart on crash
    min_uptime: '10s',
    max_restarts: 5,
    // Auto-restart settings
    restart_delay: 4000
  }]
};