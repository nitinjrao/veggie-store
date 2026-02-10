import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { email: 'admin@sampadagreen.com' },
    update: {},
    create: {
      email: 'admin@sampadagreen.com',
      password: hashedPassword,
      name: 'Admin',
    },
  });
  console.log('Admin user seeded');

  // Seed categories
  const categories = [
    {
      name: 'Leafy Greens',
      nameHindi: 'हरी पत्तेदार सब्जियाँ',
      nameKannada: 'ಸೊಪ್ಪುಗಳು',
      sortOrder: 1,
    },
    {
      name: 'Root Vegetables',
      nameHindi: 'जड़ वाली सब्जियाँ',
      nameKannada: 'ಮೂಲ ತರಕಾರಿಗಳು',
      sortOrder: 2,
    },
    {
      name: 'Gourds & Squash',
      nameHindi: 'लौकी और कद्दू',
      nameKannada: 'ಸೊರೆಕಾಯಿ ಮತ್ತು ಕುಂಬಳಕಾಯಿ',
      sortOrder: 3,
    },
    {
      name: 'Beans & Legumes',
      nameHindi: 'फलियाँ और दालें',
      nameKannada: 'ಬೀಜಗಳು ಮತ್ತು ಕಾಳುಗಳು',
      sortOrder: 4,
    },
    {
      name: 'Everyday Essentials',
      nameHindi: 'रोज़मर्रा की सब्जियाँ',
      nameKannada: 'ದೈನಂದಿನ ತರಕಾರಿಗಳು',
      sortOrder: 5,
    },
    {
      name: 'Exotic & Specialty',
      nameHindi: 'विशेष सब्जियाँ',
      nameKannada: 'ವಿಶೇಷ ತರಕಾರಿಗಳು',
      sortOrder: 6,
    },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {
        nameHindi: cat.nameHindi,
        nameKannada: cat.nameKannada,
        sortOrder: cat.sortOrder,
      },
      create: cat,
    });
    categoryMap[cat.name] = created.id;
  }
  console.log('Categories seeded');

  // Seed vegetables with prices
  const vegetables = [
    {
      name: 'Spinach',
      nameHindi: 'पालक',
      nameKannada: 'ಪಾಲಕ್ ಸೊಪ್ಪು',
      emoji: '🥬',
      categoryName: 'Leafy Greens',
      stockKg: 25,
      pricePerKg: 40,
      pricePerPacket: 20,
      packetWeight: 0.5,
    },
    {
      name: 'Fenugreek',
      nameHindi: 'मेथी',
      nameKannada: 'ಮೆಂತ್ಯೆ ಸೊಪ್ಪು',
      emoji: '🌿',
      categoryName: 'Leafy Greens',
      stockKg: 15,
      pricePerKg: 60,
      pricePerPacket: 30,
      packetWeight: 0.5,
    },
    {
      name: 'Coriander',
      nameHindi: 'धनिया',
      nameKannada: 'ಕೊತ್ತಂಬರಿ ಸೊಪ್ಪು',
      emoji: '🌿',
      categoryName: 'Leafy Greens',
      stockKg: 10,
      pricePerKg: 80,
      pricePerPacket: 10,
      packetWeight: 0.1,
    },
    {
      name: 'Mustard Greens',
      nameHindi: 'सरसों का साग',
      nameKannada: 'ಸಾಸಿವೆ ಸೊಪ್ಪು',
      emoji: '🥬',
      categoryName: 'Leafy Greens',
      stockKg: 20,
      pricePerKg: 40,
      pricePerPacket: 20,
      packetWeight: 0.5,
    },
    {
      name: 'Potato',
      nameHindi: 'आलू',
      nameKannada: 'ಆಲೂಗಡ್ಡೆ',
      emoji: '🥔',
      categoryName: 'Root Vegetables',
      stockKg: 100,
      pricePerKg: 30,
    },
    {
      name: 'Onion',
      nameHindi: 'प्याज',
      nameKannada: 'ಈರುಳ್ಳಿ',
      emoji: '🧅',
      categoryName: 'Root Vegetables',
      stockKg: 80,
      pricePerKg: 35,
    },
    {
      name: 'Carrot',
      nameHindi: 'गाजर',
      nameKannada: 'ಕ್ಯಾರೆಟ್',
      emoji: '🥕',
      categoryName: 'Root Vegetables',
      stockKg: 40,
      pricePerKg: 50,
    },
    {
      name: 'Radish',
      nameHindi: 'मूली',
      nameKannada: 'ಮೂಲಂಗಿ',
      emoji: '🥕',
      categoryName: 'Root Vegetables',
      stockKg: 30,
      pricePerKg: 30,
      pricePerPiece: 10,
    },
    {
      name: 'Bottle Gourd',
      nameHindi: 'लौकी',
      nameKannada: 'ಸೊರೆಕಾಯಿ',
      emoji: '🫛',
      categoryName: 'Gourds & Squash',
      stockKg: 35,
      pricePerKg: 35,
      pricePerPiece: 30,
    },
    {
      name: 'Bitter Gourd',
      nameHindi: 'करेला',
      nameKannada: 'ಹಾಗಲಕಾಯಿ',
      emoji: '🥒',
      categoryName: 'Gourds & Squash',
      stockKg: 20,
      pricePerKg: 60,
    },
    {
      name: 'Pumpkin',
      nameHindi: 'कद्दू',
      nameKannada: 'ಕುಂಬಳಕಾಯಿ',
      emoji: '🎃',
      categoryName: 'Gourds & Squash',
      stockKg: 50,
      pricePerKg: 30,
    },
    {
      name: 'Ridge Gourd',
      nameHindi: 'तोरई',
      nameKannada: 'ಹೆರೆಕಾಯಿ',
      emoji: '🥒',
      categoryName: 'Gourds & Squash',
      stockKg: 25,
      pricePerKg: 40,
    },
    {
      name: 'French Beans',
      nameHindi: 'फ्रेंच बीन्स',
      nameKannada: 'ಫ್ರೆಂಚ್ ಬೀನ್ಸ್',
      emoji: '🫘',
      categoryName: 'Beans & Legumes',
      stockKg: 20,
      pricePerKg: 80,
      pricePerPacket: 40,
      packetWeight: 0.5,
    },
    {
      name: 'Green Peas',
      nameHindi: 'मटर',
      nameKannada: 'ಅವರೆಕಾಳು / ಬಟಾಣಿ',
      emoji: '🟢',
      categoryName: 'Beans & Legumes',
      stockKg: 30,
      pricePerKg: 100,
      pricePerPacket: 50,
      packetWeight: 0.5,
    },
    {
      name: 'Tomato',
      nameHindi: 'टमाटर',
      nameKannada: 'ಟೊಮೇಟೊ',
      emoji: '🍅',
      categoryName: 'Everyday Essentials',
      stockKg: 60,
      pricePerKg: 40,
    },
    {
      name: 'Green Chili',
      nameHindi: 'हरी मिर्च',
      nameKannada: 'ಹಸಿಮೆಣಸಿನಕಾಯಿ',
      emoji: '🌶️',
      categoryName: 'Everyday Essentials',
      stockKg: 10,
      pricePerKg: 80,
      pricePerPacket: 10,
      packetWeight: 0.1,
    },
    {
      name: 'Ginger',
      nameHindi: 'अदरक',
      nameKannada: 'ಶುಂಠಿ',
      emoji: '🫚',
      categoryName: 'Everyday Essentials',
      stockKg: 15,
      pricePerKg: 200,
    },
    {
      name: 'Garlic',
      nameHindi: 'लहसुन',
      nameKannada: 'ಬೆಳ್ಳುಳ್ಳಿ',
      emoji: '🧄',
      categoryName: 'Everyday Essentials',
      stockKg: 20,
      pricePerKg: 250,
    },
    {
      name: 'Broccoli',
      nameHindi: 'ब्रोकोली',
      nameKannada: 'ಬ್ರೋಕಲಿ',
      emoji: '🥦',
      categoryName: 'Exotic & Specialty',
      stockKg: 15,
      pricePerKg: 120,
      pricePerPiece: 60,
    },
    {
      name: 'Capsicum',
      nameHindi: 'शिमला मिर्च',
      nameKannada: 'ದೆಳ್ಳುಮೆಣಸಿನಕಾಯಿ / ಕ್ಯಾಪ್ಸಿಕಂ',
      emoji: '🫑',
      categoryName: 'Exotic & Specialty',
      stockKg: 25,
      pricePerKg: 80,
    },
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
