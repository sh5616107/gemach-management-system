import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';

export const loansRouter = Router();
loansRouter.use(authMiddleware);

// קבל את כל ההלוואות
loansRouter.get('/', async (req: Request, res: Response) => {
  try {
    const loans = await prisma.loan.findMany({
      include: {
        borrower: true,
        guarantor1: true,
        guarantor2: true,
        payments: true
      },
      orderBy: { createdDate: 'desc' }
    });

    res.json(loans);
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת הלוואות' });
  }
});

// קבל הלוואות באיחור
loansRouter.get('/overdue', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    const overdueLoans = await prisma.loan.findMany({
      where: {
        status: 'active',
        returnDate: {
          lt: now
        }
      },
      include: {
        borrower: true,
        guarantor1: true,
        guarantor2: true,
        payments: true
      },
      orderBy: { returnDate: 'asc' }
    });

    res.json(overdueLoans);
  } catch (error) {
    console.error('Get overdue loans error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת הלוואות באיחור' });
  }
});

// צור הלוואה חדשה
loansRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // בדיקת שדות חובה
    if (!data.borrowerId || !data.amount || !data.loanDate || !data.returnDate) {
      return res.status(400).json({ error: 'חסרים שדות חובה' });
    }

    const loan = await prisma.loan.create({
      data: {
        borrowerId: data.borrowerId,
        amount: parseFloat(data.amount),
        loanDate: new Date(data.loanDate),
        returnDate: new Date(data.returnDate),
        loanType: data.loanType || 'fixed',
        guarantor1Id: data.guarantor1Id,
        guarantor2Id: data.guarantor2Id,
        isRecurring: data.isRecurring || false,
        recurringDay: data.recurringDay,
        recurringMonths: data.recurringMonths,
        autoPayment: data.autoPayment || false,
        autoPaymentAmount: data.autoPaymentAmount,
        autoPaymentDay: data.autoPaymentDay,
        autoPaymentStartDate: data.autoPaymentStartDate ? new Date(data.autoPaymentStartDate) : null,
        autoPaymentFrequency: data.autoPaymentFrequency,
        loanPaymentMethod: data.loanPaymentMethod,
        loanPaymentDetails: data.loanPaymentDetails,
        paymentDetailsComplete: data.paymentDetailsComplete || false,
        notes: data.notes || '',
        status: 'active'
      },
      include: {
        borrower: true,
        guarantor1: true,
        guarantor2: true
      }
    });

    res.status(201).json(loan);
  } catch (error) {
    console.error('Create loan error:', error);
    res.status(500).json({ error: 'שגיאה ביצירת הלוואה' });
  }
});

// עדכן הלוואה
loansRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    const loan = await prisma.loan.update({
      where: { id },
      data,
      include: {
        borrower: true,
        guarantor1: true,
        guarantor2: true,
        payments: true
      }
    });

    res.json(loan);
  } catch (error) {
    console.error('Update loan error:', error);
    res.status(500).json({ error: 'שגיאה בעדכון הלוואה' });
  }
});

// מחק הלוואה
loansRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // מחק תחילה את התשלומים
    await prisma.payment.deleteMany({ where: { loanId: id } });
    
    // מחק את ההלוואה
    await prisma.loan.delete({ where: { id } });

    res.json({ message: 'הלוואה נמחקה בהצלחה' });
  } catch (error) {
    console.error('Delete loan error:', error);
    res.status(500).json({ error: 'שגיאה במחיקת הלוואה' });
  }
});
