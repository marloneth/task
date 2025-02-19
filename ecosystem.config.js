module.exports = {
  apps: [
    {
      name: "FileWatcherWindows",
      script: "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js",
      args: "start",
      exec_mode: "cluster",
      instances: 1,
      interpreter: "none",
    },
  ],
};
