const Transaction = require('../models/transactionModel');
const { formatTransactionForFrontend, formatTransactionForDb, toDbCase } = require('../utils/caseUtils');

// Get all transactions for authenticated user
exports.getAllTransactions = async (req, res) => {
    try {
        const { type, category, startDate, endDate, limit = 50, page = 1 } = req.query;
        
        // Build filter object
        const filter = { userId: req.user._id };
        
        if (type) filter.type = toDbCase(type);
        if (category) filter.category = toDbCase(category);
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;
        
        const transactions = await Transaction.find(filter)
            .sort({ date: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Transaction.countDocuments(filter);

        // Format transactions for frontend
        const formattedTransactions = transactions.map(formatTransactionForFrontend);

        res.json({
            transactions: formattedTransactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single transaction by ID
exports.getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json(formatTransactionForFrontend(transaction));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create new transaction
exports.createTransaction = async (req, res) => {
    try {
        const { amount, type, category, description, date, paymentMethod, tags } = req.body;

        // Validation
        if (!amount || !type || !category || !description) {
            return res.status(400).json({ 
                message: 'Required fields: amount, type, category, description' 
            });
        }

        // Convert frontend data to database format
        const dbData = formatTransactionForDb(req.body);

        const transaction = new Transaction({
            userId: req.user._id,
            amount: dbData.amount,
            type: dbData.type,
            category: dbData.category,
            description: dbData.description,
            date: dbData.date || new Date(),
            paymentMethod: dbData.paymentMethod,
            tags: dbData.tags
        });

        await transaction.save();
        res.status(201).json(formatTransactionForFrontend(transaction));
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// Update transaction
exports.updateTransaction = async (req, res) => {
    try {
        // Convert frontend data to database format
        const dbData = formatTransactionForDb(req.body);
        const { amount, type, category, description, date, paymentMethod, tags } = dbData;

        // Build update object with only provided fields
        const updateFields = {};
        if (amount !== undefined) updateFields.amount = amount;
        if (type !== undefined) updateFields.type = type;
        if (category !== undefined) updateFields.category = category;
        if (description !== undefined) updateFields.description = description;
        if (date !== undefined) updateFields.date = date;
        if (paymentMethod !== undefined) updateFields.paymentMethod = paymentMethod;
        if (tags !== undefined) updateFields.tags = tags;

        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            updateFields,
            { new: true, runValidators: true }
        );

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json(formatTransactionForFrontend(transaction));
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete transaction
exports.deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get transaction summary/stats
exports.getTransactionSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const filter = { userId: req.user._id };
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const summary = await Transaction.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalIncome = summary.find(s => s._id === 'income')?.total || 0;
        const totalExpense = summary.find(s => s._id === 'expense')?.total || 0;
        const balance = totalIncome - totalExpense;

        res.json({
            totalIncome,
            totalExpense,
            balance,
            transactionCount: summary.reduce((acc, s) => acc + s.count, 0)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};