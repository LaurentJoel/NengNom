-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'FARMER',
  passwordHash TEXT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create FarmerProfile table
CREATE TABLE IF NOT EXISTS "FarmerProfile" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  farmType TEXT,
  animalCount INTEGER,
  location TEXT,
  gpsLatitude DECIMAL,
  gpsLongitude DECIMAL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create VetProfile table
CREATE TABLE IF NOT EXISTS "VetProfile" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  licenseNumber TEXT,
  specialization TEXT,
  yearsOfExperience INTEGER,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create RefreshToken table
CREATE TABLE IF NOT EXISTS "RefreshToken" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Consultation table
CREATE TABLE IF NOT EXISTS "Consultation" (
  id TEXT PRIMARY KEY,
  farmerId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  vetId TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  type TEXT,
  description TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Message table
CREATE TABLE IF NOT EXISTS "Message" (
  id TEXT PRIMARY KEY,
  consultationId TEXT NOT NULL REFERENCES "Consultation"(id) ON DELETE CASCADE,
  senderId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create FarmRecord table
CREATE TABLE IF NOT EXISTS "FarmRecord" (
  id TEXT PRIMARY KEY,
  farmerId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  recordDate DATE NOT NULL,
  animalCount INTEGER,
  mortality INTEGER,
  feedCost DECIMAL,
  revenue DECIMAL,
  expenses DECIMAL,
  notes TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(farmerId, recordDate)
);

-- Create HealthEvent table
CREATE TABLE IF NOT EXISTS "HealthEvent" (
  id TEXT PRIMARY KEY,
  farmerId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  eventType TEXT NOT NULL,
  description TEXT,
  eventDate DATE,
  nextDueDate DATE,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create LabRequest table
CREATE TABLE IF NOT EXISTS "LabRequest" (
  id TEXT PRIMARY KEY,
  farmerId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  vetId TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  testType TEXT,
  status TEXT NOT NULL DEFAULT 'REQUESTED',
  gpsLatitude DECIMAL,
  gpsLongitude DECIMAL,
  results TEXT,
  vetReview TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create AiSuggestion table
CREATE TABLE IF NOT EXISTS "AiSuggestion" (
  id TEXT PRIMARY KEY,
  farmerId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  suggestions JSON,
  helpful BOOLEAN,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create CommunityPost table
CREATE TABLE IF NOT EXISTS "CommunityPost" (
  id TEXT PRIMARY KEY,
  authorId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  likesCount INTEGER DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create DiseaseAlert table
CREATE TABLE IF NOT EXISTS "DiseaseAlert" (
  id TEXT PRIMARY KEY,
  reportedById TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  disease TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  severity TEXT NOT NULL,
  description TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_consultation_farmerId ON "Consultation"(farmerId);
CREATE INDEX IF NOT EXISTS idx_consultation_vetId ON "Consultation"(vetId);
CREATE INDEX IF NOT EXISTS idx_message_consultationId ON "Message"(consultationId);
CREATE INDEX IF NOT EXISTS idx_farmrecord_farmerId ON "FarmRecord"(farmerId);
CREATE INDEX IF NOT EXISTS idx_healthevent_farmerId ON "HealthEvent"(farmerId);
CREATE INDEX IF NOT EXISTS idx_labrequest_farmerId ON "LabRequest"(farmerId);
CREATE INDEX IF NOT EXISTS idx_aisuggestion_farmerId ON "AiSuggestion"(farmerId);
CREATE INDEX IF NOT EXISTS idx_communitypost_authorId ON "CommunityPost"(authorId);
CREATE INDEX IF NOT EXISTS idx_diseasealert_reportedById ON "DiseaseAlert"(reportedById);
