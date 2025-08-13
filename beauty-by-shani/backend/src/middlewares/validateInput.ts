import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.Schema) => (req: Request, res: Response, next: NextFunction) => {
  console.log('Validate middleware body:', req.body);
  const { error } = schema.validate(req.body);
  if (error) {
    console.log('Validation error:', error.details[0].message);
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().min(8).required(),
});

export const bookingSchema = Joi.object({
  service_id: Joi.string().required(),
  addon_ids: Joi.array().items(Joi.string()).optional().default([]), // Array of add-on IDs
  date: Joi.date().required(),
  time: Joi.string().required(),
  client_name: Joi.string().required(),
  client_phone: Joi.string().required(),
  client_email: Joi.string().email().required(),
  language: Joi.string().valid('en', 'he').required(),
});

export const serviceSchema = Joi.object({
  name: Joi.string().required(),
  duration: Joi.number().integer().min(15).required(),
  price: Joi.number().min(0).required(),
  is_addon: Joi.boolean().default(false),
});