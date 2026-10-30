// PM2 process definition. Used by scripts/deploy.sh on the server:
//   pm2 startOrRestart ecosystem.config.cjs --only slokam --env production
// The app name and port come from the environment, defaulting to slokam / 3000.
module.exports = {
  apps: [
    {
      name: process.env.APP_NAME || "slokam",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: `start -p ${process.env.APP_PORT || 3000}`,
      env: { NODE_ENV: "production" },
      max_restarts: 10,
    },
  ],
};
