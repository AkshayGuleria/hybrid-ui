import express from 'express';
import cors from 'cors';
import { PORT, CORS_ORIGINS, NODE_ENV } from './config.js';
import { connectRedis } from './services/session.js';
import authRoutes from './routes/auth.js';

const app = express();

// Middleware
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: CORS_ORIGINS,
  methods: ['GET', 'POST'],
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  // Connect to Redis
  const redisConnected = await connectRedis();
  if (!redisConnected) {
    console.error('Failed to connect to Redis. Make sure Redis is running.');
    console.error('You can start Redis with: docker run -d --name redis-auth -p 6379:6379 redis:7-alpine');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                   Auth Server Started                     ║
╠═══════════════════════════════════════════════════════════╣
║  Port:        ${PORT}                                     ║
║  Environment: ${NODE_ENV.padEnd(11)}                      ║
║  Redis:       Connected                                   ║
╠═══════════════════════════════════════════════════════════╣
║  Endpoints:                                               ║
║    POST /auth/login     - Login with username/password    ║
║    POST /auth/validate  - Validate session token          ║
║    POST /auth/logout    - Invalidate session              ║
║    POST /auth/refresh   - Refresh session TTL             ║
║    GET  /health         - Health check                    ║
╠═══════════════════════════════════════════════════════════╣
║  Test Users:                                              ║
║    admin / admin                                          ║
║    user  / user                                           ║
║    demo  / demo                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

start();
