// Rate Limiter Middleware for Crypto Suite API
// Protects against DDoS and brute force attacks

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

// Redis client for distributed rate limiting
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
  }
});

// Strict limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: {
    error: 'Too many authentication attempts',
    message: 'Account temporarily locked. Please try again in 1 hour.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),
  skipSuccessfulRequests: true
});

// Transaction rate limiter (per wallet)
const transactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 transactions per minute
  message: {
    error: 'Transaction rate limit exceeded',
    message: 'Too many transactions. Please wait before submitting more.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),
  keyGenerator: (req) => {
    return req.body?.walletAddress || req.headers['x-wallet-address'] || req.ip;
  }
});

// API key rate limiter (higher limits for authenticated apps)
const apiKeyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute for API keys
  message: {
    error: 'API rate limit exceeded',
    message: 'Your API key has exceeded its rate limit.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),
  keyGenerator: (req) => {
    return req.headers['x-api-key'] || 'anonymous';
  },
  skip: (req) => !req.headers['x-api-key']
});

// Webhook rate limiter
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 webhook calls per minute
  message: {
    error: 'Webhook rate limit exceeded',
    message: 'Too many webhook requests.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  })
});

// Dynamic rate limiter based on user tier
const createTieredLimiter = (tier) => {
  const limits = {
    free: { windowMs: 60 * 1000, max: 20 },
    basic: { windowMs: 60 * 1000, max: 100 },
    pro: { windowMs: 60 * 1000, max: 500 },
    enterprise: { windowMs: 60 * 1000, max: 2000 }
  };

  const config = limits[tier] || limits.free;

  return rateLimit({
    ...config,
    message: {
      error: 'Rate limit exceeded',
      message: `Your ${tier} tier limit has been exceeded.`,
      retryAfter: config.windowMs / 1000,
      upgradeUrl: '/pricing'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args)
    })
  });
};

// Middleware to apply tiered rate limiting
const tieredRateLimiter = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    let tier = 'free';

    if (apiKey) {
      // Look up user tier from database/cache
      const userTier = await redis.get(`tier:${apiKey}`);
      tier = userTier || 'free';
    }

    const limiter = createTieredLimiter(tier);
    return limiter(req, res, next);
  } catch (error) {
    console.error('Rate limiter error:', error);
    next(); // Fail open to avoid blocking legitimate requests
  }
};

// IP-based blocking for suspicious activity
const suspiciousActivityTracker = async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.ip;
  const key = `suspicious:${ip}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 3600); // 1 hour window
    }

    if (count > 100) {
      // Block IP after 100 suspicious requests
      await redis.setex(`blocked:${ip}`, 86400, 'true'); // Block for 24 hours
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP has been temporarily blocked due to suspicious activity.'
      });
    }

    next();
  } catch (error) {
    console.error('Suspicious activity tracker error:', error);
    next();
  }
};

// Check if IP is blocked
const checkBlockedIP = async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.ip;

  try {
    const isBlocked = await redis.get(`blocked:${ip}`);
    if (isBlocked) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP is temporarily blocked. Contact support if you believe this is an error.'
      });
    }
    next();
  } catch (error) {
    console.error('Block check error:', error);
    next();
  }
};

module.exports = {
  generalLimiter,
  authLimiter,
  transactionLimiter,
  apiKeyLimiter,
  webhookLimiter,
  tieredRateLimiter,
  suspiciousActivityTracker,
  checkBlockedIP,
  redis
};
