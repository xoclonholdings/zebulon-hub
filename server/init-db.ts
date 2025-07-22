import { db } from "./db";
import { users, systemStatus } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function initializeDatabase() {
  try {
    // Check if default user exists
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      // Create default Zebulon user
      await db.insert(users).values({
        username: "zebulon",
        password: "oracle_admin", // In production, this would be hashed
        codename: "Oracle Prime",
        role: "Admin",
        theme: "dark"
      });
      
      console.log("✓ Created default Zebulon user");
    }
    
    // Initialize system status entries
    const systemComponents = [
      { component: "oracle", status: "offline", metrics: { connections: 0, uptime: "0%" } },
      { component: "fantasma", status: "active", metrics: { scansCompleted: 0, threatsDetected: 0 } },
      { component: "zeta", status: "monitoring", metrics: { alertsActive: 0, vaultSecure: true } }
    ];
    
    for (const comp of systemComponents) {
      const existing = await db
        .select()
        .from(systemStatus)
        .where(eq(systemStatus.component, comp.component))
        .limit(1);
        
      if (existing.length === 0) {
        await db.insert(systemStatus).values(comp);
      }
    }
    
    console.log("✓ Database initialized successfully");
    
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}