import 'dotenv/config';
import app from './app';
import pool from './utils/db';

const reconnectDb = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT NOW()');
      console.log('DB connected');
      return;
    } catch (err) {
      console.error(`DB connection attempt ${i + 1} failed:`, err);
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

reconnectDb().catch(err => {
  console.error('Failed to connect to DB after retries:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));

// Seed initial services
(async () => {
  // First ensure the is_addon column exists
  try {
    await pool.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS is_addon BOOLEAN DEFAULT FALSE');
  } catch (err) {
    console.error('Error adding is_addon column:', err);
  }

  const services = [
    { name: 'Gel', duration: 60, price: 120, is_addon: false },
    { name: 'Gel X (Anatomy)', duration: 68, price: 140, is_addon: false },
    { name: 'Gel X Tips Full Set', duration: 68, price: 180, is_addon: false },
    { name: 'Hard Gel Full Set', duration: 105, price: 240, is_addon: false },
    { name: 'Individual Nail Fill', duration: 10, price: 10, is_addon: true },
    { name: 'Nail Art', duration: 30, price: 30, is_addon: true },
    { name: 'Gel Removal', duration: 20, price: 50, is_addon: true },
  ];
  for (const s of services) {
    try {
      await pool.query('INSERT INTO services (name, duration, price, is_addon) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO UPDATE SET is_addon = $4', [s.name, s.duration, s.price, s.is_addon]);
    } catch (err) {
      console.error(`Failed to seed service ${s.name}:`, err);
    }
  }
  console.log('Services seeded');
})();