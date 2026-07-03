// api/auth/login.js
// api/auth/login.js
import jwt from 'jsonwebtoken';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Path to JSON file with users (relative to project root)
const usersFile = path.join(process.cwd(), 'data', 'users.json');

function loadUsers() {
  try {
    const raw = readFileSync(usersFile, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password diperlukan' });
  }

  const users = loadUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Kredensial tidak valid' });
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '7d' }
  );

  // Return token and user data (excluding password)
  const { password: _, ...userSafe } = user;
  return res.status(200).json({ token, user: userSafe });
}
