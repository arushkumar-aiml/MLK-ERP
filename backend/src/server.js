const app = require('./app');
const env = require('./config/env');
const { connectDatabase, setupGracefulShutdown } = require('./config/database');

const port = env.port;

async function startServer() {
  env.validateEnv();
  await connectDatabase();

  const server = app.listen(port, () => {
    console.log(`MLK ERP API running on port ${port} in ${env.nodeEnv} mode`);
  });

  setupGracefulShutdown(server);
}

startServer().catch((error) => {
  console.error('Failed to start API server:', error);
  process.exit(1);
});
