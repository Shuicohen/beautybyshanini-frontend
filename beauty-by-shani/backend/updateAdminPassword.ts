import 'dotenv/config';
import pool from './src/utils/db';

async function updateAdminPassword() {
  const username = 'beautybyshanini';
  const password = '$2b$10$gqHQBU1l6CTqS4e1K0QAOetbfKNp8AuYh40tZbil/DxopBZ3uV3Ea';
  try {
    await pool.query(
      `UPDATE users SET password = $1 WHERE username = $2`,
      [password, username]
    );
    console.log('Admin password updated.');
  } catch (err) {
    console.error('Error updating admin password:', err);
  } finally {
    await pool.end();
  }
}

updateAdminPassword();
