import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function initializeDatabase() {
  try {
    console.log('Initializing database with Prisma...');
    
    // Check if admin user exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!existingAdmin) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash('zebulon2025', 10);
      
      const adminUser = await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash: hashedPassword,
          codename: 'System Administrator',
          role: 'Administrator',
          theme: 'dark',
          isAdmin: true
        }
      });

      console.log('Default admin user created:', adminUser.username);

      // Create default Zebulon configuration
      await prisma.zebulonConfig.create({
        data: {
          userId: adminUser.id
        }
      });

      console.log('Default Zebulon configuration created');

      // Create initial system status entries
      const components = ['zed-core', 'zeta-core', 'fantasma-firewall', 'oracle-engine', 'security-manager'];
      
      for (const component of components) {
        await prisma.systemStatus.create({
          data: {
            component,
            status: 'active',
            details: `${component} initialized successfully`
          }
        });
      }

      console.log('System status entries created');
    }

    console.log('Database initialization completed');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

// Initialize on import in development
if (process.env.NODE_ENV === 'development') {
  initializeDatabase().catch(console.error);
}