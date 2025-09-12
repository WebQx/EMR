{
  "apps": [
    {
      "name": "webqx-main",
      "script": "start-webqx-server.js",
      "cwd": "/workspaces/webqx",
      "instances": 1,
      "exec_mode": "fork",
      "env": {
        "NODE_ENV": "production",
        "MAIN_PORT": 3000,
        "DJANGO_PORT": 3001,
        "OPENEMR_PORT": 3002,
        "TELEHEALTH_PORT": 3003
      },
      "env_production": {
        "NODE_ENV": "production"
      },
      "log_file": "/var/log/webqx/combined.log",
      "out_file": "/var/log/webqx/out.log",
      "error_file": "/var/log/webqx/error.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true,
      "restart_delay": 4000,
      "max_restarts": 10,
      "min_uptime": "10s",
      "watch": false,
      "ignore_watch": [
        "node_modules",
        "logs",
        "uploads"
      ],
      "max_memory_restart": "1G",
      "source_map_support": true,
      "instance_var": "INSTANCE_ID"
    }
  ],
  "deploy": {
    "production": {
      "user": "webqx",
      "host": "your-server-ip",
      "ref": "origin/main",
      "repo": "https://github.com/WebQx/webqx.git",
      "path": "/var/www/webqx",
      "post-deploy": "npm install --production && pm2 reload ecosystem.config.js --env production"
    }
  }
}