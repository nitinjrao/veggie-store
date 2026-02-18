import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { firebaseAuth } from '../lib/firebase';
import { ApiError } from '../utils/ApiError';

const customerFirebaseLoginSchema = z.object({
  idToken: z.string().min(1),
  name: z.string().min(1).optional(),
});

export const customerFirebaseLogin = async (req: Request, res: Response) => {
  const { idToken, name } = customerFirebaseLoginSchema.parse(req.body);

  const decoded = await firebaseAuth.verifyIdToken(idToken);
  const firebaseUid = decoded.uid;
  const phone = decoded.phone_number || null;

  // Try to find by firebaseUid first
  let customer = await prisma.customer.findUnique({ where: { firebaseUid } });

  if (!customer && phone) {
    // Migration: link existing customer by phone number
    customer = await prisma.customer.findUnique({ where: { phone } });
    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { firebaseUid, name: name || customer.name },
      });
    }
  }

  if (!customer) {
    // Create new customer
    customer = await prisma.customer.create({
      data: {
        phone: phone || `firebase_${firebaseUid}`,
        name: name || decoded.name || null,
        firebaseUid,
      },
    });
  }

  res.json({
    user: {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
      role: 'customer' as const,
    },
  });
};

const updateProfileSchema = z.object({
  whatsapp: z.string().max(20).optional(),
});

export const getProfile = async (req: Request, res: Response) => {
  const customer = await prisma.customer.findUnique({ where: { id: req.user!.id } });
  if (!customer) throw new ApiError(404, 'Customer not found');
  res.json({ id: customer.id, name: customer.name, phone: customer.phone, whatsapp: customer.whatsapp });
};

export const updateProfile = async (req: Request, res: Response) => {
  const data = updateProfileSchema.parse(req.body);
  const customer = await prisma.customer.update({
    where: { id: req.user!.id },
    data,
  });
  res.json({ id: customer.id, name: customer.name, phone: customer.phone, whatsapp: customer.whatsapp });
};

const adminFirebaseLoginSchema = z.object({
  idToken: z.string().min(1),
});

export const adminFirebaseLogin = async (req: Request, res: Response) => {
  const { idToken } = adminFirebaseLoginSchema.parse(req.body);

  const decoded = await firebaseAuth.verifyIdToken(idToken);
  const firebaseUid = decoded.uid;
  const email = decoded.email;

  if (!email) {
    throw new ApiError(400, 'Firebase account has no email');
  }

  // Try to find by firebaseUid first
  let admin = await prisma.adminUser.findUnique({ where: { firebaseUid } });

  if (!admin) {
    // Migration: link existing admin by email
    admin = await prisma.adminUser.findUnique({ where: { email } });
    if (admin) {
      admin = await prisma.adminUser.update({
        where: { id: admin.id },
        data: { firebaseUid },
      });
    }
  }

  if (!admin) {
    throw new ApiError(403, 'Not authorized as admin');
  }

  res.json({
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: 'admin' as const,
    },
  });
};
