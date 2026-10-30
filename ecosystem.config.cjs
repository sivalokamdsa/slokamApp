// PM2 process definition used by the deploy workflow and by manual starts:
//   pm2 startOrRestart ecosystem.config.cjs --env production
module.exports = {
  apps: [
    {
      name: "slokam",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: { NODE_ENV: "production" },
      env_production: { NODE_ENV: "production" },
      max_restarts: 10,
    },
  ],
};
