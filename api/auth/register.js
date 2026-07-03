// api/auth/register.js
import jwt from 'jsonwebtoken';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const usersFile = path.join(process.cwd(), 'data', 'users.json');

function loadUsers() {
  try {
    const raw = readFileSync(usersFile, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  writeFileSync(usersFile, JSON.stringify(users, null, 2));
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
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ message: 'Username sudah dipakai' });
  }

  // Hash password (bcrypt) – for demo we store hashed value
  const hashed = await bcrypt.hash(password, 10);
  const newUser = {
    id: String(Date.now()),
    username,
    password: hashed,
    role: 'user',
    avatar_url: '',
    level: 1,
    exp: 0
  };
  users.push(newUser);
  saveUsers(users);

  const token = jwt.sign({ sub: newUser.id, username: newUser.username, role: newUser.role },
    process.env.JWT_SECRET || 'default_secret', { expiresIn: '7d' });

  const { password: _, ...userSafe } = newUser;
  return res.status(201).json({ token, user: userSafe });
}
