
import { Expense } from "../models/Expense.model.js";
import { Invoice } from "../models/Invoice.model.js";
import { Payment } from "../models/Payment.model.js";
import { Ledger } from "../models/Ledger.model.js";



// --- Expenses ---
export const getExpenseById = async (id) => {
  return await Expense.findById(id).populate("createdBy", "name")
};

export const getAllExpenses = async (user, { search, companyName,category, status, startDate, endDate, page = 1, limit = 10 }) => {
  const query = {};
  if (search) {
    query.$or = [
      { description: { $regex: search, $options: "i" } },
      { referenceNo: { $regex: search, $options: "i" } },
      { companyName: { $regex: search, $options: "i" } }
    ];
  }
  if (companyName) query.companyName = { $regex: companyName, $options: "i" };
  if (category) query.category = category;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const expenses = await Expense.find(query)
    .populate("createdBy", "name")
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalCount = await Expense.countDocuments(query);
  return {
    content: expenses,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: parseInt(page),
    limit: parseInt(limit)
  };
};

export const createExpense = async (data, user) => {

  const expense = await Expense.create({ ...data, createdBy: user.id });
  
  // Create Ledger entry with snapshot balance and companyName
  await Ledger.create({
    date: data.date,
    description: `Expense: ${data.category} - ${data.description || ''}`,
    companyName: data.companyName,
    debit: data.totalAmount,
    credit: 0,
    balance: data.totalAmount,
    referenceId: expense._id,
    referenceType: 'Expense',
    createdBy: user.id
  });

  return expense;
};

export const updateExpense = async (id, data) => {
  const expense = await Expense.findByIdAndUpdate(id, data, { new: true });
  
  // Sync Ledger
  await Ledger.findOneAndUpdate(
    { referenceId: id, referenceType: 'Expense' },
    {
      date: data.date,
      description: `Expense: ${data.category} - ${data.description || ''}`,
      companyName: data.companyName,
      debit: data.totalAmount,
      balance: data.totalAmount
    }
  );

  return expense;
};

export const deleteExpense = async (id) => {
  await Expense.findByIdAndDelete(id);
  await Ledger.findOneAndDelete({ referenceId: id, referenceType: 'Expense' });
};

// --- Invoices ---
export const getAllInvoices = async (user, { search, status, startDate, endDate, page = 1, limit = 10 }) => {
  const query = {};
  if (search) {
    query.$or = [
      { invoiceNo: { $regex: search, $options: "i" } },
      { notes: { $regex: search, $options: "i" } }
    ];
  }
  if (status) query.status = status;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const invoices = await Invoice.find(query)
    .populate("customerId", "name company")
    .populate("createdBy", "name")
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalCount = await Invoice.countDocuments(query);
  return {
    content: invoices,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: parseInt(page),
    limit: parseInt(limit)
  };
};

export const createInvoice = async (data, user) => {
  const invoice = await Invoice.create({ ...data, createdBy: user.id });
  return invoice;
};

export const getInvoiceById = async (id) => {
  return await Invoice.findById(id).populate("customerId", "name company").populate("createdBy", "name");
};

export const updateInvoice = async (id, data) => {
  const invoice = await Invoice.findByIdAndUpdate(id, data, { new: true });
  return invoice;
};

export const deleteInvoice = async (id) => {
  return await Invoice.findByIdAndDelete(id);
};

// --- Payments ---
export const getAllPayments = async (user, { search, companyName,type, startDate, endDate, page = 1, limit = 10 }) => {
  const query = {};
  if (search) {
    query.$or = [
      { transactionId: { $regex: search, $options: "i" } },
      { remarks: { $regex: search, $options: "i" } },
      { companyName: { $regex: search, $options: "i" } }
    ];
  }
  if (companyName) query.companyName = { $regex: companyName, $options: "i" };
  if (type) query.type = type;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const payments = await Payment.find(query)
    .populate("createdBy", "name")
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalCount = await Payment.countDocuments(query);
  return {
    content: payments,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: parseInt(page),
    limit: parseInt(limit)
  };
};

export const createPayment = async (data, user) => {


  const payment = await Payment.create({ ...data, createdBy: user.id });

  // Create Ledger entry for tracking movement in the allocation account
  await Ledger.create({
    date: data.date,

    description: `Payment ${data.type}: ${data.remarks || 'Standard Registry Entry'}`,
    companyName: data.companyName,
    debit: data.type === 'Paid' ? data.amount : 0,
    credit: data.type === 'Received' ? data.amount : 0,
    referenceId: payment._id,
    balance: data.amount,
    referenceType: 'Payment',
    createdBy: user.id
  });

  return payment;
};

export const getPaymentById = async (id) => {
  return await Payment.findById(id).populate("createdBy", "name")
};

export const deletePayment = async (id) => {
  await Payment.findByIdAndDelete(id);
  await Ledger.findOneAndDelete({ referenceId: id, referenceType: 'Payment' });
};

export const updatePayment = async (id, data) => {
  const payment = await Payment.findByIdAndUpdate(id, data, { new: true });

  // Sync Ledger
  await Ledger.findOneAndUpdate(
    { referenceId: id, referenceType: 'Payment' },
    {
      date: data.date,
      description: `Payment ${data.type}: ${data.remarks || 'Standard Registry Entry'}`,
      companyName: data.companyName,
      debit: data.type === 'Paid' ? data.amount : 0,
      credit: data.type === 'Received' ? data.amount : 0,
      balance: data.amount
    }
  );

  return payment;
};

// --- Ledger ---
export const getLedgerEntries = async (user, { search, companyName, startDate, endDate, page = 1, limit = 50 }) => {
  const query = {};
  if (companyName) query.companyName = { $regex: companyName, $options: "i" };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  if (search) {
    query.$or = [
      { description: { $regex: search, $options: "i" } },
      { referenceType: { $regex: search, $options: "i" } },
      { companyName: { $regex: search, $options: "i" } }
    ];
  }

  const entries = await Ledger.find(query)
    .populate("createdBy", "name")
    .sort({ date: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalCount = await Ledger.countDocuments(query);

  // Calculate opening balance if startDate is provided
  let openingBalance = 0;
  if (startDate) {
    const openingStats = await Ledger.aggregate([
      { 
        $match: { 
          date: { $lt: startDate },
          ...(companyName ? { companyName: { $regex: companyName, $options: "i" } } : {})
        } 
      },
      {
        $group: {
          _id: null,
          totalDebit: { $sum: "$debit" },
          totalCredit: { $sum: "$credit" }
        }
      }
    ]);
    openingBalance = (openingStats[0]?.totalCredit || 0) - (openingStats[0]?.totalDebit || 0);
  }

  // Calculate totals for the entire filtered set (current period)
  const stats = await Ledger.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalDebit: { $sum: "$debit" },
        totalCredit: { $sum: "$credit" }
      }
    }
  ]);

  return {
    content: entries,
    totalCount,
    totalDebit: stats[0]?.totalDebit || 0,
    totalCredit: stats[0]?.totalCredit || 0,
    openingBalance,
    closingBalance: openingBalance + (stats[0]?.totalCredit || 0) - (stats[0]?.totalDebit || 0),
    totalPages: Math.ceil(totalCount / limit),
    currentPage: parseInt(page),
    limit: parseInt(limit)
  };
};

export const getFinanceDashboardStats = async (user) => {
  // 1. Summary Stats
  const globalStats = await Ledger.aggregate([
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$credit" },
        totalExpenses: { $sum: "$debit" }
      }
    }
  ]);

  // 2. Income by Company (Top 10)
  const incomeByCompany = await Ledger.aggregate([
    { $match: { credit: { $gt: 0 } } },
    {
      $group: {
        _id: "$companyName",
        total: { $sum: "$credit" }
      }
    },
    { $sort: { total: -1 } },
    { $limit: 10 },
    {
      $project: {
        name: { $ifNull: ["$_id", "Other / General"] },
        value: "$total",
        _id: 0
      }
    }
  ]);

  // 3. Monthly Trends (Last 6 months)
  const monthlyTrendsStyle = await Ledger.aggregate([
    {
      $group: {
        _id: { $substr: ["$date", 0, 7] }, // Group by YYYY-MM
        income: { $sum: "$credit" },
        expenses: { $sum: "$debit" }
      }
    },
    { $sort: { "_id": 1 } },
    { $limit: 6 },
    {
      $project: {
        month: "$_id",
        income: 1,
        expenses: 1,
        _id: 0
      }
    }
  ]);

  return {
    summary: {
      totalRevenue: globalStats[0]?.totalIncome || 0,
      totalExpenses: globalStats[0]?.totalExpenses || 0,
      netProfit: (globalStats[0]?.totalIncome || 0) - (globalStats[0]?.totalExpenses || 0)
    },
    incomeByCompany,
    monthlyTrends: monthlyTrendsStyle
  };
};
