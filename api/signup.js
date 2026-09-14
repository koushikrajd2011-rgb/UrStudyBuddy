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

  const { username, email, password, grade } = req.body;
  if (!username || !email || !password || username.trim() === '' || email.trim() === '' || password.trim() === '') {
    return res.status(400).json({ error: 'Username, email, and password required' });
  }

  const userKey = `user:${username.toLowerCase()}`;
  const existing = await redis.get(userKey);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const emailKey = `email:${email.toLowerCase()}`;
  const emailTaken = await redis.get(emailKey);
  if (emailTaken) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await redis.set(userKey, JSON.stringify({ username, email, password: hashedPassword, grade }));
  await redis.set(emailKey, username);

  return res.status(200).json({ success: true, username, email });
}