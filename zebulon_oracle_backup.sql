-- Zebulon Oracle Database Backup
-- Generated for local PostgreSQL setup
-- Contains schema and sample data for offline operation

-- Users table
CREATE TABLE IF NOT EXISTS "User" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Oracle Memory table (from previous Oracle functionality)
CREATE TABLE IF NOT EXISTS "OracleMemory" (
    id SERIAL PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'custom',
    status VARCHAR(20) DEFAULT 'active',
    user_id INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Family Tree table (new GEDCOM functionality)
CREATE TABLE IF NOT EXISTS "FamilyTree" (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    user_id INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Module Integration table
CREATE TABLE IF NOT EXISTS "ModuleIntegration" (
    id SERIAL PRIMARY KEY,
    module_name VARCHAR(50) NOT NULL,
    integration_type VARCHAR(20) NOT NULL,
    url TEXT,
    script TEXT,
    embed_code TEXT,
    user_id INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample admin user (password: admin123)
INSERT INTO "User" (username, email, password_hash) VALUES 
('admin', 'admin@zebulon.local', '$2b$10$K7L1OJ45/4dE4GdmU8K5CeDgUdX1rYdQjEzIwJhKdJ2qSGjkEj7xu')
ON CONFLICT (username) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_username ON "User"(username);
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_oracle_memory_user_id ON "OracleMemory"(user_id);
CREATE INDEX IF NOT EXISTS idx_oracle_memory_type ON "OracleMemory"(type);
CREATE INDEX IF NOT EXISTS idx_family_tree_user_id ON "FamilyTree"(user_id);
CREATE INDEX IF NOT EXISTS idx_module_integration_user_id ON "ModuleIntegration"(user_id);
CREATE INDEX IF NOT EXISTS idx_module_integration_module_name ON "ModuleIntegration"(module_name);