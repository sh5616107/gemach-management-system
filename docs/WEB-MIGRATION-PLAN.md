# תוכנית מעבר לגרסת אינטרנט/מובייל
## מערכת ניהול גמ"ח - Gemach Management System

---

## 📋 סקירה כללית

המערכת הנוכחית:
- **Frontend:** React 18 + TypeScript + Vite
- **Desktop:** Electron
- **Database:** LocalStorage (JSON)
- **גרסה:** 2.9.55

**מטרת המיגרציה:** להפוך את המערכת לנגישה מכל מקום (דפדפן/מובייל) תוך שמירה על הקוד הקיים.

---

## 🎯 אסטרטגיית המעבר המומלצת

### שלב 1: Backend API (4-6 שבועות)
### שלב 2: עדכון Frontend (2-3 שבועות)
### שלב 3: אבטחה ואימות (2 שבועות)
### שלב 4: אירוח ופריסה (1 שבוע)
### שלב 5: אפליקציית מובייל (אופציונלי - 4-6 שבועות)

**סה"ך זמן משוער:** 9-12 שבועות לגרסת אינטרנט מלאה

---

## 🏗️ ארכיטקטורה חדשה

```
┌─────────────────────────────────────────────────┐
│           Frontend (React - קיים)              │
│  - אפליקציית Electron (Desktop)                │
│  - דפדפן (Web)                                 │
│  - React Native (Mobile - עתידי)              │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓ REST API / GraphQL
┌─────────────────────────────────────────────────┐
│         Backend Server (Node.js/NestJS)        │
│  - Express/Fastify                             │
│  - JWT Authentication                          │
│  - Business Logic                              │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────┐
│      Database (PostgreSQL/MongoDB)             │
│  - נתוני לווים, הלוואות, פיקדונות             │
│  - גיבויים אוטומטיים                          │
└─────────────────────────────────────────────────┘
```

---

## 📦 שלב 1: בניית Backend API

### 1.1 בחירת טכנולוגיות

**מומלץ:**
- **Framework:** NestJS (מבוסס Express, מובנה, TypeScript native)
- **Database:** PostgreSQL (חזק, אמין, תמיכה מצוינת ב-JSON)
- **ORM:** Prisma (קל לשימוש, type-safe, מיגרציות אוטומטיות)
- **Authentication:** JWT + bcrypt
- **Validation:** class-validator

**אלטרנטיבה פשוטה יותר:**
- Express.js + TypeScript + Prisma

### 1.2 מבנה הפרויקט

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/           # אימות והרשאות
│   │   ├── borrowers/      # לווים
│   │   ├── loans/          # הלוואות
│   │   ├── deposits/       # פיקדונות
│   │   ├── depositors/     # מפקידים
│   │   ├── donations/      # תרומות
│   │   ├── payments/       # תשלומים
│   │   ├── guarantors/     # ערבים
│   │   ├── masav/          # מערכת מסב
│   │   └── settings/       # הגדרות
│   ├── common/
│   │   ├── guards/         # אבטחה
│   │   ├── interceptors/   # לוגים
│   │   └── filters/        # טיפול בשגיאות
│   ├── database/
│   │   └── prisma/         # סכמת DB
│   └── main.ts
├── prisma/
│   └── schema.prisma       # הגדרת מודלים
├── package.json
└── tsconfig.json
```

### 1.3 סכמת מסד נתונים (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Borrower {
  id          Int      @id @default(autoincrement())
  firstName   String
  lastName    String
  city        String
  phone       String
  phone2      String?
  address     String
  email       String
  idNumber    String   @unique
  notes       String?
  
  // פרטי בנק למסב
  bankCode      String?
  branchNumber  String?
  accountNumber String?
  
  loans       Loan[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([idNumber])
  @@index([firstName, lastName])
}

model Loan {
  id                    Int      @id @default(autoincrement())
  borrowerId            Int
  borrower              Borrower @relation(fields: [borrowerId], references: [id])
  
  amount                Float
  loanDate              DateTime
  returnDate            DateTime
  createdDate           DateTime @default(now())
  loanType              String   // 'fixed' | 'flexible'
  
  // ערבים
  guarantor1Id          Int?
  guarantor2Id          Int?
  guarantor1            Guarantor? @relation("Guarantor1", fields: [guarantor1Id], references: [id])
  guarantor2            Guarantor? @relation("Guarantor2", fields: [guarantor2Id], references: [id])
  
  // הלוואות מחזוריות
  isRecurring           Boolean  @default(false)
  recurringDay          Int?
  recurringMonths       Int?
  
  // פרעון אוטומטי
  autoPayment           Boolean  @default(false)
  autoPaymentAmount     Float?
  autoPaymentDay        Int?
  autoPaymentStartDate  DateTime?
  autoPaymentFrequency  Int?
  
  // אמצעי תשלום
  loanPaymentMethod     String?
  loanPaymentDetails    Json?
  paymentDetailsComplete Boolean @default(false)
  
  notes                 String?
  status                String   // 'active' | 'completed' | 'overdue'
  
  // העברה לערבים
  transferredToGuarantors Boolean @default(false)
  transferDate            DateTime?
  transferredBy           String?
  transferNotes           String?
  
  payments              Payment[]
  
  @@index([borrowerId])
  @@index([status])
  @@index([returnDate])
}

model Guarantor {
  id              Int      @id @default(autoincrement())
  firstName       String
  lastName        String
  idNumber        String   @unique
  phone           String
  email           String?
  address         String?
  notes           String?
  
  status          String   // 'active' | 'blacklisted' | 'at_risk'
  blacklistReason String?
  blacklistDate   DateTime?
  blacklistBy     String?
  
  // פרטי בנק
  bankCode        String?
  branchNumber    String?
  accountNumber   String?
  
  loansAsGuarantor1 Loan[] @relation("Guarantor1")
  loansAsGuarantor2 Loan[] @relation("Guarantor2")
  debts             GuarantorDebt[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([idNumber])
  @@index([status])
}

model Payment {
  id                      Int      @id @default(autoincrement())
  loanId                  Int
  loan                    Loan     @relation(fields: [loanId], references: [id])
  
  amount                  Float
  date                    DateTime
  type                    String   // 'loan' | 'payment'
  
  paymentMethod           String?
  paymentDetails          Json?
  paymentDetailsComplete  Boolean  @default(false)
  
  notes                   String?
  
  // תשלום ערב
  paidBy                  String?  // 'borrower' | 'guarantor'
  guarantorId             Int?
  guarantorName           String?
  
  @@index([loanId])
  @@index([date])
}

model Depositor {
  id              Int      @id @default(autoincrement())
  name            String
  idNumber        String?
  phone           String
  notes           String?
  
  // פרטי בנק
  bankCode        String?
  branchNumber    String?
  accountNumber   String?
  
  deposits        Deposit[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([idNumber])
}

model Deposit {
  id                      Int      @id @default(autoincrement())
  depositorId             Int
  depositor               Depositor @relation(fields: [depositorId], references: [id])
  
  amount                  Float
  depositDate             DateTime
  depositPeriod           Int
  reminderDays            Int?
  
  notes                   String?
  status                  String   // 'active' | 'withdrawn'
  
  // אמצעי תשלום
  depositPaymentMethod    String?
  depositPaymentDetails   Json?
  
  // הפקדות מחזוריות
  isRecurring             Boolean  @default(false)
  recurringDay            Int?
  recurringMonths         Int?
  recurringEndDate        DateTime?
  lastRecurringDate       DateTime?
  
  withdrawals             Withdrawal[]
  
  @@index([depositorId])
  @@index([status])
  @@index([depositDate])
}

model Withdrawal {
  id                      Int      @id @default(autoincrement())
  depositId               Int
  deposit                 Deposit  @relation(fields: [depositId], references: [id])
  
  amount                  Float
  date                    DateTime
  
  paymentMethod           String?
  paymentDetails          Json?
  paymentDetailsComplete  Boolean  @default(false)
  
  notes                   String?
  
  @@index([depositId])
  @@index([date])
}

model Donation {
  id              Int      @id @default(autoincrement())
  donorName       String
  donorLastName   String
  amount          Float
  donationDate    DateTime
  method          String
  paymentDetails  Json?
  phone           String
  address         String
  notes           String?
  needsReceipt    Boolean  @default(false)
  
  @@index([donationDate])
}

model GuarantorDebt {
  id                  Int      @id @default(autoincrement())
  originalLoanId      Int
  guarantorId         Int
  guarantor           Guarantor @relation(fields: [guarantorId], references: [id])
  originalBorrowerId  Int
  
  amount              Float
  transferDate        DateTime
  transferredBy       String
  
  paymentType         String   // 'single' | 'installments'
  installmentsCount   Int?
  installmentAmount   Float?
  installmentDates    Json?
  
  status              String   // 'active' | 'paid' | 'overdue'
  notes               String?
  
  @@index([guarantorId])
  @@index([status])
}

model Expense {
  id              Int      @id @default(autoincrement())
  type            String   // 'bank_fee' | 'office' | 'salary' | 'other'
  amount          Float
  date            DateTime
  description     String
  
  paidBy          String   // 'gemach' | 'borrower' | 'donor'
  borrowerId      Int?
  borrowerName    String?
  donorName       String?
  loanId          Int?
  
  paymentMethod   String?
  receiptNumber   String?
  notes           String?
  
  @@index([date])
  @@index([type])
}

model Settings {
  id                      Int      @id @default(autoincrement())
  gemachName              String
  gemachLogo              String?
  
  currency                String   @default("ILS")
  currencySymbol          String   @default("₪")
  
  headerTitle             String
  footerText              String
  contactText             String
  
  enableRecurringLoans    Boolean  @default(true)
  enableRecurringPayments Boolean  @default(true)
  requireIdNumber         Boolean  @default(false)
  showHebrewDates         Boolean  @default(false)
  showDateWarnings        Boolean  @default(true)
  trackPaymentMethods     Boolean  @default(true)
  enableMasav             Boolean  @default(false)
  enableCommission        Boolean  @default(false)
  commissionType          String   @default("percentage")
  commissionValue         Float    @default(0)
  
  updatedAt               DateTime @updatedAt
}
```


### 1.4 דוגמאות קוד Backend

#### הגדרת NestJS Module - Borrowers

```typescript
// src/modules/borrowers/borrowers.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BorrowersService } from './borrowers.service';
import { CreateBorrowerDto, UpdateBorrowerDto } from './dto';

@Controller('api/borrowers')
@UseGuards(JwtAuthGuard)
export class BorrowersController {
  constructor(private readonly borrowersService: BorrowersService) {}

  @Get()
  async findAll() {
    return this.borrowersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.borrowersService.findOne(+id);
  }

  @Post()
  async create(@Body() createBorrowerDto: CreateBorrowerDto) {
    return this.borrowersService.create(createBorrowerDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateBorrowerDto: UpdateBorrowerDto) {
    return this.borrowersService.update(+id, updateBorrowerDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.borrowersService.remove(+id);
  }

  @Get('id-number/:idNumber')
  async findByIdNumber(@Param('idNumber') idNumber: string) {
    return this.borrowersService.findByIdNumber(idNumber);
  }
}
```

```typescript
// src/modules/borrowers/borrowers.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBorrowerDto, UpdateBorrowerDto } from './dto';

@Injectable()
export class BorrowersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.borrower.findMany({
      include: {
        loans: {
          where: { status: 'active' }
        }
      }
    });
  }

  async findOne(id: number) {
    const borrower = await this.prisma.borrower.findUnique({
      where: { id },
      include: {
        loans: {
          include: {
            payments: true,
            guarantor1: true,
            guarantor2: true
          }
        }
      }
    });

    if (!borrower) {
      throw new NotFoundException(`לווה עם מזהה ${id} לא נמצא`);
    }

    return borrower;
  }

  async create(createBorrowerDto: CreateBorrowerDto) {
    // בדיקת כפילות מספר זהות
    const existing = await this.prisma.borrower.findUnique({
      where: { idNumber: createBorrowerDto.idNumber }
    });

    if (existing) {
      throw new ConflictException('לווה עם מספר זהות זה כבר קיים במערכת');
    }

    // אימות מספר זהות ישראלי
    if (!this.validateIsraeliId(createBorrowerDto.idNumber)) {
      throw new ConflictException('מספר זהות לא תקין');
    }

    return this.prisma.borrower.create({
      data: createBorrowerDto
    });
  }

  async update(id: number, updateBorrowerDto: UpdateBorrowerDto) {
    await this.findOne(id); // בדיקה שקיים

    return this.prisma.borrower.update({
      where: { id },
      data: updateBorrowerDto
    });
  }

  async remove(id: number) {
    await this.findOne(id); // בדיקה שקיים

    // בדיקה שאין הלוואות פעילות
    const activeLoans = await this.prisma.loan.count({
      where: { borrowerId: id, status: 'active' }
    });

    if (activeLoans > 0) {
      throw new ConflictException('לא ניתן למחוק לווה עם הלוואות פעילות');
    }

    return this.prisma.borrower.delete({
      where: { id }
    });
  }

  async findByIdNumber(idNumber: string) {
    return this.prisma.borrower.findUnique({
      where: { idNumber }
    });
  }

  private validateIsraeliId(id: string): boolean {
    const cleanId = id.replace(/[\s-]/g, '');
    if (!/^\d{9}$/.test(cleanId)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let digit = parseInt(cleanId[i]);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit = Math.floor(digit / 10) + (digit % 10);
      }
      sum += digit;
    }

    return sum % 10 === 0;
  }
}
```

```typescript
// src/modules/borrowers/dto/create-borrower.dto.ts
import { IsString, IsEmail, IsOptional, Length, Matches } from 'class-validator';

export class CreateBorrowerDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  city: string;

  @IsString()
  @Matches(/^0\d{1,2}-?\d{7}$/, { message: 'מספר טלפון לא תקין' })
  phone: string;

  @IsOptional()
  @IsString()
  phone2?: string;

  @IsString()
  address: string;

  @IsEmail({}, { message: 'כתובת אימייל לא תקינה' })
  email: string;

  @IsString()
  @Length(9, 9, { message: 'מספר זהות חייב להיות 9 ספרות' })
  idNumber: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  bankCode?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  branchNumber?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;
}
```

#### אימות JWT

```typescript
// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async login(password: string) {
    const settings = await this.prisma.settings.findFirst();
    
    if (!settings?.appPassword) {
      // אין סיסמה מוגדרת - אפשר כניסה
      return this.generateToken('admin');
    }

    const isValid = await bcrypt.compare(password, settings.appPassword);
    
    if (!isValid) {
      throw new UnauthorizedException('סיסמה שגויה');
    }

    return this.generateToken('admin');
  }

  private generateToken(username: string) {
    const payload = { username, sub: 1 };
    return {
      access_token: this.jwtService.sign(payload),
      expiresIn: '24h'
    };
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('טוקן לא תקין');
    }
  }
}
```

```typescript
// src/modules/auth/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('נדרשת הרשאה');
    }
    return user;
  }
}
```

---

## 📱 שלב 2: עדכון Frontend

### 2.1 יצירת API Client

```typescript
// src/api/client.ts
import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // הוספת טוקן לכל בקשה
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // טיפול בשגיאות
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // טוקן לא תקין - נקה והפנה להתחברות
          localStorage.removeItem('auth_token');
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(password: string) {
    const response = await this.client.post('/api/auth/login', { password });
    localStorage.setItem('auth_token', response.data.access_token);
    return response.data;
  }

  // Borrowers
  async getBorrowers() {
    const response = await this.client.get('/api/borrowers');
    return response.data;
  }

  async getBorrower(id: number) {
    const response = await this.client.get(`/api/borrowers/${id}`);
    return response.data;
  }

  async createBorrower(data: any) {
    const response = await this.client.post('/api/borrowers', data);
    return response.data;
  }

  async updateBorrower(id: number, data: any) {
    const response = await this.client.put(`/api/borrowers/${id}`, data);
    return response.data;
  }

  async deleteBorrower(id: number) {
    const response = await this.client.delete(`/api/borrowers/${id}`);
    return response.data;
  }

  // Loans
  async getLoans() {
    const response = await this.client.get('/api/loans');
    return response.data;
  }

  async createLoan(data: any) {
    const response = await this.client.post('/api/loans', data);
    return response.data;
  }

  async updateLoan(id: number, data: any) {
    const response = await this.client.put(`/api/loans/${id}`, data);
    return response.data;
  }

  async getOverdueLoans() {
    const response = await this.client.get('/api/loans/overdue');
    return response.data;
  }

  // Payments
  async createPayment(data: any) {
    const response = await this.client.post('/api/payments', data);
    return response.data;
  }

  async getPaymentsByLoan(loanId: number) {
    const response = await this.client.get(`/api/payments/loan/${loanId}`);
    return response.data;
  }

  // Deposits
  async getDeposits() {
    const response = await this.client.get('/api/deposits');
    return response.data;
  }

  async createDeposit(data: any) {
    const response = await this.client.post('/api/deposits', data);
    return response.data;
  }

  // Donations
  async getDonations() {
    const response = await this.client.get('/api/donations');
    return response.data;
  }

  async createDonation(data: any) {
    const response = await this.client.post('/api/donations', data);
    return response.data;
  }

  // Statistics
  async getStatistics() {
    const response = await this.client.get('/api/statistics');
    return response.data;
  }

  // Settings
  async getSettings() {
    const response = await this.client.get('/api/settings');
    return response.data;
  }

  async updateSettings(data: any) {
    const response = await this.client.put('/api/settings', data);
    return response.data;
  }
}

export const api = new ApiClient();
```

### 2.2 עדכון Database Wrapper

במקום לשנות את כל הקוד, ניצור wrapper שיעבוד עם API:

```typescript
// src/database/database-api.ts
import { api } from '../api/client';
import type { DatabaseBorrower, DatabaseLoan, DatabaseDeposit } from './database';

class GemachDatabaseAPI {
  // Borrowers
  async addBorrower(borrower: Omit<DatabaseBorrower, 'id'>) {
    try {
      return await api.createBorrower(borrower);
    } catch (error: any) {
      return { error: error.response?.data?.message || 'שגיאה ביצירת לווה' };
    }
  }

  async getBorrowers(): Promise<DatabaseBorrower[]> {
    return await api.getBorrowers();
  }

  async updateBorrower(id: number, borrower: Partial<DatabaseBorrower>) {
    return await api.updateBorrower(id, borrower);
  }

  async deleteBorrower(id: number) {
    return await api.deleteBorrower(id);
  }

  // Loans
  async addLoan(loan: Omit<DatabaseLoan, 'id'>) {
    return await api.createLoan(loan);
  }

  async getLoans(): Promise<DatabaseLoan[]> {
    return await api.getLoans();
  }

  async updateLoan(id: number, loan: Partial<DatabaseLoan>) {
    return await api.updateLoan(id, loan);
  }

  async getOverdueLoans() {
    return await api.getOverdueLoans();
  }

  // Deposits
  async addDeposit(deposit: Omit<DatabaseDeposit, 'id'>) {
    return await api.createDeposit(deposit);
  }

  async getDeposits(): Promise<DatabaseDeposit[]> {
    return await api.getDeposits();
  }

  // ... המשך לכל הפונקציות
}

// ייצוא instance יחיד
export const dbApi = new GemachDatabaseAPI();
```

### 2.3 שימוש ב-React Query (מומלץ)

```typescript
// src/hooks/useBorrowers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useBorrowers() {
  return useQuery({
    queryKey: ['borrowers'],
    queryFn: () => api.getBorrowers()
  });
}

export function useCreateBorrower() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.createBorrower(data),
    onSuccess: () => {
      // רענן את רשימת הלווים
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
    }
  });
}

export function useUpdateBorrower() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      api.updateBorrower(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
    }
  });
}
```

שימוש בקומפוננטה:

```typescript
// src/pages/LoansPage.tsx
import { useBorrowers, useCreateBorrower } from '../hooks/useBorrowers';

function LoansPage() {
  const { data: borrowers, isLoading, error } = useBorrowers();
  const createBorrower = useCreateBorrower();

  if (isLoading) return <div>טוען...</div>;
  if (error) return <div>שגיאה בטעינת נתונים</div>;

  const handleCreate = async (data: any) => {
    try {
      await createBorrower.mutateAsync(data);
      alert('לווה נוסף בהצלחה!');
    } catch (error) {
      alert('שגיאה בהוספת לווה');
    }
  };

  return (
    <div>
      {/* הקוד הקיים שלך */}
    </div>
  );
}
```

### 2.4 תמיכה ב-Offline Mode (PWA)

```typescript
// src/utils/offline-sync.ts
import { openDB, DBSchema } from 'idb';

interface OfflineDB extends DBSchema {
  'pending-actions': {
    key: number;
    value: {
      id: number;
      action: 'create' | 'update' | 'delete';
      entity: string;
      data: any;
      timestamp: number;
    };
  };
}

class OfflineSync {
  private db: any;

  async init() {
    this.db = await openDB<OfflineDB>('gemach-offline', 1, {
      upgrade(db) {
        db.createObjectStore('pending-actions', { keyPath: 'id', autoIncrement: true });
      }
    });
  }

  async addPendingAction(action: string, entity: string, data: any) {
    await this.db.add('pending-actions', {
      action,
      entity,
      data,
      timestamp: Date.now()
    });
  }

  async syncPendingActions() {
    const actions = await this.db.getAll('pending-actions');
    
    for (const action of actions) {
      try {
        // נסה לבצע את הפעולה
        await this.executeAction(action);
        // אם הצליח - מחק מהתור
        await this.db.delete('pending-actions', action.id);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
      }
    }
  }

  private async executeAction(action: any) {
    // לוגיקה לביצוע הפעולה מול השרת
  }
}

export const offlineSync = new OfflineSync();
```

---

## 🔐 שלב 3: אבטחה ואימות

### 3.1 הצפנת נתונים רגישים

```typescript
// backend/src/common/encryption.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 3.2 Rate Limiting

```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // אבטחה בסיסית
  app.use(helmet());

  // הגבלת קצב בקשות
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 דקות
      max: 100, // מקסימום 100 בקשות לכל IP
      message: 'יותר מדי בקשות, נסה שוב מאוחר יותר'
    })
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  });

  await app.listen(3000);
}
bootstrap();
```

### 3.3 Audit Log

```typescript
// backend/src/modules/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(action: string, entity: string, entityId: number, userId: number, details?: any) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        details: details ? JSON.stringify(details) : null,
        timestamp: new Date()
      }
    });
  }

  async getAuditLogs(filters?: any) {
    return this.prisma.auditLog.findMany({
      where: filters,
      orderBy: { timestamp: 'desc' },
      take: 100
    });
  }
}
```

---

## 🚀 שלב 4: אירוח ופריסה

### 4.1 אפשרויות אירוח

#### אופציה 1: Railway.app (מומלץ למתחילים)

**יתרונות:**
- פשוט מאוד
- חינם עד $5/חודש
- PostgreSQL מובנה
- Deploy אוטומטי מ-GitHub

**הגדרה:**
1. צור חשבון ב-railway.app
2. חבר את ה-GitHub repository
3. הוסף PostgreSQL database
4. הגדר משתני סביבה:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret-key
   ENCRYPTION_KEY=your-encryption-key
   ```
5. Deploy!

**עלות:** ~$5-10/חודש

#### אופציה 2: Render.com

דומה ל-Railway, חינם עד 750 שעות/חודש.

#### אופציה 3: AWS Lightsail (לשליטה מלאה)

**יתרונות:**
- שליטה מלאה
- ביצועים טובים
- מחיר קבוע

**עלות:** $5-20/חודש

#### אופציה 4: Vercel (Frontend) + Supabase (Backend)

**Frontend ב-Vercel:**
- חינם לחלוטין
- CDN מהיר
- Deploy אוטומטי

**Backend ב-Supabase:**
- PostgreSQL מנוהל
- REST API אוטומטי
- Authentication מובנה
- חינם עד 500MB

**עלות:** חינם להתחלה!

### 4.2 Docker Configuration

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: gemach
      POSTGRES_USER: gemach_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://gemach_user:${DB_PASSWORD}@postgres:5432/gemach
      JWT_SECRET: ${JWT_SECRET}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 4.3 CI/CD עם GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run tests
        run: |
          cd backend
          npm test
      
      - name: Build
        run: |
          cd backend
          npm run build
      
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 4.4 גיבויים אוטומטיים

```typescript
// backend/src/modules/backup/backup.service.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupService {
  constructor(private prisma: PrismaService) {}

  @Cron('0 2 * * *') // כל יום ב-2 בלילה
  async createDailyBackup() {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupPath = path.join(__dirname, '../../backups', `backup-${timestamp}.json`);

    // ייצוא כל הנתונים
    const data = {
      borrowers: await this.prisma.borrower.findMany(),
      loans: await this.prisma.loan.findMany(),
      deposits: await this.prisma.deposit.findMany(),
      donations: await this.prisma.donation.findMany(),
      payments: await this.prisma.payment.findMany(),
      // ... שאר הטבלאות
    };

    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

    // העלאה ל-S3 או Google Drive (אופציונלי)
    await this.uploadToCloud(backupPath);

    console.log(`Backup created: ${backupPath}`);
  }

  private async uploadToCloud(filePath: string) {
    // לוגיקה להעלאה לענן
  }
}
```

---

## 📲 שלב 5: אפליקציית מובייל (אופציונלי)

### 5.1 React Native - המרת הקוד

```bash
# התקנה
npx react-native init GemachMobile --template react-native-template-typescript
```

```typescript
// mobile/src/screens/LoansScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { api } from '../api/client';

export function LoansScreen() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      const data = await api.getLoans();
      setLoans(data);
    } catch (error) {
      console.error('Error loading loans:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>הלוואות</Text>
      <FlatList
        data={loans}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.loanCard}>
            <Text style={styles.borrowerName}>
              {item.borrower.firstName} {item.borrower.lastName}
            </Text>
            <Text style={styles.amount}>₪{item.amount.toLocaleString()}</Text>
            <Text style={styles.date}>
              תאריך החזרה: {new Date(item.returnDate).toLocaleDateString('he-IL')}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'right'
  },
  loanCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  borrowerName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right'
  },
  amount: {
    fontSize: 16,
    color: '#2196F3',
    marginTop: 8,
    textAlign: 'right'
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'right'
  }
});
```

### 5.2 אלטרנטיבה: PWA (Progressive Web App)

פשוט יותר - הופך את האתר לאפליקציה:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'מערכת ניהול גמח',
        short_name: 'גמח',
        description: 'מערכת לניהול הלוואות, פיקדונות ותרומות',
        theme_color: '#667eea',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.gemach\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 שעות
              }
            }
          }
        ]
      }
    })
  ]
});
```

---

## 📊 מעקב ואנליטיקס

### התראות אוטומטיות

```typescript
// backend/src/modules/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private emailTransporter: nodemailer.Transporter;
  
  constructor(private prisma: PrismaService) {
    // הגדרת SMTP
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  @Cron('0 9 * * *') // כל יום ב-9 בבוקר
  async checkOverdueLoans() {
    const overdueLoans = await this.prisma.loan.findMany({
      where: {
        status: 'active',
        returnDate: {
          lt: new Date()
        }
      },
      include: {
        borrower: true
      }
    });

    for (const loan of overdueLoans) {
      await this.sendOverdueNotification(loan);
    }
  }

  @Cron('0 9 * * *') // כל יום ב-9 בבוקר
  async checkUpcomingPayments() {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingLoans = await this.prisma.loan.findMany({
      where: {
        status: 'active',
        returnDate: {
          gte: new Date(),
          lte: sevenDaysFromNow
        }
      },
      include: {
        borrower: true
      }
    });

    for (const loan of upcomingLoans) {
      await this.sendUpcomingPaymentNotification(loan);
    }
  }

  private async sendOverdueNotification(loan: any) {
    const daysOverdue = Math.floor(
      (Date.now() - new Date(loan.returnDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const message = `שלום ${loan.borrower.firstName},\n\nהלוואה מספר ${loan.id} באיחור של ${daysOverdue} ימים.\nסכום: ₪${loan.amount.toLocaleString()}\n\nאנא פנה לגמ"ח בהקדם.`;

    // שליחת SMS
    if (loan.borrower.phone) {
      await this.sendSMS(loan.borrower.phone, message);
    }

    // שליחת אימייל
    if (loan.borrower.email) {
      await this.sendEmail(
        loan.borrower.email,
        'תזכורת - הלוואה באיחור',
        message
      );
    }

    // עדכון שנשלחה התראה
    await this.prisma.loan.update({
      where: { id: loan.id },
      data: {
        status: 'reminder_sent',
        reminderSent: new Date().toISOString()
      }
    });
  }

  private async sendUpcomingPaymentNotification(loan: any) {
    const daysUntil = Math.floor(
      (new Date(loan.returnDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const message = `שלום ${loan.borrower.firstName},\n\nתזכורת: הלוואה מספר ${loan.id} תגיע לפירעון בעוד ${daysUntil} ימים.\nסכום: ₪${loan.amount.toLocaleString()}\nתאריך פירעון: ${new Date(loan.returnDate).toLocaleDateString('he-IL')}`;

    if (loan.borrower.phone) {
      await this.sendSMS(loan.borrower.phone, message);
    }

    if (loan.borrower.email) {
      await this.sendEmail(
        loan.borrower.email,
        'תזכורת - תשלום קרוב',
        message
      );
    }
  }

  private async sendSMS(phone: string, message: string) {
    try {
      // דוגמה עם Inforu
      await axios.post('https://api.inforu.co.il/SendMessageXml.ashx', {
        username: process.env.SMS_USERNAME,
        password: process.env.SMS_PASSWORD,
        sender: 'GEMACH',
        recipient: phone,
        message: message
      });
      
      console.log(`SMS sent to ${phone}`);
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  }

  private async sendEmail(to: string, subject: string, text: string) {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'gemach@example.com',
        to,
        subject,
        text,
        html: `<div dir="rtl" style="font-family: Arial, sans-serif;">${text.replace(/\n/g, '<br>')}</div>`
      });
      
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  // שליחת התראה ידנית
  async sendManualNotification(loanId: number, type: 'sms' | 'email' | 'both') {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { borrower: true }
    });

    if (!loan) {
      throw new Error('Loan not found');
    }

    const message = `שלום ${loan.borrower.firstName},\n\nזוהי תזכורת לגבי הלוואה מספר ${loan.id}.\nסכום: ₪${loan.amount.toLocaleString()}\nתאריך פירעון: ${new Date(loan.returnDate).toLocaleDateString('he-IL')}\n\nאנא פנה לגמ"ח.`;

    if (type === 'sms' || type === 'both') {
      await this.sendSMS(loan.borrower.phone, message);
    }

    if (type === 'email' || type === 'both') {
      await this.sendEmail(loan.borrower.email, 'תזכורת הלוואה', message);
    }

    return { success: true, message: 'התראה נשלחה בהצלחה' };
  }
}
```

---

## 💰 הערכת עלויות

### עלויות חודשיות משוערות

| פריט | אופציה זולה | אופציה מומלצת | אופציה מתקדמת |
|------|-------------|---------------|---------------|
| **שרת Backend** | Railway Free | Railway $5 | AWS Lightsail $10 |
| **מסד נתונים** | Supabase Free | Railway PostgreSQL $5 | AWS RDS $15 |
| **Frontend Hosting** | Vercel Free | Vercel Free | Cloudflare $0 |
| **SMS (100/חודש)** | - | Inforu ₪40 | Twilio ₪50 |
| **Email (5000/חודש)** | SendGrid Free | SendGrid Free | SendGrid Free |
| **גיבויים** | Manual | S3 ₪5 | S3 + Backup ₪15 |
| **Domain** | - | Namecheap ₪40/שנה | - |
| **SSL Certificate** | Free (Let's Encrypt) | Free | Free |
| **CDN** | Included | Included | Cloudflare Free |
| **Monitoring** | - | UptimeRobot Free | Datadog ₪100 |
| | | | |
| **סה"ך חודשי** | **₪0** | **₪200-250** | **₪700-800** |

### עלויות חד-פעמיות

- **פיתוח Backend:** 80-120 שעות × ₪150-300 = ₪12,000-36,000
- **מיגרציה Frontend:** 40-60 שעות × ₪150-300 = ₪6,000-18,000
- **בדיקות ו-QA:** 20-30 שעות × ₪150-300 = ₪3,000-9,000
- **אפליקציית מובייל (אופציונלי):** 100-150 שעות × ₪150-300 = ₪15,000-45,000

**סה"ך השקעה ראשונית:** ₪21,000-63,000 (ללא מובייל)

---

## 📅 לוח זמנים מפורט

### שבוע 1-2: תכנון והכנה
- [ ] הגדרת דרישות מדויקות
- [ ] בחירת טכנולוגיות
- [ ] הקמת סביבת פיתוח
- [ ] הגדרת Git repository
- [ ] תכנון ארכיטקטורה

### שבוע 3-4: Backend - מודלים בסיסיים
- [ ] הקמת פרויקט NestJS
- [ ] הגדרת Prisma Schema
- [ ] יצירת מודלים: Borrowers, Loans
- [ ] API endpoints בסיסיים
- [ ] אימות JWT

### שבוע 5-6: Backend - מודלים מתקדמים
- [ ] מודלים: Deposits, Depositors, Donations
- [ ] מודלים: Payments, Guarantors
- [ ] מודלים: Expenses, Settings
- [ ] לוגיקה עסקית מורכבת
- [ ] בדיקות יחידה

### שבוע 7-8: Backend - תכונות מתקדמות
- [ ] מערכת התראות
- [ ] מערכת מסב
- [ ] גיבויים אוטומטיים
- [ ] Audit logs
- [ ] אופטימיזציה

### שבוע 9-10: Frontend - אינטגרציה
- [ ] יצירת API client
- [ ] עדכון database wrapper
- [ ] React Query integration
- [ ] עדכון קומפוננטות ראשיות
- [ ] טיפול בשגיאות

### שבוע 11: בדיקות
- [ ] בדיקות אינטגרציה
- [ ] בדיקות E2E
- [ ] בדיקות ביצועים
- [ ] בדיקות אבטחה
- [ ] תיקון באגים

### שבוע 12: פריסה
- [ ] הגדרת סביבת production
- [ ] מיגרציה של נתונים
- [ ] Deploy
- [ ] בדיקות production
- [ ] הדרכת משתמשים

---

## 🔄 אסטרטגיית מיגרציה

### שלב א': Hybrid Mode (מומלץ)

תקופת מעבר שבה שתי הגרסאות עובדות במקביל:

1. **Electron ממשיך לעבוד** עם LocalStorage
2. **גרסת Web חדשה** עם Backend
3. **כלי סנכרון** מעביר נתונים בין השניים

```typescript
// src/utils/sync-manager.ts
class SyncManager {
  async syncToCloud() {
    const localData = db.exportData();
    await api.importData(JSON.parse(localData));
  }

  async syncFromCloud() {
    const cloudData = await api.exportData();
    db.importData(JSON.stringify(cloudData));
  }

  async enableAutoSync() {
    setInterval(() => {
      this.syncToCloud();
    }, 5 * 60 * 1000); // כל 5 דקות
  }
}
```

### שלב ב': מעבר מלא

לאחר תקופת ניסיון (1-2 חודשים):
1. כל המשתמשים עוברים לגרסת Web
2. Electron נשאר כאופציה (עם Backend)
3. LocalStorage מושבת

---

## 🛠️ כלים מומלצים

### פיתוח
- **IDE:** VS Code + Extensions (Prisma, ESLint, Prettier)
- **API Testing:** Postman / Insomnia
- **Database GUI:** Prisma Studio / pgAdmin
- **Git Client:** GitHub Desktop / GitKraken

### ניטור
- **Uptime:** UptimeRobot (חינם)
- **Errors:** Sentry (חינם עד 5K events/חודש)
- **Logs:** Better Stack (חינם עד 1GB/חודש)
- **Analytics:** Plausible / Google Analytics

### תקשורת
- **SMS:** Inforu / Twilio
- **Email:** SendGrid / Mailgun
- **Push Notifications:** Firebase Cloud Messaging

---

## ⚠️ סיכונים ואתגרים

### טכניים
1. **מיגרציה של נתונים** - צריך להיות זהיר מאוד
2. **ביצועים** - שרת צריך להיות מהיר מספיק
3. **אבטחה** - נתונים רגישים צריכים הגנה
4. **Offline mode** - מה קורה כשאין אינטרנט?

### עסקיים
1. **עלויות חודשיות** - צריך תקציב קבוע
2. **תחזוקה** - צריך מישהו שידע לתחזק
3. **הדרכה** - משתמשים צריכים ללמוד מחדש
4. **גיבויים** - חובה לוודא שלא נאבד נתונים

### פתרונות
- **גיבויים יומיים אוטומטיים**
- **תקופת ניסיון עם Hybrid mode**
- **הדרכות מקיפות**
- **תמיכה טכנית זמינה**

---

## ✅ Checklist לפני השקה

### Backend
- [ ] כל ה-API endpoints עובדים
- [ ] אימות ואבטחה מוגדרים
- [ ] בדיקות עוברות
- [ ] גיבויים אוטומטיים פועלים
- [ ] Monitoring מוגדר
- [ ] Rate limiting פעיל
- [ ] HTTPS מוגדר
- [ ] CORS מוגדר נכון

### Frontend
- [ ] כל הדפים עובדים
- [ ] טיפול בשגיאות
- [ ] Loading states
- [ ] Responsive design
- [ ] PWA מוגדר (אם רלוונטי)
- [ ] אופטימיזציה לביצועים
- [ ] בדיקות דפדפנים שונים

### נתונים
- [ ] סקריפט מיגרציה נבדק
- [ ] גיבוי מלא של נתונים קיימים
- [ ] תוכנית rollback במקרה של בעיה
- [ ] אימות שכל הנתונים עברו

### תפעול
- [ ] מסמכי הדרכה מוכנים
- [ ] תמיכה טכנית זמינה
- [ ] תוכנית תקשורת למשתמשים
- [ ] מעקב אחרי ביצועים

---

## 📚 משאבים נוספים

### תיעוד
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### קורסים
- [NestJS Zero to Hero](https://www.udemy.com/course/nestjs-zero-to-hero/)
- [Prisma Crash Course](https://www.youtube.com/watch?v=RebA5J-rlwg)
- [React Query Tutorial](https://www.youtube.com/watch?v=novnyCaa7To)

### קהילות
- [NestJS Discord](https://discord.gg/nestjs)
- [Prisma Slack](https://slack.prisma.io/)
- [React Israel Facebook Group](https://www.facebook.com/groups/reactjs.il/)

---

## 🎯 המלצה סופית

### לטווח קצר (3 חודשים):
1. **התחל עם Backend בסיסי** - NestJS + Prisma + PostgreSQL
2. **Deploy ל-Railway** - פשוט וזול
3. **הוסף API client ל-Frontend**
4. **הפעל Hybrid mode** - שתי הגרסאות במקביל

### לטווח בינוני (6 חודשים):
1. **הוסף מערכת התראות** - SMS + Email
2. **PWA** - הפוך לאפליקציה מתקדמת
3. **אופטימיזציה** - שפר ביצועים
4. **מעבר מלא לגרסת Web**

### לטווח ארוך (12 חודשים):
1. **אפליקציית מובייל** - React Native
2. **תכונות מתקדמות** - AI, אנליטיקס
3. **סקלביליות** - AWS/Azure
4. **מוצר מסחרי** - מכירה לגמ"חים אחרים

---

## 📞 צעדים הבאים

רוצה שאתחיל ליישם?

1. **אני יכול ליצור את מבנה הפרויקט הבסיסי**
2. **להקים Backend עם NestJS + Prisma**
3. **ליצור API client ל-Frontend**
4. **להוסיף מערכת התראות**

**איזה שלב תרצה שאתחיל בו?**

---

*מסמך זה נוצר ב-1 בדצמבר 2025*
*גרסה: 1.0*
