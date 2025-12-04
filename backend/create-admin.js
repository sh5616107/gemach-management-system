const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const password = 'admin123';
    
    // Delete existing admin if exists
    await prisma.user.deleteMany({
      where: { username: 'admin' }
    });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('\n🔄 Creating admin user...');
    
    // Create admin user
    const user = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        fullName: 'מנהל ראשי',
        role: 'admin',
      },
    });
    
    console.log('✅ Admin user created successfully!');
    console.log(`   Username: admin`);
    console.log(`   Password: ${password}`);
    
    // Create initial settings
    console.log('\n🔄 Creating initial settings...');
    const settings = await prisma.settings.create({
      data: {
        gemachName: 'גמ"ח שלי',
        headerTitle: 'גמ"ח שלי',
        footerText: 'כל הזכויות שמורות',
        contactText: '02-1234567',
      },
    });
    
    console.log('✅ Settings created successfully!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2002') {
      console.log('\n⚠️  Admin user already exists!');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
