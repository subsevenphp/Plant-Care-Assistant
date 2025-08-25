import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@plantcare.com' },
    update: {},
    create: {
      email: 'demo@plantcare.com',
      password: hashedPassword,
      name: 'Demo User',
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create demo plants
  const demoPlants = [
    {
      name: 'Monstera Deliciosa',
      species: 'Monstera deliciosa',
      notes: 'Beautiful climbing plant with split leaves. Loves bright, indirect light.',
      wateringFrequency: 7, // Every 7 days
      lastWatered: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      name: 'Snake Plant',
      species: 'Sansevieria trifasciata',
      notes: 'Very low maintenance succulent. Perfect for beginners.',
      wateringFrequency: 14, // Every 2 weeks
      lastWatered: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
    {
      name: 'Peace Lily',
      species: 'Spathiphyllum',
      notes: 'Elegant white flowers. Droops when thirsty.',
      wateringFrequency: 5, // Every 5 days
      lastWatered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      name: 'Fiddle Leaf Fig',
      species: 'Ficus lyrata',
      notes: 'Statement plant with large, glossy leaves. Needs consistent care.',
      wateringFrequency: 7, // Every 7 days
      lastWatered: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago (needs water!)
    },
  ];

  for (const plantData of demoPlants) {
    const plant = await prisma.plant.upsert({
      where: {
        id: `${demoUser.id}-${plantData.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        ...plantData,
        userId: demoUser.id,
      },
    });

    console.log('✅ Created plant:', plant.name);

    // Create some demo reminders
    if (plantData.name === 'Fiddle Leaf Fig') {
      // This plant needs watering
      await prisma.reminder.create({
        data: {
          type: 'WATER',
          scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
          isCompleted: false,
          plantId: plant.id,
        },
      });
      console.log('✅ Created water reminder for:', plant.name);
    }

    if (plantData.name === 'Monstera Deliciosa') {
      // Create a fertilize reminder for next week
      await prisma.reminder.create({
        data: {
          type: 'FERTILIZE',
          scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
          isCompleted: false,
          plantId: plant.id,
        },
      });
      console.log('✅ Created fertilize reminder for:', plant.name);
    }
  }

  console.log('🎉 Database seeding completed!');
  console.log('');
  console.log('Demo credentials:');
  console.log('Email: demo@plantcare.com');
  console.log('Password: demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });