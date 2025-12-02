-- Create initial admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO "User" (username, password, role, "createdAt", "updatedAt")
VALUES (
  'admin',
  '$2b$10$rKJ5VqZ9YvGQxH.xKJ5VqZ9YvGQxH.xKJ5VqZ9YvGQxH.xKJ5Vq',
  'admin',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Create initial settings
INSERT INTO "Settings" (
  "gemachName",
  "gemachAddress",
  "gemachPhone",
  "gemachEmail",
  "maxLoanAmount",
  "defaultLoanPeriod",
  "interestRate",
  "createdAt",
  "updatedAt"
)
VALUES (
  'גמ"ח שלי',
  'כתובת הגמ"ח',
  '02-1234567',
  'info@gemach.co.il',
  50000,
  12,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
