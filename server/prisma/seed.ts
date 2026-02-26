import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ─── 1. Admin Users ──────────────────────────────────────────────
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@sampadagreen.com' },
    update: {},
    create: { email: 'admin@sampadagreen.com', name: 'Admin' },
  });
  await prisma.adminUser.upsert({
    where: { email: 'nitinjrao@gmail.com' },
    update: {},
    create: { email: 'nitinjrao@gmail.com', name: 'Nitin' },
  });
  console.log('Admin users seeded');

  // ─── 2. Staff Users ─────────────────────────────────────────────
  const staffData = [
    { name: 'Ravi Kumar', email: 'ravi@sampadagreen.com', phone: '9880011001', role: 'PRODUCER' as const },
    { name: 'Suresh Gowda', email: 'suresh@sampadagreen.com', phone: '9880011002', role: 'PRODUCER' as const },
    { name: 'Manjunath B', email: 'manju@sampadagreen.com', phone: '9880011003', role: 'SUPPLIER' as const },
    { name: 'Prasad Reddy', email: 'prasad@sampadagreen.com', phone: '9880011004', role: 'SUPPLIER' as const },
    { name: 'Dinesh S', email: 'dinesh@sampadagreen.com', phone: '9880011005', role: 'TRANSPORTER' as const },
    { name: 'Venkatesh M', email: 'venkatesh@sampadagreen.com', phone: '9880011006', role: 'TRANSPORTER' as const },
  ];
  const staffMap: Record<string, string> = {};
  for (const s of staffData) {
    const created = await prisma.staffUser.upsert({
      where: { email: s.email },
      update: {},
      create: s,
    });
    staffMap[s.email] = created.id;
  }
  console.log('Staff users seeded');

  // ─── 3. Categories ──────────────────────────────────────────────
  const categories = [
    { name: 'Leafy Greens', nameHindi: 'हरी पत्तेदार सब्जियाँ', nameKannada: 'ಸೊಪ್ಪುಗಳು', sortOrder: 1 },
    { name: 'Root Vegetables', nameHindi: 'जड़ वाली सब्जियाँ', nameKannada: 'ಮೂಲ ತರಕಾರಿಗಳು', sortOrder: 2 },
    { name: 'Gourds & Squash', nameHindi: 'लौकी और कद्दू', nameKannada: 'ಸೊರೆಕಾಯಿ ಮತ್ತು ಕುಂಬಳಕಾಯಿ', sortOrder: 3 },
    { name: 'Beans & Legumes', nameHindi: 'फलियाँ और दालें', nameKannada: 'ಬೀಜಗಳು ಮತ್ತು ಕಾಳುಗಳು', sortOrder: 4 },
    { name: 'Everyday Essentials', nameHindi: 'रोज़मर्रा की सब्जियाँ', nameKannada: 'ದೈನಂದಿನ ತರಕಾರಿಗಳು', sortOrder: 5 },
    { name: 'Exotic & Specialty', nameHindi: 'विशेष सब्जियाँ', nameKannada: 'ವಿಶೇಷ ತರಕಾರಿಗಳು', sortOrder: 6 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: { nameHindi: cat.nameHindi, nameKannada: cat.nameKannada, sortOrder: cat.sortOrder },
      create: cat,
    });
    categoryMap[cat.name] = created.id;
  }
  console.log('Categories seeded');

  // ─── 4. Vegetables with Prices ──────────────────────────────────
  const vegetables = [
    { name: 'Spinach', nameHindi: 'पालक', nameKannada: 'ಪಾಲಕ್ ಸೊಪ್ಪು', emoji: '🥬', categoryName: 'Leafy Greens', stockKg: 25, pricePerKg: 40, pricePerBunch: 15, pricePerPacket: 20, packetWeight: 0.5 },
    { name: 'Fenugreek', nameHindi: 'मेथी', nameKannada: 'ಮೆಂತ್ಯೆ ಸೊಪ್ಪು', emoji: '🌿', categoryName: 'Leafy Greens', stockKg: 15, pricePerKg: 60, pricePerBunch: 20, pricePerPacket: 30, packetWeight: 0.5 },
    { name: 'Coriander', nameHindi: 'धनिया', nameKannada: 'ಕೊತ್ತಂಬರಿ ಸೊಪ್ಪು', emoji: '🌿', categoryName: 'Leafy Greens', stockKg: 10, pricePerKg: 80, pricePerBunch: 10, pricePerPacket: 10, packetWeight: 0.1 },
    { name: 'Mustard Greens', nameHindi: 'सरसों का साग', nameKannada: 'ಸಾಸಿವೆ ಸೊಪ್ಪು', emoji: '🥬', categoryName: 'Leafy Greens', stockKg: 20, pricePerKg: 40, pricePerBunch: 15, pricePerPacket: 20, packetWeight: 0.5 },
    { name: 'Curry Leaves', nameHindi: 'कड़ी पत्ता', nameKannada: 'ಕರಿಬೇವು', emoji: '🍃', categoryName: 'Leafy Greens', stockKg: 5, pricePerKg: 200, pricePerBunch: 5 },
    { name: 'Amaranth Leaves', nameHindi: 'चौलाई', nameKannada: 'ರಾಜಗಿರಿ ಸೊಪ್ಪು', emoji: '🥬', categoryName: 'Leafy Greens', stockKg: 12, pricePerKg: 50, pricePerBunch: 15 },
    { name: 'Potato', nameHindi: 'आलू', nameKannada: 'ಆಲೂಗಡ್ಡೆ', emoji: '🥔', categoryName: 'Root Vegetables', stockKg: 100, pricePerKg: 30 },
    { name: 'Onion', nameHindi: 'प्याज', nameKannada: 'ಈರುಳ್ಳಿ', emoji: '🧅', categoryName: 'Root Vegetables', stockKg: 80, pricePerKg: 35 },
    { name: 'Carrot', nameHindi: 'गाजर', nameKannada: 'ಕ್ಯಾರೆಟ್', emoji: '🥕', categoryName: 'Root Vegetables', stockKg: 40, pricePerKg: 50 },
    { name: 'Radish', nameHindi: 'मूली', nameKannada: 'ಮೂಲಂಗಿ', emoji: '🥕', categoryName: 'Root Vegetables', stockKg: 30, pricePerKg: 30, pricePerPiece: 10 },
    { name: 'Beetroot', nameHindi: 'चुकंदर', nameKannada: 'ಬೀಟ್ರೂಟ್', emoji: '🟣', categoryName: 'Root Vegetables', stockKg: 25, pricePerKg: 40 },
    { name: 'Bottle Gourd', nameHindi: 'लौकी', nameKannada: 'ಸೊರೆಕಾಯಿ', emoji: '🫛', categoryName: 'Gourds & Squash', stockKg: 35, pricePerKg: 35, pricePerPiece: 30 },
    { name: 'Bitter Gourd', nameHindi: 'करेला', nameKannada: 'ಹಾಗಲಕಾಯಿ', emoji: '🥒', categoryName: 'Gourds & Squash', stockKg: 20, pricePerKg: 60 },
    { name: 'Pumpkin', nameHindi: 'कद्दू', nameKannada: 'ಕುಂಬಳಕಾಯಿ', emoji: '🎃', categoryName: 'Gourds & Squash', stockKg: 50, pricePerKg: 30 },
    { name: 'Ridge Gourd', nameHindi: 'तोरई', nameKannada: 'ಹೆರೆಕಾಯಿ', emoji: '🥒', categoryName: 'Gourds & Squash', stockKg: 25, pricePerKg: 40 },
    { name: 'Ash Gourd', nameHindi: 'पेठा', nameKannada: 'ಬೂದುಗುಂಬಳ', emoji: '🟢', categoryName: 'Gourds & Squash', stockKg: 30, pricePerKg: 25, pricePerPiece: 40 },
    { name: 'French Beans', nameHindi: 'फ्रेंच बीन्स', nameKannada: 'ಫ್ರೆಂಚ್ ಬೀನ್ಸ್', emoji: '🫘', categoryName: 'Beans & Legumes', stockKg: 20, pricePerKg: 80, pricePerPacket: 40, packetWeight: 0.5 },
    { name: 'Green Peas', nameHindi: 'मटर', nameKannada: 'ಅವರೆಕಾಳು / ಬಟಾಣಿ', emoji: '🟢', categoryName: 'Beans & Legumes', stockKg: 30, pricePerKg: 100, pricePerPacket: 50, packetWeight: 0.5 },
    { name: 'Cluster Beans', nameHindi: 'ग्वार फली', nameKannada: 'ಗೋರಿಕಾಯಿ', emoji: '🫘', categoryName: 'Beans & Legumes', stockKg: 15, pricePerKg: 70 },
    { name: 'Broad Beans', nameHindi: 'सेम', nameKannada: 'ಅವರೆಕಾಯಿ', emoji: '🫛', categoryName: 'Beans & Legumes', stockKg: 18, pricePerKg: 60 },
    { name: 'Tomato', nameHindi: 'टमाटर', nameKannada: 'ಟೊಮೇಟೊ', emoji: '🍅', categoryName: 'Everyday Essentials', stockKg: 60, pricePerKg: 40 },
    { name: 'Green Chili', nameHindi: 'हरी मिर्च', nameKannada: 'ಹಸಿಮೆಣಸಿನಕಾಯಿ', emoji: '🌶️', categoryName: 'Everyday Essentials', stockKg: 10, pricePerKg: 80, pricePerPacket: 10, packetWeight: 0.1 },
    { name: 'Ginger', nameHindi: 'अदरक', nameKannada: 'ಶುಂಠಿ', emoji: '🫚', categoryName: 'Everyday Essentials', stockKg: 15, pricePerKg: 200 },
    { name: 'Garlic', nameHindi: 'लहसुन', nameKannada: 'ಬೆಳ್ಳುಳ್ಳಿ', emoji: '🧄', categoryName: 'Everyday Essentials', stockKg: 20, pricePerKg: 250 },
    { name: 'Cucumber', nameHindi: 'खीरा', nameKannada: 'ಸೌತೆಕಾಯಿ', emoji: '🥒', categoryName: 'Everyday Essentials', stockKg: 35, pricePerKg: 30 },
    { name: 'Drumstick', nameHindi: 'सहजन', nameKannada: 'ನುಗ್ಗೆಕಾಯಿ', emoji: '🥢', categoryName: 'Everyday Essentials', stockKg: 20, pricePerKg: 60, pricePerPiece: 8 },
    { name: 'Brinjal', nameHindi: 'बैंगन', nameKannada: 'ಬದನೆಕಾಯಿ', emoji: '🍆', categoryName: 'Everyday Essentials', stockKg: 30, pricePerKg: 40 },
    { name: 'Lady Finger', nameHindi: 'भिंडी', nameKannada: 'ಬೆಂಡೆಕಾಯಿ', emoji: '🟢', categoryName: 'Everyday Essentials', stockKg: 25, pricePerKg: 50 },
    { name: 'Broccoli', nameHindi: 'ब्रोकोली', nameKannada: 'ಬ್ರೋಕಲಿ', emoji: '🥦', categoryName: 'Exotic & Specialty', stockKg: 15, pricePerKg: 120, pricePerPiece: 60 },
    { name: 'Capsicum', nameHindi: 'शिमला मिर्च', nameKannada: 'ದೆಳ್ಳುಮೆಣಸಿನಕಾಯಿ / ಕ್ಯಾಪ್ಸಿಕಂ', emoji: '🫑', categoryName: 'Exotic & Specialty', stockKg: 25, pricePerKg: 80 },
    { name: 'Zucchini', nameHindi: 'ज़ुकीनी', nameKannada: 'ಜುಕಿನಿ', emoji: '🥒', categoryName: 'Exotic & Specialty', stockKg: 10, pricePerKg: 100 },
    { name: 'Baby Corn', nameHindi: 'बेबी कॉर्न', nameKannada: 'ಬೇಬಿ ಕಾರ್ನ್', emoji: '🌽', categoryName: 'Exotic & Specialty', stockKg: 12, pricePerKg: 150, pricePerPacket: 40, packetWeight: 0.25 },
  ];

  const vegMap: Record<string, string> = {};
  for (const veg of vegetables) {
    const { categoryName, stockKg, pricePerKg, pricePerPiece, pricePerPacket, pricePerBunch, packetWeight, ...vegData } = veg;
    const categoryId = categoryMap[categoryName];

    const existing = await prisma.vegetable.findFirst({
      where: { name: vegData.name, categoryId },
    });

    if (!existing) {
      const created = await prisma.vegetable.create({
        data: {
          ...vegData,
          categoryId,
          stockKg: stockKg ?? 0,
          prices: {
            create: {
              pricePerKg: pricePerKg ?? undefined,
              pricePerPiece: pricePerPiece ?? undefined,
              pricePerPacket: pricePerPacket ?? undefined,
              pricePerBunch: pricePerBunch ?? undefined,
              packetWeight: packetWeight ?? undefined,
            },
          },
        },
      });
      vegMap[veg.name] = created.id;
    } else {
      vegMap[veg.name] = existing.id;
      const latestPrice = await prisma.price.findFirst({
        where: { vegetableId: existing.id },
        orderBy: { effectiveFrom: 'desc' },
      });
      if (latestPrice) {
        await prisma.price.update({
          where: { id: latestPrice.id },
          data: {
            pricePerBunch: pricePerBunch ?? undefined,
            pricePerPacket: pricePerPacket ?? latestPrice.pricePerPacket ?? undefined,
            packetWeight: packetWeight ?? latestPrice.packetWeight ?? undefined,
          },
        });
      }
    }
  }
  console.log(`${vegetables.length} vegetables with prices seeded`);

  // ─── 5. Locations (Bangalore neighbourhoods) ────────────────────
  const locations = [
    { name: 'Indiranagar', address: '100 Feet Road, Indiranagar, Bengaluru 560038', latitude: 12.9784, longitude: 77.6408 },
    { name: 'Koramangala', address: '80 Feet Road, Koramangala 4th Block, Bengaluru 560034', latitude: 12.9352, longitude: 77.6245 },
    { name: 'HSR Layout', address: '27th Main, HSR Layout Sector 1, Bengaluru 560102', latitude: 12.9116, longitude: 77.6389 },
    { name: 'Jayanagar', address: '11th Main Road, Jayanagar 4th Block, Bengaluru 560011', latitude: 12.9308, longitude: 77.5838 },
    { name: 'Whitefield', address: 'ITPL Main Road, Whitefield, Bengaluru 560066', latitude: 12.9698, longitude: 77.7500 },
    { name: 'Malleshwaram', address: 'Sampige Road, Malleshwaram, Bengaluru 560003', latitude: 12.9969, longitude: 77.5707 },
    { name: 'JP Nagar', address: '15th Cross, JP Nagar 6th Phase, Bengaluru 560078', latitude: 12.9074, longitude: 77.5855 },
    { name: 'Yelahanka', address: 'Main Road, Yelahanka New Town, Bengaluru 560064', latitude: 13.1005, longitude: 77.5963 },
    { name: 'Basavanagudi', address: 'Gandhi Bazaar Main Road, Basavanagudi, Bengaluru 560004', latitude: 12.9430, longitude: 77.5757 },
    { name: 'Electronic City', address: 'Phase 1, Electronic City, Bengaluru 560100', latitude: 12.8440, longitude: 77.6568 },
  ];

  const locationMap: Record<string, string> = {};
  for (const loc of locations) {
    const created = await prisma.location.upsert({
      where: { name: loc.name },
      update: { address: loc.address, latitude: loc.latitude, longitude: loc.longitude },
      create: loc,
    });
    locationMap[loc.name] = created.id;
  }
  console.log('10 Bangalore locations seeded');

  // ─── 6. Refrigerators (2 per location = 20 fridges) ────────────
  const fridges: { locationName: string; name: string; status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' }[] = [
    { locationName: 'Indiranagar', name: 'Indiranagar - 12th Main', status: 'ACTIVE' },
    { locationName: 'Indiranagar', name: 'Indiranagar - CMH Road', status: 'ACTIVE' },
    { locationName: 'Koramangala', name: 'Koramangala - 4th Block', status: 'ACTIVE' },
    { locationName: 'Koramangala', name: 'Koramangala - 6th Block', status: 'ACTIVE' },
    { locationName: 'HSR Layout', name: 'HSR - Sector 1', status: 'ACTIVE' },
    { locationName: 'HSR Layout', name: 'HSR - Sector 7', status: 'ACTIVE' },
    { locationName: 'Jayanagar', name: 'Jayanagar - 4th Block', status: 'ACTIVE' },
    { locationName: 'Jayanagar', name: 'Jayanagar - 9th Block', status: 'MAINTENANCE' },
    { locationName: 'Whitefield', name: 'Whitefield - ITPL Gate', status: 'ACTIVE' },
    { locationName: 'Whitefield', name: 'Whitefield - Varthur Road', status: 'ACTIVE' },
    { locationName: 'Malleshwaram', name: 'Malleshwaram - 8th Cross', status: 'ACTIVE' },
    { locationName: 'Malleshwaram', name: 'Malleshwaram - Margosa Road', status: 'ACTIVE' },
    { locationName: 'JP Nagar', name: 'JP Nagar - 6th Phase', status: 'ACTIVE' },
    { locationName: 'JP Nagar', name: 'JP Nagar - 2nd Phase', status: 'INACTIVE' },
    { locationName: 'Yelahanka', name: 'Yelahanka - New Town', status: 'ACTIVE' },
    { locationName: 'Yelahanka', name: 'Yelahanka - Sahakara Nagar', status: 'ACTIVE' },
    { locationName: 'Basavanagudi', name: 'Basavanagudi - Gandhi Bazaar', status: 'ACTIVE' },
    { locationName: 'Basavanagudi', name: 'Basavanagudi - DVG Road', status: 'ACTIVE' },
    { locationName: 'Electronic City', name: 'E-City - Phase 1', status: 'ACTIVE' },
    { locationName: 'Electronic City', name: 'E-City - Phase 2', status: 'ACTIVE' },
  ];

  const fridgeMap: Record<string, string> = {};
  for (const f of fridges) {
    const locationId = locationMap[f.locationName];
    const existing = await prisma.refrigerator.findFirst({
      where: { name: f.name, locationId },
    });
    if (!existing) {
      const created = await prisma.refrigerator.create({
        data: { name: f.name, locationId, status: f.status },
      });
      fridgeMap[f.name] = created.id;
    } else {
      fridgeMap[f.name] = existing.id;
    }
  }
  console.log('20 refrigerators seeded');

  // ─── 7. Producer-Fridge Assignments ─────────────────────────────
  // Ravi Kumar handles Indiranagar + Koramangala + HSR (6 fridges)
  // Suresh Gowda handles Jayanagar + Whitefield + Malleshwaram (5 active fridges)
  const producerAssignments = [
    { email: 'ravi@sampadagreen.com', fridges: ['Indiranagar - 12th Main', 'Indiranagar - CMH Road', 'Koramangala - 4th Block', 'Koramangala - 6th Block', 'HSR - Sector 1', 'HSR - Sector 7'] },
    { email: 'suresh@sampadagreen.com', fridges: ['Jayanagar - 4th Block', 'Whitefield - ITPL Gate', 'Whitefield - Varthur Road', 'Malleshwaram - 8th Cross', 'Malleshwaram - Margosa Road'] },
  ];

  const existingAssignments = await prisma.producerFridgeAssignment.count();
  if (existingAssignments === 0) {
    for (const pa of producerAssignments) {
      const staffId = staffMap[pa.email];
      for (const fridgeName of pa.fridges) {
        const fridgeId = fridgeMap[fridgeName];
        if (staffId && fridgeId) {
          await prisma.producerFridgeAssignment.create({
            data: { staffUserId: staffId, refrigeratorId: fridgeId },
          });
        }
      }
    }
    console.log('Producer-fridge assignments seeded');
  }

  // ─── 8. Fridge Inventory ────────────────────────────────────────
  // Stock the active fridges with a mix of vegetables
  const existingInventory = await prisma.refrigeratorInventory.count();
  if (existingInventory === 0) {
    const fridgeInventoryDefs: { fridgeName: string; items: { vegName: string; qty: number; minThreshold: number }[] }[] = [
      {
        fridgeName: 'Indiranagar - 12th Main',
        items: [
          { vegName: 'Tomato', qty: 8, minThreshold: 3 },
          { vegName: 'Onion', qty: 10, minThreshold: 3 },
          { vegName: 'Potato', qty: 12, minThreshold: 5 },
          { vegName: 'Spinach', qty: 4, minThreshold: 2 },
          { vegName: 'Coriander', qty: 2, minThreshold: 1 },
          { vegName: 'Green Chili', qty: 1.5, minThreshold: 1 },
          { vegName: 'Carrot', qty: 5, minThreshold: 2 },
          { vegName: 'Cucumber', qty: 6, minThreshold: 2 },
        ],
      },
      {
        fridgeName: 'Indiranagar - CMH Road',
        items: [
          { vegName: 'Tomato', qty: 5, minThreshold: 3 },
          { vegName: 'Onion', qty: 7, minThreshold: 3 },
          { vegName: 'Potato', qty: 8, minThreshold: 4 },
          { vegName: 'Brinjal', qty: 3, minThreshold: 2 },
          { vegName: 'Lady Finger', qty: 2, minThreshold: 2 },
          { vegName: 'Capsicum', qty: 3, minThreshold: 1 },
        ],
      },
      {
        fridgeName: 'Koramangala - 4th Block',
        items: [
          { vegName: 'Tomato', qty: 10, minThreshold: 3 },
          { vegName: 'Onion', qty: 8, minThreshold: 3 },
          { vegName: 'Potato', qty: 15, minThreshold: 5 },
          { vegName: 'Spinach', qty: 3, minThreshold: 2 },
          { vegName: 'Ginger', qty: 1, minThreshold: 0.5 },
          { vegName: 'Garlic', qty: 2, minThreshold: 1 },
          { vegName: 'Broccoli', qty: 2, minThreshold: 1 },
          { vegName: 'Baby Corn', qty: 1.5, minThreshold: 1 },
          { vegName: 'Cucumber', qty: 4, minThreshold: 2 },
        ],
      },
      {
        fridgeName: 'Koramangala - 6th Block',
        items: [
          { vegName: 'Tomato', qty: 6, minThreshold: 3 },
          { vegName: 'Onion', qty: 5, minThreshold: 3 },
          { vegName: 'Carrot', qty: 4, minThreshold: 2 },
          { vegName: 'Beetroot', qty: 3, minThreshold: 2 },
          { vegName: 'Green Peas', qty: 2, minThreshold: 1 },
        ],
      },
      {
        fridgeName: 'HSR - Sector 1',
        items: [
          { vegName: 'Tomato', qty: 7, minThreshold: 3 },
          { vegName: 'Potato', qty: 10, minThreshold: 5 },
          { vegName: 'Capsicum', qty: 4, minThreshold: 2 },
          { vegName: 'Broccoli', qty: 3, minThreshold: 1 },
          { vegName: 'Zucchini', qty: 2, minThreshold: 1 },
          { vegName: 'French Beans', qty: 3, minThreshold: 2 },
          { vegName: 'Carrot', qty: 5, minThreshold: 2 },
        ],
      },
      {
        fridgeName: 'HSR - Sector 7',
        items: [
          { vegName: 'Tomato', qty: 4, minThreshold: 3 },
          { vegName: 'Onion', qty: 6, minThreshold: 3 },
          { vegName: 'Bitter Gourd', qty: 1.5, minThreshold: 2 }, // low stock!
          { vegName: 'Bottle Gourd', qty: 3, minThreshold: 2 },
          { vegName: 'Ridge Gourd', qty: 2, minThreshold: 2 },
        ],
      },
      {
        fridgeName: 'Jayanagar - 4th Block',
        items: [
          { vegName: 'Tomato', qty: 9, minThreshold: 3 },
          { vegName: 'Onion', qty: 8, minThreshold: 3 },
          { vegName: 'Potato', qty: 12, minThreshold: 5 },
          { vegName: 'Coriander', qty: 1.5, minThreshold: 1 },
          { vegName: 'Curry Leaves', qty: 0.5, minThreshold: 0.5 }, // low stock!
          { vegName: 'Drumstick', qty: 3, minThreshold: 2 },
          { vegName: 'Brinjal', qty: 4, minThreshold: 2 },
          { vegName: 'Green Chili', qty: 1, minThreshold: 1 }, // low stock!
        ],
      },
      {
        fridgeName: 'Whitefield - ITPL Gate',
        items: [
          { vegName: 'Tomato', qty: 6, minThreshold: 3 },
          { vegName: 'Onion', qty: 5, minThreshold: 3 },
          { vegName: 'Potato', qty: 8, minThreshold: 4 },
          { vegName: 'French Beans', qty: 2, minThreshold: 2 },
          { vegName: 'Lady Finger', qty: 3, minThreshold: 2 },
        ],
      },
      {
        fridgeName: 'Whitefield - Varthur Road',
        items: [
          { vegName: 'Tomato', qty: 5, minThreshold: 3 },
          { vegName: 'Onion', qty: 4, minThreshold: 3 },
          { vegName: 'Mustard Greens', qty: 2, minThreshold: 1 },
          { vegName: 'Fenugreek', qty: 1.5, minThreshold: 1 },
          { vegName: 'Spinach', qty: 2, minThreshold: 2 },
        ],
      },
      {
        fridgeName: 'Malleshwaram - 8th Cross',
        items: [
          { vegName: 'Tomato', qty: 8, minThreshold: 3 },
          { vegName: 'Drumstick', qty: 4, minThreshold: 2 },
          { vegName: 'Brinjal', qty: 5, minThreshold: 2 },
          { vegName: 'Curry Leaves', qty: 1, minThreshold: 0.5 },
          { vegName: 'Coriander', qty: 2, minThreshold: 1 },
          { vegName: 'Amaranth Leaves', qty: 2, minThreshold: 1 },
        ],
      },
      {
        fridgeName: 'Malleshwaram - Margosa Road',
        items: [
          { vegName: 'Tomato', qty: 4, minThreshold: 3 },
          { vegName: 'Onion', qty: 3, minThreshold: 3 }, // at threshold
          { vegName: 'Potato', qty: 6, minThreshold: 4 },
          { vegName: 'Ginger', qty: 0.8, minThreshold: 0.5 },
          { vegName: 'Garlic', qty: 1, minThreshold: 1 }, // at threshold
        ],
      },
      // Unassigned fridges (no producer) — will show as critical
      {
        fridgeName: 'JP Nagar - 6th Phase',
        items: [
          { vegName: 'Tomato', qty: 3, minThreshold: 3 },
          { vegName: 'Onion', qty: 2, minThreshold: 3 }, // low!
          { vegName: 'Potato', qty: 4, minThreshold: 4 },
        ],
      },
      {
        fridgeName: 'Yelahanka - New Town',
        items: [
          { vegName: 'Tomato', qty: 5, minThreshold: 3 },
          { vegName: 'Potato', qty: 7, minThreshold: 4 },
          { vegName: 'Onion', qty: 4, minThreshold: 3 },
        ],
      },
      {
        fridgeName: 'Yelahanka - Sahakara Nagar',
        items: [
          { vegName: 'Tomato', qty: 3, minThreshold: 3 },
          { vegName: 'Spinach', qty: 1, minThreshold: 2 }, // low!
        ],
      },
      {
        fridgeName: 'Basavanagudi - Gandhi Bazaar',
        items: [
          { vegName: 'Tomato', qty: 6, minThreshold: 3 },
          { vegName: 'Onion', qty: 5, minThreshold: 3 },
          { vegName: 'Ginger', qty: 1, minThreshold: 0.5 },
          { vegName: 'Garlic', qty: 1.5, minThreshold: 1 },
          { vegName: 'Green Chili', qty: 0.8, minThreshold: 1 }, // low!
        ],
      },
      {
        fridgeName: 'Basavanagudi - DVG Road',
        items: [
          { vegName: 'Capsicum', qty: 3, minThreshold: 2 },
          { vegName: 'Broccoli', qty: 1.5, minThreshold: 1 },
          { vegName: 'Pumpkin', qty: 4, minThreshold: 2 },
        ],
      },
      {
        fridgeName: 'E-City - Phase 1',
        items: [
          { vegName: 'Tomato', qty: 5, minThreshold: 3 },
          { vegName: 'Potato', qty: 8, minThreshold: 4 },
          { vegName: 'Onion', qty: 6, minThreshold: 3 },
          { vegName: 'Carrot', qty: 3, minThreshold: 2 },
        ],
      },
      {
        fridgeName: 'E-City - Phase 2',
        items: [
          { vegName: 'Tomato', qty: 4, minThreshold: 3 },
          { vegName: 'Onion', qty: 3, minThreshold: 3 },
          { vegName: 'Cucumber', qty: 2, minThreshold: 2 },
        ],
      },
    ];

    for (const fDef of fridgeInventoryDefs) {
      const fridgeId = fridgeMap[fDef.fridgeName];
      if (!fridgeId) continue;
      for (const item of fDef.items) {
        const vegId = vegMap[item.vegName];
        if (!vegId) continue;
        await prisma.refrigeratorInventory.create({
          data: {
            refrigeratorId: fridgeId,
            vegetableId: vegId,
            quantityAvailable: item.qty,
            minimumThreshold: item.minThreshold,
          },
        });
      }
    }
    console.log('Fridge inventory seeded');
  }

  // ─── 9. Customers (Bangalore residents) ─────────────────────────
  const customers = [
    { phone: '9900100001', name: 'Priya Sharma', address: '42, 12th Main, Indiranagar, Bengaluru' },
    { phone: '9900100002', name: 'Arun Kumar', address: '15, 80 Feet Road, Koramangala, Bengaluru' },
    { phone: '9900100003', name: 'Lakshmi Devi', address: '88, HSR Layout Sector 2, Bengaluru' },
    { phone: '9900100004', name: 'Rajesh Gowda', address: '23, Jayanagar 3rd Block, Bengaluru' },
    { phone: '9900100005', name: 'Sneha Patil', address: '67, Whitefield Main Road, Bengaluru' },
    { phone: '9900100006', name: 'Kiran Hegde', address: '11, Sampige Road, Malleshwaram, Bengaluru' },
    { phone: '9900100007', name: 'Deepa Rao', address: '34, JP Nagar 5th Phase, Bengaluru' },
    { phone: '9900100008', name: 'Mohan Reddy', address: '9, Yelahanka New Town, Bengaluru' },
    { phone: '9900100009', name: 'Asha Bhat', address: '56, Gandhi Bazaar, Basavanagudi, Bengaluru' },
    { phone: '9900100010', name: 'Vinay Shetty', address: '78, Electronic City Phase 1, Bengaluru' },
    { phone: '9900100011', name: 'Kavitha Nair', address: '19, CMH Road, Indiranagar, Bengaluru' },
    { phone: '9900100012', name: 'Sunil Joshi', address: '45, 5th Block, Koramangala, Bengaluru' },
    { phone: '9900100013', name: 'Meena Kulkarni', address: '71, Sector 3, HSR Layout, Bengaluru' },
    { phone: '9900100014', name: 'Ganesh Iyengar', address: '28, 11th Main, Jayanagar, Bengaluru' },
    { phone: '9900100015', name: 'Anitha Murthy', address: '63, Margosa Road, Malleshwaram, Bengaluru' },
    { phone: '9900100016', name: 'Ramesh Naik', address: '5, 15th Cross, JP Nagar, Bengaluru' },
    { phone: '9900100017', name: 'Shilpa Desai', address: '91, DVG Road, Basavanagudi, Bengaluru' },
    { phone: '9900100018', name: 'Harish Acharya', address: '17, Sahakara Nagar, Yelahanka, Bengaluru' },
    { phone: '9900100019', name: 'Divya Hegde', address: '82, Varthur Road, Whitefield, Bengaluru' },
    { phone: '9900100020', name: 'Naveen Prasad', address: '36, Phase 2, Electronic City, Bengaluru' },
  ];

  const customerMap: Record<string, string> = {};
  for (const c of customers) {
    const created = await prisma.customer.upsert({
      where: { phone: c.phone },
      update: { name: c.name, address: c.address },
      create: c,
    });
    customerMap[c.phone] = created.id;
  }
  console.log('20 customers seeded');

  // ─── 10. Fridge Pickup Orders ───────────────────────────────────
  async function getVegPrice(vegetableId: string) {
    return prisma.price.findFirst({
      where: { vegetableId },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  function daysAgo(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(Math.floor(Math.random() * 12) + 7, Math.floor(Math.random() * 60), 0, 0);
    return d;
  }

  function hoursAgo(n: number): Date {
    return new Date(Date.now() - n * 60 * 60 * 1000);
  }

  const existingOrderCount = await prisma.fridgePickupOrder.count();
  if (existingOrderCount > 0) {
    console.log(`Skipping orders — ${existingOrderCount} already exist`);
  } else {
    const raviId = staffMap['ravi@sampadagreen.com'];
    const sureshId = staffMap['suresh@sampadagreen.com'];

    // Orders with diverse statuses — including today's CONFIRMED/READY
    const orderDefs: {
      customerPhone: string;
      fridgeName: string;
      daysBack: number;
      hoursBack?: number; // for today's recent orders
      status: 'PENDING' | 'CONFIRMED' | 'READY' | 'PICKED_UP' | 'CANCELLED';
      paymentStatus: 'UNPAID' | 'PAID' | 'PARTIAL';
      assignedToId?: string;
      confirmedAt?: Date;
      readyAt?: Date;
      pickedUpAt?: Date;
      items: { vegName: string; qty: number; unit: 'KG' | 'GRAM' | 'PIECE' | 'BUNCH' | 'PACKET' }[];
    }[] = [
      // ─── TODAY: Mix of all statuses ────────────────────────
      // PICKED_UP earlier today (revenue!)
      { customerPhone: '9900100011', fridgeName: 'Indiranagar - CMH Road', daysBack: 0, hoursBack: 6, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: raviId, confirmedAt: hoursAgo(5), readyAt: hoursAgo(4.5), pickedUpAt: hoursAgo(4),
        items: [{ vegName: 'Tomato', qty: 2, unit: 'KG' }, { vegName: 'Onion', qty: 1.5, unit: 'KG' }, { vegName: 'Potato', qty: 3, unit: 'KG' }] },
      { customerPhone: '9900100012', fridgeName: 'Koramangala - 4th Block', daysBack: 0, hoursBack: 5, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: raviId, confirmedAt: hoursAgo(4), readyAt: hoursAgo(3.5), pickedUpAt: hoursAgo(3),
        items: [{ vegName: 'Broccoli', qty: 1, unit: 'PIECE' }, { vegName: 'Baby Corn', qty: 2, unit: 'PACKET' }, { vegName: 'Capsicum', qty: 500, unit: 'GRAM' }] },
      { customerPhone: '9900100014', fridgeName: 'Jayanagar - 4th Block', daysBack: 0, hoursBack: 4, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: sureshId, confirmedAt: hoursAgo(3.5), readyAt: hoursAgo(3), pickedUpAt: hoursAgo(2),
        items: [{ vegName: 'Drumstick', qty: 6, unit: 'PIECE' }, { vegName: 'Coriander', qty: 2, unit: 'BUNCH' }, { vegName: 'Curry Leaves', qty: 1, unit: 'BUNCH' }] },

      // READY today (confirmed earlier, now ready for pickup)
      { customerPhone: '9900100001', fridgeName: 'Indiranagar - 12th Main', daysBack: 0, hoursBack: 3, status: 'READY', paymentStatus: 'UNPAID',
        assignedToId: raviId, confirmedAt: hoursAgo(2.5), readyAt: hoursAgo(1.5),
        items: [{ vegName: 'Tomato', qty: 2, unit: 'KG' }, { vegName: 'Onion', qty: 1, unit: 'KG' }, { vegName: 'Green Chili', qty: 1, unit: 'PACKET' }] },
      { customerPhone: '9900100005', fridgeName: 'Whitefield - ITPL Gate', daysBack: 0, hoursBack: 2.5, status: 'READY', paymentStatus: 'UNPAID',
        assignedToId: sureshId, confirmedAt: hoursAgo(2), readyAt: hoursAgo(1),
        items: [{ vegName: 'French Beans', qty: 1, unit: 'PACKET' }, { vegName: 'Lady Finger', qty: 1, unit: 'KG' }] },

      // CONFIRMED today (producer accepted, preparing)
      { customerPhone: '9900100002', fridgeName: 'Koramangala - 4th Block', daysBack: 0, hoursBack: 2, status: 'CONFIRMED', paymentStatus: 'UNPAID',
        assignedToId: raviId, confirmedAt: hoursAgo(1.5),
        items: [{ vegName: 'Spinach', qty: 2, unit: 'BUNCH' }, { vegName: 'Potato', qty: 3, unit: 'KG' }] },
      { customerPhone: '9900100006', fridgeName: 'Malleshwaram - 8th Cross', daysBack: 0, hoursBack: 1.5, status: 'CONFIRMED', paymentStatus: 'UNPAID',
        assignedToId: sureshId, confirmedAt: hoursAgo(1),
        items: [{ vegName: 'Drumstick', qty: 4, unit: 'PIECE' }, { vegName: 'Brinjal', qty: 1, unit: 'KG' }] },

      // PENDING today (waiting for producer)
      { customerPhone: '9900100003', fridgeName: 'HSR - Sector 1', daysBack: 0, hoursBack: 1, status: 'PENDING', paymentStatus: 'UNPAID',
        items: [{ vegName: 'Broccoli', qty: 1, unit: 'PIECE' }, { vegName: 'Capsicum', qty: 500, unit: 'GRAM' }, { vegName: 'Carrot', qty: 1, unit: 'KG' }] },
      { customerPhone: '9900100009', fridgeName: 'Basavanagudi - Gandhi Bazaar', daysBack: 0, hoursBack: 0.5, status: 'PENDING', paymentStatus: 'UNPAID',
        items: [{ vegName: 'Ginger', qty: 250, unit: 'GRAM' }, { vegName: 'Garlic', qty: 500, unit: 'GRAM' }, { vegName: 'Green Chili', qty: 1, unit: 'PACKET' }] },
      { customerPhone: '9900100010', fridgeName: 'E-City - Phase 1', daysBack: 0, hoursBack: 0.3, status: 'PENDING', paymentStatus: 'UNPAID',
        items: [{ vegName: 'Potato', qty: 2, unit: 'KG' }, { vegName: 'Tomato', qty: 1, unit: 'KG' }] },

      // ─── YESTERDAY ─────────────────────────────────────────
      { customerPhone: '9900100004', fridgeName: 'Jayanagar - 4th Block', daysBack: 1, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: sureshId, confirmedAt: daysAgo(1), readyAt: daysAgo(1), pickedUpAt: daysAgo(1),
        items: [{ vegName: 'Coriander', qty: 2, unit: 'BUNCH' }, { vegName: 'Ginger', qty: 250, unit: 'GRAM' }, { vegName: 'Garlic', qty: 500, unit: 'GRAM' }] },
      { customerPhone: '9900100005', fridgeName: 'Whitefield - ITPL Gate', daysBack: 1, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: sureshId, confirmedAt: daysAgo(1), readyAt: daysAgo(1), pickedUpAt: daysAgo(1),
        items: [{ vegName: 'French Beans', qty: 1, unit: 'PACKET' }, { vegName: 'Lady Finger', qty: 500, unit: 'GRAM' }] },
      { customerPhone: '9900100015', fridgeName: 'Malleshwaram - Margosa Road', daysBack: 1, status: 'PENDING', paymentStatus: 'UNPAID',
        items: [{ vegName: 'Amaranth Leaves', qty: 2, unit: 'BUNCH' }, { vegName: 'Spinach', qty: 1, unit: 'BUNCH' }] },

      // ─── 2 DAYS AGO ────────────────────────────────────────
      { customerPhone: '9900100007', fridgeName: 'JP Nagar - 6th Phase', daysBack: 2, status: 'PICKED_UP', paymentStatus: 'PAID',
        items: [{ vegName: 'Tomato', qty: 1, unit: 'KG' }, { vegName: 'Cucumber', qty: 2, unit: 'KG' }, { vegName: 'Onion', qty: 2, unit: 'KG' }] },
      { customerPhone: '9900100008', fridgeName: 'Yelahanka - New Town', daysBack: 2, status: 'PICKED_UP', paymentStatus: 'PAID',
        items: [{ vegName: 'Pumpkin', qty: 1, unit: 'KG' }, { vegName: 'Ridge Gourd', qty: 500, unit: 'GRAM' }] },
      { customerPhone: '9900100009', fridgeName: 'Basavanagudi - Gandhi Bazaar', daysBack: 2, status: 'CANCELLED', paymentStatus: 'UNPAID',
        items: [{ vegName: 'Spinach', qty: 1, unit: 'BUNCH' }, { vegName: 'Fenugreek', qty: 1, unit: 'BUNCH' }] },

      // ─── 3 DAYS AGO ────────────────────────────────────────
      { customerPhone: '9900100010', fridgeName: 'E-City - Phase 1', daysBack: 3, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: raviId,
        items: [{ vegName: 'Potato', qty: 5, unit: 'KG' }, { vegName: 'Onion', qty: 3, unit: 'KG' }, { vegName: 'Tomato', qty: 2, unit: 'KG' }] },
      { customerPhone: '9900100011', fridgeName: 'Indiranagar - CMH Road', daysBack: 3, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: raviId,
        items: [{ vegName: 'Baby Corn', qty: 2, unit: 'PACKET' }, { vegName: 'Zucchini', qty: 500, unit: 'GRAM' }, { vegName: 'Broccoli', qty: 1, unit: 'PIECE' }] },
      { customerPhone: '9900100012', fridgeName: 'Koramangala - 6th Block', daysBack: 3, status: 'PICKED_UP', paymentStatus: 'PARTIAL',
        assignedToId: raviId,
        items: [{ vegName: 'Green Peas', qty: 1, unit: 'PACKET' }, { vegName: 'Carrot', qty: 1, unit: 'KG' }, { vegName: 'Beetroot', qty: 500, unit: 'GRAM' }] },

      // ─── 4-7 DAYS AGO ──────────────────────────────────────
      { customerPhone: '9900100013', fridgeName: 'HSR - Sector 7', daysBack: 4, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: raviId,
        items: [{ vegName: 'Bitter Gourd', qty: 500, unit: 'GRAM' }, { vegName: 'Bottle Gourd', qty: 1, unit: 'PIECE' }] },
      { customerPhone: '9900100014', fridgeName: 'Jayanagar - 4th Block', daysBack: 4, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: sureshId,
        items: [{ vegName: 'Curry Leaves', qty: 2, unit: 'BUNCH' }, { vegName: 'Coriander', qty: 1, unit: 'BUNCH' }, { vegName: 'Green Chili', qty: 1, unit: 'PACKET' }] },
      { customerPhone: '9900100001', fridgeName: 'Indiranagar - 12th Main', daysBack: 5, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: raviId,
        items: [{ vegName: 'Potato', qty: 2, unit: 'KG' }, { vegName: 'Tomato', qty: 1, unit: 'KG' }, { vegName: 'Onion', qty: 2, unit: 'KG' }, { vegName: 'Garlic', qty: 250, unit: 'GRAM' }] },
      { customerPhone: '9900100016', fridgeName: 'JP Nagar - 6th Phase', daysBack: 6, status: 'PICKED_UP', paymentStatus: 'PAID',
        items: [{ vegName: 'Cluster Beans', qty: 500, unit: 'GRAM' }, { vegName: 'Broad Beans', qty: 500, unit: 'GRAM' }] },
      { customerPhone: '9900100017', fridgeName: 'Basavanagudi - DVG Road', daysBack: 6, status: 'CANCELLED', paymentStatus: 'UNPAID',
        items: [{ vegName: 'Capsicum', qty: 1, unit: 'KG' }] },
      { customerPhone: '9900100018', fridgeName: 'Yelahanka - Sahakara Nagar', daysBack: 7, status: 'PICKED_UP', paymentStatus: 'PAID',
        items: [{ vegName: 'Ash Gourd', qty: 1, unit: 'PIECE' }, { vegName: 'Pumpkin', qty: 2, unit: 'KG' }] },
      { customerPhone: '9900100002', fridgeName: 'Koramangala - 4th Block', daysBack: 7, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: raviId,
        items: [{ vegName: 'Radish', qty: 2, unit: 'PIECE' }, { vegName: 'Beetroot', qty: 1, unit: 'KG' }] },

      // ─── 8-14 DAYS AGO ─────────────────────────────────────
      { customerPhone: '9900100019', fridgeName: 'Whitefield - Varthur Road', daysBack: 8, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: sureshId,
        items: [{ vegName: 'Mustard Greens', qty: 1, unit: 'BUNCH' }, { vegName: 'Fenugreek', qty: 1, unit: 'BUNCH' }, { vegName: 'Spinach', qty: 1, unit: 'BUNCH' }] },
      { customerPhone: '9900100020', fridgeName: 'E-City - Phase 2', daysBack: 9, status: 'PICKED_UP', paymentStatus: 'PAID',
        items: [{ vegName: 'Tomato', qty: 3, unit: 'KG' }, { vegName: 'Green Chili', qty: 1, unit: 'PACKET' }, { vegName: 'Cucumber', qty: 1, unit: 'KG' }] },
      { customerPhone: '9900100003', fridgeName: 'HSR - Sector 1', daysBack: 10, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: raviId,
        items: [{ vegName: 'French Beans', qty: 1, unit: 'PACKET' }, { vegName: 'Lady Finger', qty: 1, unit: 'KG' }, { vegName: 'Brinjal', qty: 500, unit: 'GRAM' }] },
      { customerPhone: '9900100004', fridgeName: 'Jayanagar - 4th Block', daysBack: 11, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: sureshId,
        items: [{ vegName: 'Potato', qty: 3, unit: 'KG' }, { vegName: 'Onion', qty: 2, unit: 'KG' }] },
      { customerPhone: '9900100006', fridgeName: 'Malleshwaram - 8th Cross', daysBack: 11, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: sureshId,
        items: [{ vegName: 'Drumstick', qty: 6, unit: 'PIECE' }, { vegName: 'Curry Leaves', qty: 3, unit: 'BUNCH' }] },
      { customerPhone: '9900100009', fridgeName: 'Basavanagudi - Gandhi Bazaar', daysBack: 12, status: 'PICKED_UP', paymentStatus: 'PAID',
        items: [{ vegName: 'Ginger', qty: 500, unit: 'GRAM' }, { vegName: 'Garlic', qty: 500, unit: 'GRAM' }, { vegName: 'Green Chili', qty: 1, unit: 'PACKET' }] },
      { customerPhone: '9900100010', fridgeName: 'E-City - Phase 1', daysBack: 13, status: 'PICKED_UP', paymentStatus: 'PAID',
        items: [{ vegName: 'Capsicum', qty: 500, unit: 'GRAM' }, { vegName: 'Baby Corn', qty: 1, unit: 'PACKET' }] },
      { customerPhone: '9900100014', fridgeName: 'Jayanagar - 4th Block', daysBack: 13, status: 'CANCELLED', paymentStatus: 'UNPAID',
        items: [{ vegName: 'Broccoli', qty: 2, unit: 'PIECE' }] },
      { customerPhone: '9900100005', fridgeName: 'Whitefield - ITPL Gate', daysBack: 14, status: 'PICKED_UP', paymentStatus: 'PAID',
        assignedToId: sureshId,
        items: [{ vegName: 'Tomato', qty: 2, unit: 'KG' }, { vegName: 'Potato', qty: 2, unit: 'KG' }, { vegName: 'Carrot', qty: 1, unit: 'KG' }, { vegName: 'Onion', qty: 1, unit: 'KG' }] },
    ];

    let orderSeq = 1;
    for (const def of orderDefs) {
      const customerId = customerMap[def.customerPhone];
      const refrigeratorId = fridgeMap[def.fridgeName];

      let createdAt: Date;
      if (def.hoursBack !== undefined) {
        createdAt = hoursAgo(def.hoursBack);
      } else {
        createdAt = daysAgo(def.daysBack);
      }

      const dateStr = createdAt.toISOString().slice(0, 10).replace(/-/g, '');
      const orderNumber = `FP-${dateStr}-${orderSeq.toString().padStart(3, '0')}`;
      orderSeq++;

      // Build items with prices
      const itemsData: { vegetableId: string; quantity: number; unit: 'KG' | 'GRAM' | 'PIECE' | 'BUNCH' | 'PACKET'; unitPrice: number; totalPrice: number }[] = [];
      let totalAmount = 0;

      for (const item of def.items) {
        const vegetableId = vegMap[item.vegName];
        const price = await getVegPrice(vegetableId);
        if (!price) continue;

        let unitPrice = 0;
        switch (item.unit) {
          case 'KG':
            unitPrice = Number(price.pricePerKg ?? 0);
            break;
          case 'GRAM':
            unitPrice = Number(price.pricePerKg ?? 0) / 1000;
            break;
          case 'PIECE':
            unitPrice = Number(price.pricePerPiece ?? 0);
            break;
          case 'BUNCH':
            unitPrice = Number(price.pricePerBunch ?? 0);
            break;
          case 'PACKET':
            unitPrice = Number(price.pricePerPacket ?? 0);
            break;
        }

        const lineTotal = Math.round(unitPrice * item.qty * 100) / 100;
        totalAmount += lineTotal;

        itemsData.push({
          vegetableId,
          quantity: item.qty,
          unit: item.unit,
          unitPrice,
          totalPrice: lineTotal,
        });
      }

      const paidAmount = def.paymentStatus === 'PAID' ? totalAmount
        : def.paymentStatus === 'PARTIAL' ? Math.round(totalAmount * 0.5 * 100) / 100
        : 0;

      const order = await prisma.fridgePickupOrder.create({
        data: {
          orderNumber,
          customerId,
          refrigeratorId,
          status: def.status,
          totalAmount,
          paidAmount,
          paymentStatus: def.paymentStatus,
          assignedToId: def.assignedToId ?? null,
          confirmedAt: def.confirmedAt ?? null,
          readyAt: def.readyAt ?? null,
          pickedUpAt: def.pickedUpAt ?? null,
          cancelledAt: def.status === 'CANCELLED' ? createdAt : null,
          createdAt,
          items: {
            create: itemsData,
          },
        },
      });

      // Create payment records for paid/partial orders
      if (paidAmount > 0) {
        await prisma.payment.create({
          data: {
            fridgePickupOrderId: order.id,
            amount: paidAmount,
            method: Math.random() > 0.5 ? 'UPI' : 'CASH',
            reference: Math.random() > 0.5 ? `UPI${Math.floor(Math.random() * 900000 + 100000)}` : null,
            loggedById: admin.id,
            receivedAt: createdAt,
          },
        });
      }
    }
    console.log(`${orderDefs.length} fridge pickup orders with items & payments seeded`);
  }

  // ─── 11. Favorites ─────────────────────────────────────────────
  const existingFavs = await prisma.favorite.count();
  if (existingFavs === 0) {
    const favDefs = [
      { phone: '9900100001', vegs: ['Tomato', 'Spinach', 'Coriander'] },
      { phone: '9900100002', vegs: ['Potato', 'Onion', 'Spinach'] },
      { phone: '9900100004', vegs: ['Coriander', 'Ginger', 'Garlic', 'Curry Leaves'] },
      { phone: '9900100006', vegs: ['Drumstick', 'Brinjal', 'Curry Leaves'] },
      { phone: '9900100009', vegs: ['Ginger', 'Garlic', 'Green Chili'] },
      { phone: '9900100011', vegs: ['Broccoli', 'Baby Corn', 'Zucchini', 'Capsicum'] },
      { phone: '9900100015', vegs: ['Amaranth Leaves', 'Spinach', 'Fenugreek'] },
    ];

    for (const fav of favDefs) {
      const customerId = customerMap[fav.phone];
      for (const vegName of fav.vegs) {
        const vegetableId = vegMap[vegName];
        if (customerId && vegetableId) {
          await prisma.favorite.create({
            data: { customerId, vegetableId },
          });
        }
      }
    }
    console.log('Customer favorites seeded');
  }

  // ─── 12. Inventory Logs ─────────────────────────────────────────
  const existingLogs = await prisma.inventoryLog.count();
  if (existingLogs === 0) {
    const restockVegs = ['Tomato', 'Potato', 'Onion', 'Spinach', 'Carrot', 'Broccoli', 'Capsicum', 'Green Chili', 'Ginger', 'Garlic'];
    for (const vegName of restockVegs) {
      const vegetableId = vegMap[vegName];
      if (vegetableId) {
        await prisma.inventoryLog.create({
          data: {
            vegetableId,
            changeType: 'RESTOCK',
            quantity: 50,
            notes: 'Initial stock from Sampada Green farm',
          },
        });
      }
    }
    console.log('Inventory logs seeded');
  }

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
