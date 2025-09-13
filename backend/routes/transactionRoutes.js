const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
    getAllTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionSummary
} = require('../controllers/transactionController');

const router = express.Router();

router.get('/', authMiddleware, getAllTransactions);
router.get('/summary/stats', authMiddleware, getTransactionSummary);
router.get('/:id', authMiddleware, getTransactionById);
router.post('/', authMiddleware, createTransaction);
router.put('/:id', authMiddleware, updateTransaction);
router.delete('/:id', authMiddleware, deleteTransaction);

module.exports = router;