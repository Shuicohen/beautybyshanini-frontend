import pool from '../utils/db';

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  is_addon: boolean;
}

export const getServices = async (): Promise<Service[]> => {
  const res = await pool.query('SELECT * FROM services');
  return res.rows;
};

export const addService = async (service: Omit<Service, 'id'>): Promise<Service> => {
  const res = await pool.query(
    'INSERT INTO services (name, duration, price, is_addon) VALUES ($1, $2, $3, $4) RETURNING *',
    [service.name, service.duration, service.price, service.is_addon || false]
  );
  return res.rows[0];
};

export const updateService = async (id: string, updates: Partial<Service>): Promise<Service | null> => {
  const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = Object.values(updates);
  values.push(id);
  const res = await pool.query(`UPDATE services SET ${fields} WHERE id = $${values.length} RETURNING *`, values);
  return res.rows[0] || null;
};

export const deleteService = async (id: string): Promise<boolean> => {
  const res = await pool.query('DELETE FROM services WHERE id = $1', [id]);
  return typeof res.rowCount === 'number' && res.rowCount > 0;
};