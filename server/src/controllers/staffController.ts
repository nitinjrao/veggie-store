import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { firebaseAuth } from '../lib/firebase';
import { ApiError } from '../utils/ApiError';

const staffFirebaseLoginSchema = z.object({
  idToken: z.string().min(1),
});

export const staffFirebaseLogin = async (req: Request, res: Response) => {
  const { idToken } = staffFirebaseLoginSchema.parse(req.body);

  const decoded = await firebaseAuth.verifyIdToken(idToken);
  const firebaseUid = decoded.uid;
  const email = decoded.email;

  if (!email) {
    throw new ApiError(400, 'Firebase account has no email');
  }

  // Try to find by firebaseUid first
  let staffUser = await prisma.staffUser.findUnique({ where: { firebaseUid } });

  if (!staffUser) {
    // Migration: link existing staff user by email
    staffUser = await prisma.staffUser.findUnique({ where: { email } });
    if (staffUser) {
      staffUser = await prisma.staffUser.update({
        where: { id: staffUser.id },
        data: { firebaseUid },
      });
    }
  }

  if (!staffUser) {
    throw new ApiError(403, 'Not authorized as staff');
  }

  if (!staffUser.active) {
    throw new ApiError(403, 'Staff account is deactivated');
  }

  res.json({
    user: {
      id: staffUser.id,
      name: staffUser.name,
      email: staffUser.email,
      role: staffUser.role.toLowerCase(),
      staffRole: staffUser.role,
    },
  });
};
