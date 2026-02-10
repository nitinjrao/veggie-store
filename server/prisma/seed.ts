import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { email: 'admin@veggiestore.com' },
    update: {},
    create: {
      email: 'admin@veggiestore.com',
      password: hashedPassword,
      name: 'Admin',
    },
  });
  console.log('Admin user seeded');

  // Seed categories
  const categories = [
    { name: 'Leafy Greens', nameHindi: 'हरी पत्तेदार सब्जियाँ', sortOrder: 1 },
    { name: 'Root Vegetables', nameHindi: 'जड़ वाली सब्जियाँ', sortOrder: 2 },
    { name: 'Gourds & Squash', nameHindi: 'लौकी और कद्दू', sortOrder: 3 },
    { name: 'Beans & Legumes', nameHindi: 'फलियाँ और दालें', sortOrder: 4 },
    { name: 'Everyday Essentials', nameHindi: 'रोज़मर्रा की सब्जियाँ', sortOrder: 5 },
    { name: 'Exotic & Specialty', nameHindi: 'विशेष सब्जियाँ', sortOrder: 6 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: { nameHindi: cat.nameHindi, sortOrder: cat.sortOrder },
      create: cat,
    });
    categoryMap[cat.name] = created.id;
  }
  console.log('Categories seeded');

  // Seed vegetables with prices
  const vegetables = [
    { name: 'Spinach', nameHindi: 'पालक', emoji: '🥬', categoryName: 'Leafy Greens', stockKg: 25, pricePerKg: 40, pricePerPacket: 20, packetWeight: 0.5 },
    { name: 'Fenugreek', nameHindi: 'मेथी', emoji: '🌿', categoryName: 'Leafy Greens', stockKg: 15, pricePerKg: 60, pricePerPacket: 30, packetWeight: 0.5 },
    { name: 'Coriander', nameHindi: 'धनिया', emoji: '🌿', categoryName: 'Leafy Greens', stockKg: 10, pricePerKg: 80, pricePerPacket: 10, packetWeight: 0.1 },
    { name: 'Mustard Greens', nameHindi: 'सरसों का साग', emoji: '🥬', categoryName: 'Leafy Greens', stockKg: 20, pricePerKg: 40, pricePerPacket: 20, packetWeight: 0.5 },
    { name: 'Potato', nameHindi: 'आलू', emoji: '🥔', categoryName: 'Root Vegetables', stockKg: 100, pricePerKg: 30 },
    { name: 'Onion', nameHindi: 'प्याज', emoji: '🧅', categoryName: 'Root Vegetables', stockKg: 80, pricePerKg: 35 },
    { name: 'Carrot', nameHindi: 'गाजर', emoji: '🥕', categoryName: 'Root Vegetables', stockKg: 40, pricePerKg: 50 },
    { name: 'Radish', nameHindi: 'मूली', emoji: '🥕', categoryName: 'Root Vegetables', stockKg: 30, pricePerKg: 30, pricePerPiece: 10 },
    { name: 'Bottle Gourd', nameHindi: 'लौकी', emoji: '🫛', categoryName: 'Gourds & Squash', stockKg: 35, pricePerKg: 35, pricePerPiece: 30 },
    { name: 'Bitter Gourd', nameHindi: 'करेला', emoji: '🥒', categoryName: 'Gourds & Squash', stockKg: 20, pricePerKg: 60 },
    { name: 'Pumpkin', nameHindi: 'कद्दू', emoji: '🎃', categoryName: 'Gourds & Squash', stockKg: 50, pricePerKg: 30 },
    { name: 'Ridge Gourd', nameHindi: 'तोरई', emoji: '🥒', categoryName: 'Gourds & Squash', stockKg: 25, pricePerKg: 40 },
    { name: 'French Beans', nameHindi: 'फ्रेंच बीन्स', emoji: '🫘', categoryName: 'Beans & Legumes', stockKg: 20, pricePerKg: 80, pricePerPacket: 40, packetWeight: 0.5 },
    { name: 'Green Peas', nameHindi: 'मटर', emoji: '🟢', categoryName: 'Beans & Legumes', stockKg: 30, pricePerKg: 100, pricePerPacket: 50, packetWeight: 0.5 },
    { name: 'Tomato', nameHindi: 'टमाटर', emoji: '🍅', categoryName: 'Everyday Essentials', stockKg: 60, pricePerKg: 40 },
    { name: 'Green Chili', nameHindi: 'हरी मिर्च', emoji: '🌶️', categoryName: 'Everyday Essentials', stockKg: 10, pricePerKg: 80, pricePerPacket: 10, packetWeight: 0.1 },
    { name: 'Ginger', nameHindi: 'अदरक', emoji: '🫚', categoryName: 'Everyday Essentials', stockKg: 15, pricePerKg: 200 },
    { name: 'Garlic', nameHindi: 'लहसुन', emoji: '🧄', categoryName: 'Everyday Essentials', stockKg: 20, pricePerKg: 250 },
    { name: 'Broccoli', nameHindi: 'ब्रोकोली', emoji: '🥦', categoryName: 'Exotic & Specialty', stockKg: 15, pricePerKg: 120, pricePerPiece: 60 },
    { name: 'Capsicum', nameHindi: 'शिमला मिर्च', emoji: '🫑', categoryName: 'Exotic & Specialty', stockKg: 25, pricePerKg: 80 },
  ];

  for (const veg of vegetables) {
    const { categoryName, stockKg, pricePerKg, pricePerPiece, pricePerPacket, packetWeight, ...vegData } = veg;
    const categoryId = categoryMap[categoryName];

    // Check if vegetable already exists (idempotent)
    const existing = await prisma.vegetable.findFirst({
      where: { name: vegData.name, categoryId },
    });

    if (!existing) {
      await prisma.vegetable.create({
        data: {
          ...vegData,
          categoryId,
          stockKg: stockKg ?? 0,
          prices: {
            create: {
              pricePerKg: pricePerKg ?? undefined,
              pricePerPiece: pricePerPiece ?? undefined,
              pricePerPacket: pricePerPacket ?? undefined,
              packetWeight: packetWeight ?? undefined,
            },
          },
        },
      });
    }
  }
  console.log('20 vegetables with prices seeded');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
