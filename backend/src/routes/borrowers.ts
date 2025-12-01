import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';
import { validateIsraeliId } from '../utils/validators';

export const borrowersRouter = Router();

// כל הנתיבים דורשים אימות
borrowersRouter.use(authMiddleware);

// קבל את כל הלווים
borrowersRouter.get('/', async (req: Request, res: Response) => {
  try {
    const borrowers = await prisma.borrower.findMany({
      include: {
        loans: {
          where: { status: 'active' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(borrowers);
  } catch (error) {
    console.error('Get borrowers error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת לווים' });
  }
});

// קבל לווה ספציפי
borrowersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const borrower = await prisma.borrower.findUnique({
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
      return res.status(404).json({ error: 'לווה לא נמצא' });
    }

    res.json(borrower);
  } catch (error) {
    console.error('Get borrower error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת לווה' });
  }
});

// צור לווה חדש
borrowersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // בדיקת שדות חובה
    if (!data.firstName || !data.lastName || !data.phone || !data.idNumber) {
      return res.status(400).json({ error: 'חסרים שדות חובה' });
    }

    // בדיקת תקינות מספר זהות
    if (!validateIsraeliId(data.idNumber)) {
      return res.status(400).json({ error: 'מספר זהות לא תקין' });
    }

    // בדיקת כפילות
    const existing = await prisma.borrower.findUnique({
      where: { idNumber: data.idNumber }
    });

    if (existing) {
      return res.status(409).json({ 
        error: `לווה עם מספר זהות זה כבר קיים: ${existing.firstName} ${existing.lastName}` 
      });
    }

    // יצירת לווה
    const borrower = await prisma.borrower.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        city: data.city || '',
        phone: data.phone,
        phone2: data.phone2,
        address: data.address || '',
        email: data.email || '',
        idNumber: data.idNumber,
        notes: data.notes,
        bankCode: data.bankCode,
        branchNumber: data.branchNumber,
        accountNumber: data.accountNumber
      }
    });

    res.status(201).json(borrower);
  } catch (error) {
    console.error('Create borrower error:', error);
    res.status(500).json({ error: 'שגיאה ביצירת לווה' });
  }
});

// עדכן לווה
borrowersRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    // בדוק שהלווה קיים
    const existing = await prisma.borrower.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'לווה לא נמצא' });
    }

    // אם משנים מספר זהות - בדוק תקינות וכפילות
    if (data.idNumber && data.idNumber !== existing.idNumber) {
      if (!validateIsraeliId(data.idNumber)) {
        return res.status(400).json({ error: 'מספר זהות לא תקין' });
      }

      const duplicate = await prisma.borrower.findUnique({
        where: { idNumber: data.idNumber }
      });

      if (duplicate) {
        return res.status(409).json({ error: 'מספר זהות כבר קיים במערכת' });
      }
    }

    const borrower = await prisma.borrower.update({
      where: { id },
      data
    });

    res.json(borrower);
  } catch (error) {
    console.error('Update borrower error:', error);
    res.status(500).json({ error: 'שגיאה בעדכון לווה' });
  }
});

// מחק לווה
borrowersRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // בדוק שאין הלוואות פעילות
    const activeLoans = await prisma.loan.count({
      where: { borrowerId: id, status: 'active' }
    });

    if (activeLoans > 0) {
      return res.status(409).json({ 
        error: 'לא ניתן למחוק לווה עם הלוואות פעילות' 
      });
    }

    await prisma.borrower.delete({ where: { id } });

    res.json({ message: 'לווה נמחק בהצלחה' });
  } catch (error) {
    console.error('Delete borrower error:', error);
    res.status(500).json({ error: 'שגיאה במחיקת לווה' });
  }
});

// חיפוש לפי מספר זהות
borrowersRouter.get('/id-number/:idNumber', async (req: Request, res: Response) => {
  try {
    const borrower = await prisma.borrower.findUnique({
      where: { idNumber: req.params.idNumber },
      include: { loans: true }
    });

    if (!borrower) {
      return res.status(404).json({ error: 'לווה לא נמצא' });
    }

    res.json(borrower);
  } catch (error) {
    console.error('Find by ID number error:', error);
    res.status(500).json({ error: 'שגיאה בחיפוש לווה' });
  }
});
