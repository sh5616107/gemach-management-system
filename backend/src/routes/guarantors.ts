import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';
import { validateIsraeliId } from '../utils/validators';

export const guarantorsRouter = Router();

guarantorsRouter.use(authMiddleware);

// קבל את כל הערבים
guarantorsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const guarantors = await prisma.guarantor.findMany({
      include: {
        loansAsGuarantor1: true,
        loansAsGuarantor2: true,
        debts: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(guarantors);
  } catch (error) {
    console.error('Get guarantors error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת ערבים' });
  }
});

// קבל ערב ספציפי
guarantorsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const guarantor = await prisma.guarantor.findUnique({
      where: { id },
      include: {
        loansAsGuarantor1: {
          include: { borrower: true }
        },
        loansAsGuarantor2: {
          include: { borrower: true }
        },
        debts: true
      }
    });

    if (!guarantor) {
      return res.status(404).json({ error: 'ערב לא נמצא' });
    }

    res.json(guarantor);
  } catch (error) {
    console.error('Get guarantor error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת ערב' });
  }
});

// צור ערב חדש
guarantorsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    if (!data.firstName || !data.lastName || !data.idNumber || !data.phone) {
      return res.status(400).json({ error: 'חסרים שדות חובה' });
    }

    if (!validateIsraeliId(data.idNumber)) {
      return res.status(400).json({ error: 'מספר זהות לא תקין' });
    }

    // בדיקת כפילות
    const existing = await prisma.guarantor.findUnique({
      where: { idNumber: data.idNumber }
    });

    if (existing) {
      return res.status(409).json({ 
        error: `ערב עם מספר זהות זה כבר קיים: ${existing.firstName} ${existing.lastName}` 
      });
    }

    const guarantor = await prisma.guarantor.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        idNumber: data.idNumber,
        phone: data.phone,
        email: data.email,
        address: data.address,
        notes: data.notes,
        status: data.status || 'active',
        bankCode: data.bankCode,
        branchNumber: data.branchNumber,
        accountNumber: data.accountNumber
      }
    });

    res.status(201).json(guarantor);
  } catch (error) {
    console.error('Create guarantor error:', error);
    res.status(500).json({ error: 'שגיאה ביצירת ערב' });
  }
});

// עדכן ערב
guarantorsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    const guarantor = await prisma.guarantor.update({
      where: { id },
      data
    });

    res.json(guarantor);
  } catch (error) {
    console.error('Update guarantor error:', error);
    res.status(500).json({ error: 'שגיאה בעדכון ערב' });
  }
});

// מחק ערב
guarantorsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // בדוק שאין הלוואות פעילות
    const activeLoans = await prisma.loan.count({
      where: {
        OR: [
          { guarantor1Id: id },
          { guarantor2Id: id }
        ],
        status: 'active'
      }
    });

    if (activeLoans > 0) {
      return res.status(409).json({ 
        error: 'לא ניתן למחוק ערב עם הלוואות פעילות' 
      });
    }

    await prisma.guarantor.delete({ where: { id } });
    res.json({ message: 'ערב נמחק בהצלחה' });
  } catch (error) {
    console.error('Delete guarantor error:', error);
    res.status(500).json({ error: 'שגיאה במחיקת ערב' });
  }
});
