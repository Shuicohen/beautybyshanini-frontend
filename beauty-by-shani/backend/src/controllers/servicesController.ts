import { Request, Response } from 'express';
import { getServices, addService, updateService, deleteService } from '../models/service';

export const list = async (req: Request, res: Response) => {
  const services = await getServices();
  res.json(services);
};

export const getMainServices = async (req: Request, res: Response) => {
  const services = await getServices();
  const mainServices = services.filter(service => !service.is_addon);
  res.json(mainServices);
};

export const getAddOns = async (req: Request, res: Response) => {
  const services = await getServices();
  const addOns = services.filter(service => service.is_addon);
  res.json(addOns);
};

export const create = async (req: Request, res: Response) => {
  const service = await addService(req.body);
  res.status(201).json(service);
};

export const update = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await updateService(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Service not found' });
  res.json(updated);
};

export const remove = async (req: Request, res: Response) => {
  const { id } = req.params;
  const success = await deleteService(id);
  if (!success) return res.status(404).json({ error: 'Service not found' });
  res.json({ message: 'Deleted' });
};