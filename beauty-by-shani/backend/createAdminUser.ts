import pool from './src/utils/db';

async function createAdmin() {
  const username = 'beautybyshanini';
  const password = '$2b$10$yzyjIFthYBn.wQGU4o3fEejGxTMBk77aMso7gaX0xtm.ke.krKMJxK';
  try {
    await pool.query(
      `INSERT INTO users (username, password) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING`,
      [username, password]
    );
    console.log('Admin user created or already exists.');
  } catch (err) {
    console.error('Error inserting admin user:', err);
  } finally {
    await pool.end();
  }
}

createAdmin();
