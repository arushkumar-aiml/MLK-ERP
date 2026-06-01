const mongoose = require('mongoose');

const env = require('./env');

let isShutdownConfigured = false;

async function connectDatabase() {
  const uri = env.mongoUri;

  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  mongoose.set('strictQuery', true);
  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
    return connection;
  } catch (error) {
    console.error('MongoDB initial connection failed:', error.message);
    throw error;
  }
}

function setupGracefulShutdown(server) {
  if (isShutdownConfigured) {
    return;
  }

  isShutdownConfigured = true;

  async function shutdown(signal) {
    console.log(`${signal} received. Closing HTTP server and MongoDB connection.`);

    if (server) {
      server.close(() => {
        console.log('HTTP server closed');
      });
    }

    await mongoose.connection.close(false);
    console.log('MongoDB connection closed');
    process.exit(0);
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = { connectDatabase, setupGracefulShutdown };
