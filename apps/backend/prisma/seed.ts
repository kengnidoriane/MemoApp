import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: hashedPassword,
      name: 'Test User',
      emailVerified: true,
      preferences: {
        theme: 'light',
        language: 'en',
        reminderFrequency: '1day',
        notificationsEnabled: true,
        fontSize: 'medium',
      },
    },
  });

  console.log('👤 Created test user:', testUser.email);

  // Create sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-1' },
      update: {},
      create: {
        id: 'cat-1',
        name: 'Programming',
        color: '#3B82F6',
        userId: testUser.id,
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-2' },
      update: {},
      create: {
        id: 'cat-2',
        name: 'Languages',
        color: '#10B981',
        userId: testUser.id,
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-3' },
      update: {},
      create: {
        id: 'cat-3',
        name: 'Science',
        color: '#8B5CF6',
        userId: testUser.id,
      },
    }),
  ]);

  console.log('📁 Created categories:', categories.map(c => c.name).join(', '));

  // Create sample memos
  const memos = await Promise.all([
    prisma.memo.create({
      data: {
        title: 'JavaScript Array Methods',
        content: 'map(), filter(), reduce(), forEach() are essential array methods in JavaScript. map() transforms elements, filter() selects elements, reduce() accumulates values.',
        tags: ['javascript', 'arrays', 'methods'],
        categoryId: categories[0].id,
        userId: testUser.id,
      },
    }),
    prisma.memo.create({
      data: {
        title: 'French Greetings',
        content: 'Bonjour = Hello (formal), Salut = Hi (informal), Bonsoir = Good evening, Au revoir = Goodbye',
        tags: ['french', 'greetings', 'vocabulary'],
        categoryId: categories[1].id,
        userId: testUser.id,
      },
    }),
    prisma.memo.create({
      data: {
        title: 'Photosynthesis Process',
        content: '6CO2 + 6H2O + light energy → C6H12O6 + 6O2. Plants convert carbon dioxide and water into glucose using sunlight.',
        tags: ['biology', 'photosynthesis', 'chemistry'],
        categoryId: categories[2].id,
        userId: testUser.id,
      },
    }),
  ]);

  console.log('📝 Created memos:', memos.map(m => m.title).join(', '));

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });