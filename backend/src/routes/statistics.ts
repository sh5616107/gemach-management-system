import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';

export const statisticsRouter = Router();

statisticsRouter.use(authMiddleware);

// קבל סטטיסטיקות כלליות
statisticsRouter.get('/', async (req: Request, res: Response) => {
  try {
    // הלוואות
    const loans = await prisma.loan.findMany({
      include: { payments: true }
    });

    const activeLoans = loans.filter(l => l.status === 'active');
    const totalLoansAmount = loans.reduce((sum, l) => sum + l.amount, 0);
    const activeLoansAmount = activeLoans.reduce((sum, l) => sum + l.amount, 0);

    // חישוב יתרה לפרעון
    let totalLoansBalance = 0;
    activeLoans.forEach(loan => {
      const totalPaid = loan.payments
        .filter(p => p.type === 'payment')
        .reduce((sum, p) => sum + p.amount, 0);
      totalLoansBalance += (loan.amount - totalPaid);
    });

    // פיקדונות
    const deposits = await prisma.deposit.findMany({
      where: { status: 'active' }
    });
    const totalDepositsAmount = deposits.reduce((sum, d) => sum + d.amount, 0);

    // תרומות
    const donations = await prisma.donation.findMany();
    const totalDonationsAmount = donations.reduce((sum, d) => sum + d.amount, 0);

    // יתרה כוללת
    const balance = totalDonationsAmount + totalDepositsAmount - totalLoansBalance;

    const stats = {
      totalLoans: loans.length,
      activeLoans: activeLoans.length,
      totalLoansAmount,
      activeLoansAmount,
      totalLoansBalance,
      totalDeposits: deposits.length,
      totalDepositsAmount,
      totalDonations: donations.length,
      totalDonationsAmount,
      balance,
      lastUpdated: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת סטטיסטיקות' });
  }
});

// סטטיסטיקות הלוואות באיחור
statisticsRouter.get('/overdue', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueLoans = await prisma.loan.findMany({
      where: {
        status: 'active',
        returnDate: {
          lt: today
        }
      },
      include: {
        borrower: true,
        payments: true
      }
    });

    const totalAmount = overdueLoans.reduce((sum, loan) => {
      const totalPaid = loan.payments
        .filter(p => p.type === 'payment')
        .reduce((sum, p) => sum + p.amount, 0);
      return sum + (loan.amount - totalPaid);
    }, 0);

    res.json({
      total: overdueLoans.length,
      totalAmount,
      loans: overdueLoans
    });
  } catch (error) {
    console.error('Get overdue statistics error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת סטטיסטיקות איחורים' });
  }
});
