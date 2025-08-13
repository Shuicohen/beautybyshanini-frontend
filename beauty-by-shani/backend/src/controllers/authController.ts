import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../utils/db';

export const login = async (req: Request, res: Response) => {
  console.log('Login request body:', req.body);
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const userRes = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = userRes.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '24h' });
  res.json({ token });
};