module.exports = {
  apps: [{
    name: 'mysite',
    script: 'build/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8000,
      HOST: '0.0.0.0',
      ORIGIN: 'https://ddkira.ru'
    },
    node_args: '--max-old-space-size=1024',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
};