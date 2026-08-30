import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { startCleanupWorker } from './utils/cleanupWorker.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const startServer = async () => {
  try {
    await connectDB();
    startCleanupWorker();

    const server = app.listen(PORT, () => {
      console.log(`
┌────────────────────────────────────────────────────────┐
│               ZUBYTE BACKEND REST API                  │
├────────────────────────────────────────────────────────┤
│  ⚡ Status:      ONLINE                                │
│  📡 Port:        ${PORT}                                  │
│  🌐 Endpoint:    http://localhost:${PORT}/api             │
│  ❤️  Health:      http://localhost:${PORT}/api/health      │
│  🚀 Environment: ${process.env.NODE_ENV || 'development'}                           │
└────────────────────────────────────────────────────────┘
      `);
    });

    // Graceful shutdown
    const handleShutdown = (signal) => {
      console.log(`[Process] ${signal} signal received. Closing HTTP server gracefully...`);
      server.close(() => {
        console.log('[Process] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error(`[Server Start Error] ${error.message}`);
    process.exit(1);
  }
};

startServer();
