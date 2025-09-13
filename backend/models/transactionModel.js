const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            // Income categories
            'salary', 'freelance', 'investment', 'business', 'gift', 'other-income',
            // Expense categories
            'food', 'transportation', 'housing', 'utilities', 'healthcare', 
            'entertainment', 'shopping', 'education', 'travel', 'other-expense'
        ]
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'credit-card', 'debit-card', 'bank-transfer', 'digital-wallet', 'check'],
        default: 'cash'
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Index for better query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);