import Redis from 'ioredis';
import { CacheConfig, CacheStats } from '@/types/services';

interface RedisConfig {
  url: string;
  password?: string;
  db?: number;
  prefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
}

class RedisClient {
  private client: Redis | null = null;
  private config: RedisConfig;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 5;

  constructor() {
    this.config = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      prefix: process.env.REDIS_PREFIX || 'lifelens:',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    };
  }

  async connect(): Promise<void> {
    if (this.isConnected || this.client) {
      return;
    }

    try {
      this.client = new Redis(this.config.url, {
        password: this.config.password,
        db: this.config.db,
        keyPrefix: this.config.prefix,
        retryDelayOnFailover: this.config.retryDelayOnFailover,
        maxRetriesPerRequest: this.config.maxRetriesPerRequest,
        lazyConnect: this.config.lazyConnect,
        connectTimeout: 5000,
        commandTimeout: 3000,
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
        this.connectionAttempts = 0;
      });

      this.client.on('error', (error) => {
        console.error('Redis connection error:', error);
        this.isConnected = false;
        this.handleConnectionError();
      });

      this.client.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('Redis reconnecting...');
        this.connectionAttempts++;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.handleConnectionError();
      throw error;
    }
  }

  private handleConnectionError(): void {
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.error(`Max Redis connection attempts (${this.maxConnectionAttempts}) reached`);
      this.client = null;
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  getClient(): Redis | null {
    return this.client;
  }

  // Cache operations with error handling
  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady()) {
      console.warn('Redis not connected, returning null for key:', key);
      return null;
    }

    try {
      const value = await this.client!.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('Redis not connected, skipping SET for key:', key);
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client!.setex(key, ttlSeconds, serialized);
      } else {
        await this.client!.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('Redis not connected, skipping DEL for key:', key);
      return false;
    }

    try {
      const result = await this.client!.del(key);
      return result > 0;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.client!.exists(key);
      return result > 0;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.client!.expire(key, ttlSeconds);
      return result > 0;
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isReady()) {
      return [];
    }

    try {
      return await this.client!.keys(pattern);
    } catch (error) {
      console.error('Redis KEYS error:', error);
      return [];
    }
  }

  async flushPattern(pattern: string): Promise<number> {
    if (!this.isReady()) {
      return 0;
    }

    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      return await this.client!.del(...keys);
    } catch (error) {
      console.error('Redis FLUSH_PATTERN error:', error);
      return 0;
    }
  }

  // Hash operations
  async hset(key: string, field: string, value: any): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.client!.hset(key, field, JSON.stringify(value));
      return result > 0;
    } catch (error) {
      console.error('Redis HSET error:', error);
      return false;
    }
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      const value = await this.client!.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis HGET error:', error);
      return null;
    }
  }

  async hdel(key: string, field: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.client!.hdel(key, field);
      return result > 0;
    } catch (error) {
      console.error('Redis HDEL error:', error);
      return false;
    }
  }

  // Stats and monitoring
  async getStats(): Promise<CacheStats | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      const info = await this.client!.info('stats');
      const lines = info.split('\r\n');
      const stats: any = {};

      lines.forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = isNaN(Number(value)) ? value : Number(value);
        }
      });

      const dbinfo = await this.client!.info('keyspace');
      const dbSize = dbinfo.match(/keys=(\d+)/);
      const totalKeys = dbSize ? parseInt(dbSize[1], 10) : 0;

      return {
        hits: stats.keyspace_hits || 0,
        misses: stats.keyspace_misses || 0,
        hit_rate: stats.keyspace_hits / (stats.keyspace_hits + stats.keyspace_misses) || 0,
        total_keys: totalKeys,
        memory_usage: stats.used_memory || 0,
        uptime: stats.uptime_in_seconds || 0,
      };
    } catch (error) {
      console.error('Redis STATS error:', error);
      return null;
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.client!.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis PING error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const redisClient = new RedisClient();

// Helper functions for common cache patterns
export const cacheHelpers = {
  // Generate cache keys with consistent naming
  generateKey: (prefix: string, ...parts: string[]): string => {
    return `${prefix}:${parts.join(':')}`;
  },

  // User-specific cache key
  userKey: (userId: string, type: string, id?: string): string => {
    const parts = ['user', userId, type];
    if (id) parts.push(id);
    return parts.join(':');
  },

  // AI response cache key
  aiKey: (prompt: string, options: string[], category: string): string => {
    const hash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify({ prompt, options, category }))
      .digest('hex');
    return `ai:${hash}`;
  },

  // Image analysis cache key
  imageKey: (imageHash: string, provider: string): string => {
    return `image:${provider}:${imageHash}`;
  },

  // Weather cache key
  weatherKey: (lat: number, lon: number): string => {
    return `weather:${lat.toFixed(2)}:${lon.toFixed(2)}`;
  },
};

export default redisClient;