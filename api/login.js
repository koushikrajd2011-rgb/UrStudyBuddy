import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/email and password required' });
  }

  let username = identifier.trim();

  if (username.includes('@')) {
    const linkedUsername = await redis.get(`email:${username.toLowerCase()}`);
    if (!linkedUsername) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }
    username = linkedUsername;
  }

  const key = `user:${username.toLowerCase()}`;
  const stored = await redis.get(key);

  if (!stored) {
    return res.status(401).json({ error: 'Invalid username/email or password' });
  }

  const userData = typeof stored === 'string' ? JSON.parse(stored) : stored;
  const match = await bcrypt.compare(password, userData.password);

  if (!match) {
    return res.status(401).json({ error: 'Invalid username/email or password' });
  }

  return res.status(200).json({ success: true, username: userData.username, email: userData.email });
}