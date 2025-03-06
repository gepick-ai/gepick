module.exports = {
  apps: [
    {
      name: "gepick-server",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "800M",
    },
  ],

  deploy: {
    production: {
      "user": "ubuntu",
      "host": "54.249.57.188",
      "ref": "origin/main",
      "repo": "git@github.com:Gepick-Friends/Gepick.git",
      "path": "/home/ubuntu/gepick",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
};
