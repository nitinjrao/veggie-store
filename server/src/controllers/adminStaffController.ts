import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { firebaseAuth } from '../lib/firebase';
import { ApiError } from '../utils/ApiError';
import { Prisma, StaffRole } from '@prisma/client';
import { parsePagination } from '../utils/pagination';

const createStaffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().max(20).optional(),
  role: z.nativeEnum(StaffRole),
});

const updateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).nullable().optional(),
  role: z.nativeEnum(StaffRole).optional(),
  active: z.boolean().optional(),
});

export const listStaff = async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
  const search = req.query.search as string | undefined;
  const role = req.query.role as string | undefined;

  const where: Prisma.StaffUserWhereInput = {};

  if (role) {
    const upperRole = role.toUpperCase();
    if (Object.values(StaffRole).includes(upperRole as StaffRole)) {
      where.role = upperRole as StaffRole;
    }
  }

  if (search?.trim()) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [staff, total] = await Promise.all([
    prisma.staffUser.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.staffUser.count({ where }),
  ]);

  res.json({
    staff,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
};

export const createStaff = async (req: Request, res: Response) => {
  const data = createStaffSchema.parse(req.body);

  // Check unique email
  const existing = await prisma.staffUser.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ApiError(409, 'A staff user with this email already exists');
  }

  const staffUser = await prisma.staffUser.create({ data });

  res.status(201).json(staffUser);
};

export const getStaff = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const staffUser = await prisma.staffUser.findUnique({ where: { id } });

  if (!staffUser) {
    throw new ApiError(404, 'Staff user not found');
  }

  res.json(staffUser);
};

export const updateStaff = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = updateStaffSchema.parse(req.body);

  const existing = await prisma.staffUser.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Staff user not found');
  }

  // If email is being changed, check uniqueness
  if (data.email && data.email !== existing.email) {
    const emailTaken = await prisma.staffUser.findUnique({ where: { email: data.email } });
    if (emailTaken) {
      throw new ApiError(409, 'A staff user with this email already exists');
    }
  }

  const staffUser = await prisma.staffUser.update({
    where: { id },
    data,
  });

  res.json(staffUser);
};

export const deactivateStaff = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.staffUser.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Staff user not found');
  }

  const staffUser = await prisma.staffUser.update({
    where: { id },
    data: { active: false },
  });

  res.json(staffUser);
};

const setPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const setStaffPassword = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { password } = setPasswordSchema.parse(req.body);

  if (!firebaseAuth) {
    throw new ApiError(500, 'Firebase is not configured');
  }

  const staffUser = await prisma.staffUser.findUnique({ where: { id } });
  if (!staffUser) {
    throw new ApiError(404, 'Staff user not found');
  }

  let firebaseUid = staffUser.firebaseUid;

  if (firebaseUid) {
    // Update existing Firebase account password
    await firebaseAuth.updateUser(firebaseUid, { password });
  } else {
    // Create new Firebase account
    const fbUser = await firebaseAuth.createUser({
      email: staffUser.email,
      password,
      displayName: staffUser.name,
    });
    firebaseUid = fbUser.uid;

    // Link Firebase UID to staff record
    await prisma.staffUser.update({
      where: { id },
      data: { firebaseUid },
    });
  }

  res.json({ message: 'Password set successfully' });
};
