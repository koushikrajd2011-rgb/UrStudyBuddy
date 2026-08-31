import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, email, password } = req.body;
  if (!username || !email || !password || username.trim() === '' || email.trim() === '' || password.trim() === '') {
    return res.status(400).json({ error: 'Username, email, and password required' });
  }

  const key = `user:${username.toLowerCase()}`;
  const existing = await redis.get(key);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await redis.set(key, JSON.stringify({ username, email, password: hashedPassword }));

  return res.status(200).json({ success: true, username, email });
}