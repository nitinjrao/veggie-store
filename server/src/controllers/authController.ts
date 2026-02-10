import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

// In-memory OTP store: phone -> { otp, expiresAt }
const otpStore = new Map<string, { otp: string; expiresAt: Date }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Admin login
const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const adminLogin = async (req: Request, res: Response) => {
  const { email, password } = adminLoginSchema.parse(req.body);

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken({ id: admin.id, role: 'admin' });
  res.json({
    token,
    user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' as const },
  });
};

// Customer register
const customerRegisterSchema = z.object({
  phone: z.string().min(10).max(15),
  name: z.string().min(1).optional(),
});

export const customerRegister = async (req: Request, res: Response) => {
  const { phone, name } = customerRegisterSchema.parse(req.body);

  let customer = await prisma.customer.findUnique({ where: { phone } });
  if (customer) {
    throw new ApiError(409, 'Phone number already registered. Please login instead.');
  }

  customer = await prisma.customer.create({
    data: { phone, name },
  });

  const otp = generateOtp();
  otpStore.set(phone, { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });
  console.log(`[OTP] ${phone}: ${otp}`);

  res.status(201).json({ message: 'OTP sent to your phone', phone });
};

// Customer login (request OTP)
const customerLoginSchema = z.object({
  phone: z.string().min(10).max(15),
});

export const customerLogin = async (req: Request, res: Response) => {
  const { phone } = customerLoginSchema.parse(req.body);

  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) {
    throw new ApiError(404, 'Phone number not registered. Please register first.');
  }

  const otp = generateOtp();
  otpStore.set(phone, { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });
  console.log(`[OTP] ${phone}: ${otp}`);

  res.json({ message: 'OTP sent to your phone', phone });
};

// Verify OTP
const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
});

export const verifyOtp = async (req: Request, res: Response) => {
  const { phone, otp } = verifyOtpSchema.parse(req.body);

  const stored = otpStore.get(phone);
  if (!stored) {
    throw new ApiError(400, 'No OTP requested for this phone number');
  }

  if (new Date() > stored.expiresAt) {
    otpStore.delete(phone);
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }

  if (stored.otp !== otp) {
    throw new ApiError(400, 'Invalid OTP');
  }

  otpStore.delete(phone);

  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const token = signToken({ id: customer.id, role: 'customer' });
  res.json({
    token,
    user: { id: customer.id, phone: customer.phone, name: customer.name, role: 'customer' as const },
  });
};
