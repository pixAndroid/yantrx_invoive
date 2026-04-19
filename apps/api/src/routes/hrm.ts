import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticate);

// ─── Employees ──────────────────────────────────────────────────────────────

router.get('/employees', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { search, department, status } = req.query;
    const where: any = { businessId };
    if (status) where.status = status;
    if (department) where.department = { contains: department as string, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { employeeCode: { contains: search as string, mode: 'insensitive' } },
        { designation: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        manager: { select: { id: true, name: true } },
        _count: { select: { attendances: true, leaves: true } },
      },
    });

    res.json({ success: true, data: employees });
  } catch (error) { next(error); }
});

router.post('/employees', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { name, email, phone, employeeCode, designation, department, employmentType, status, joiningDate, salary, bankAccountNo, ifscCode, pan, aadhaar, address, notes, managerId } = req.body;
    if (!name) { res.status(400).json({ success: false, error: 'name is required' }); return; }

    const employee = await prisma.employee.create({
      data: {
        businessId,
        name,
        email: email || null,
        phone: phone || null,
        employeeCode: employeeCode || null,
        designation: designation || null,
        department: department || null,
        employmentType: employmentType || 'FULL_TIME',
        status: status || 'ACTIVE',
        joiningDate: joiningDate ? new Date(joiningDate) : null,
        salary: salary ? parseFloat(salary) : null,
        bankAccountNo: bankAccountNo || null,
        ifscCode: ifscCode || null,
        pan: pan || null,
        aadhaar: aadhaar || null,
        address: address || null,
        notes: notes || null,
        managerId: managerId || null,
      },
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error) { next(error); }
});

router.get('/employees/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const employee = await prisma.employee.findFirst({
      where: { id: req.params.id, businessId },
      include: {
        manager: { select: { id: true, name: true } },
        subordinates: { select: { id: true, name: true, designation: true } },
        leaves: { orderBy: { createdAt: 'desc' }, take: 10 },
        payrollRecords: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 12 },
        attendances: { orderBy: { date: 'desc' }, take: 30 },
      },
    });

    if (!employee) { res.status(404).json({ success: false, error: 'Employee not found' }); return; }
    res.json({ success: true, data: employee });
  } catch (error) { next(error); }
});

router.put('/employees/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const existing = await prisma.employee.findFirst({ where: { id: req.params.id, businessId } });
    if (!existing) { res.status(404).json({ success: false, error: 'Employee not found' }); return; }

    const { name, email, phone, employeeCode, designation, department, employmentType, status, joiningDate, exitDate, salary, bankAccountNo, ifscCode, pan, aadhaar, address, notes, managerId } = req.body;

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        name: name ?? existing.name,
        email: email !== undefined ? email : existing.email,
        phone: phone !== undefined ? phone : existing.phone,
        employeeCode: employeeCode !== undefined ? employeeCode : existing.employeeCode,
        designation: designation !== undefined ? designation : existing.designation,
        department: department !== undefined ? department : existing.department,
        employmentType: employmentType ?? existing.employmentType,
        status: status ?? existing.status,
        joiningDate: joiningDate !== undefined ? (joiningDate ? new Date(joiningDate) : null) : existing.joiningDate,
        exitDate: exitDate !== undefined ? (exitDate ? new Date(exitDate) : null) : existing.exitDate,
        salary: salary !== undefined ? (salary ? parseFloat(salary) : null) : existing.salary,
        bankAccountNo: bankAccountNo !== undefined ? bankAccountNo : existing.bankAccountNo,
        ifscCode: ifscCode !== undefined ? ifscCode : existing.ifscCode,
        pan: pan !== undefined ? pan : existing.pan,
        aadhaar: aadhaar !== undefined ? aadhaar : existing.aadhaar,
        address: address !== undefined ? address : existing.address,
        notes: notes !== undefined ? notes : existing.notes,
        managerId: managerId !== undefined ? managerId : existing.managerId,
      },
    });

    res.json({ success: true, data: employee });
  } catch (error) { next(error); }
});

router.delete('/employees/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const existing = await prisma.employee.findFirst({ where: { id: req.params.id, businessId } });
    if (!existing) { res.status(404).json({ success: false, error: 'Employee not found' }); return; }

    await prisma.employee.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Employee deleted' });
  } catch (error) { next(error); }
});

// ─── Attendance ──────────────────────────────────────────────────────────────

router.get('/attendance', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { date, employeeId, month, year } = req.query;
    const where: any = { businessId };

    if (employeeId) where.employeeId = employeeId;

    if (date) {
      const d = new Date(date as string);
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);
      where.date = { gte: d, lt: nextDay };
    } else if (month && year) {
      const m = parseInt(month as string);
      const y = parseInt(year as string);
      where.date = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: { employee: { select: { id: true, name: true, designation: true, department: true } } },
      orderBy: [{ date: 'desc' }, { employee: { name: 'asc' } }],
    });

    res.json({ success: true, data: attendance });
  } catch (error) { next(error); }
});

router.post('/attendance', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { employeeId, date, checkIn, checkOut, status, hoursWorked, overtime, notes } = req.body;
    if (!employeeId || !date) { res.status(400).json({ success: false, error: 'employeeId and date are required' }); return; }

    const employee = await prisma.employee.findFirst({ where: { id: employeeId, businessId } });
    if (!employee) { res.status(404).json({ success: false, error: 'Employee not found' }); return; }

    const attendance = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: new Date(date) } },
      update: {
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        status: status || 'PRESENT',
        hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null,
        overtime: overtime ? parseFloat(overtime) : null,
        notes: notes || null,
      },
      create: {
        businessId,
        employeeId,
        date: new Date(date),
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        status: status || 'PRESENT',
        hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null,
        overtime: overtime ? parseFloat(overtime) : null,
        notes: notes || null,
      },
    });

    res.status(201).json({ success: true, data: attendance });
  } catch (error) { next(error); }
});

// ─── Leaves ──────────────────────────────────────────────────────────────────

router.get('/leaves', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { employeeId, status, type } = req.query;
    const where: any = { businessId };
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (type) where.type = type;

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, designation: true, department: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: leaves });
  } catch (error) { next(error); }
});

router.post('/leaves', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { employeeId, type, startDate, endDate, days, reason } = req.body;
    if (!employeeId || !startDate || !endDate) { res.status(400).json({ success: false, error: 'employeeId, startDate, endDate are required' }); return; }

    const employee = await prisma.employee.findFirst({ where: { id: employeeId, businessId } });
    if (!employee) { res.status(404).json({ success: false, error: 'Employee not found' }); return; }

    const leave = await prisma.leave.create({
      data: {
        businessId,
        employeeId,
        type: type || 'CASUAL',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days: days ? parseFloat(days) : 1,
        reason: reason || null,
        status: 'PENDING',
      },
    });

    res.status(201).json({ success: true, data: leave });
  } catch (error) { next(error); }
});

router.patch('/leaves/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { status, approvalNote, approvedById } = req.body;
    if (!status || !['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      res.status(400).json({ success: false, error: 'status must be APPROVED, REJECTED, or CANCELLED' });
      return;
    }

    const existing = await prisma.leave.findFirst({ where: { id: req.params.id, businessId } });
    if (!existing) { res.status(404).json({ success: false, error: 'Leave not found' }); return; }

    const leave = await prisma.leave.update({
      where: { id: req.params.id },
      data: { status, approvalNote: approvalNote || null, approvedById: approvedById || null },
    });

    res.json({ success: true, data: leave });
  } catch (error) { next(error); }
});

// ─── Payroll ──────────────────────────────────────────────────────────────────

router.get('/payroll', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { month, year, employeeId, status } = req.query;
    const where: any = { businessId };
    if (month) where.month = parseInt(month as string);
    if (year) where.year = parseInt(year as string);
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const records = await prisma.payrollRecord.findMany({
      where,
      include: { employee: { select: { id: true, name: true, designation: true, department: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    res.json({ success: true, data: records });
  } catch (error) { next(error); }
});

router.post('/payroll', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { employeeId, month, year, basic, hra, allowances, deductions, tax, pfEmployee, pfEmployer, notes } = req.body;
    if (!employeeId || !month || !year) { res.status(400).json({ success: false, error: 'employeeId, month, year are required' }); return; }

    const employee = await prisma.employee.findFirst({ where: { id: employeeId, businessId } });
    if (!employee) { res.status(404).json({ success: false, error: 'Employee not found' }); return; }

    const b = parseFloat(basic) || 0;
    const h = parseFloat(hra) || 0;
    const a = parseFloat(allowances) || 0;
    const d = parseFloat(deductions) || 0;
    const t = parseFloat(tax) || 0;
    const pfe = parseFloat(pfEmployee) || 0;
    const netPay = b + h + a - d - t - pfe;

    const record = await prisma.payrollRecord.upsert({
      where: { employeeId_month_year: { employeeId, month: parseInt(month), year: parseInt(year) } },
      update: { basic: b, hra: h, allowances: a, deductions: d, tax: t, pfEmployee: pfe, pfEmployer: parseFloat(pfEmployer) || 0, netPay, notes: notes || null },
      create: {
        businessId,
        employeeId,
        month: parseInt(month),
        year: parseInt(year),
        basic: b,
        hra: h,
        allowances: a,
        deductions: d,
        tax: t,
        pfEmployee: pfe,
        pfEmployer: parseFloat(pfEmployer) || 0,
        netPay,
        notes: notes || null,
      },
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) { next(error); }
});

router.patch('/payroll/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const { status } = req.body;
    if (!status || !['PROCESSED', 'PAID'].includes(status)) {
      res.status(400).json({ success: false, error: 'status must be PROCESSED or PAID' });
      return;
    }

    const existing = await prisma.payrollRecord.findFirst({ where: { id: req.params.id, businessId } });
    if (!existing) { res.status(404).json({ success: false, error: 'Payroll record not found' }); return; }

    const record = await prisma.payrollRecord.update({
      where: { id: req.params.id },
      data: { status, paidAt: status === 'PAID' ? new Date() : existing.paidAt },
    });

    res.json({ success: true, data: record });
  } catch (error) { next(error); }
});

// ─── HRM Dashboard Stats ──────────────────────────────────────────────────────

router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user!.businessId;
    if (!businessId) { res.status(400).json({ success: false, error: 'Business context required' }); return; }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [totalEmployees, activeEmployees, pendingLeaves, presentToday, totalPayroll] = await Promise.all([
      prisma.employee.count({ where: { businessId } }),
      prisma.employee.count({ where: { businessId, status: 'ACTIVE' } }),
      prisma.leave.count({ where: { businessId, status: 'PENDING' } }),
      prisma.attendance.count({ where: { businessId, date: { gte: today, lt: tomorrow }, status: { in: ['PRESENT', 'HALF_DAY', 'LATE'] } } }),
      prisma.payrollRecord.aggregate({ where: { businessId, status: { in: ['PAID', 'PROCESSED'] }, year: today.getFullYear(), month: today.getMonth() + 1 }, _sum: { netPay: true } }),
    ]);

    const departments = await prisma.employee.groupBy({
      by: ['department'],
      where: { businessId, status: 'ACTIVE', department: { not: null } },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        pendingLeaves,
        presentToday,
        totalPayroll: totalPayroll._sum.netPay || 0,
        departments: departments.map(d => ({ name: d.department, count: d._count })),
      },
    });
  } catch (error) { next(error); }
});

export default router;
