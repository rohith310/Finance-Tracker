// Convert frontend display format to database format
const toDbCase = (value) => {
    if (!value) return value;
    return value.toLowerCase().replace(/\s+/g, '-');
};

// Convert database format to frontend display format
const toDisplayCase = (value) => {
    if (!value) return value;
    return value
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Convert description to proper case (first letter of each word capitalized)
const toProperCase = (description) => {
    if (!description) return description;
    return description
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Convert transaction object for frontend display
const formatTransactionForFrontend = (transaction) => {
    if (!transaction) return transaction;
    
    const formatted = transaction.toObject ? transaction.toObject() : { ...transaction };
    
    formatted.type = toDisplayCase(formatted.type);
    formatted.category = toDisplayCase(formatted.category);
    formatted.description = toProperCase(formatted.description);
    if (formatted.paymentMethod) {
        formatted.paymentMethod = toDisplayCase(formatted.paymentMethod);
    }
    
    return formatted;
};

// Convert transaction object for database storage
const formatTransactionForDb = (transactionData) => {
    const formatted = { ...transactionData };
    
    if (formatted.type) formatted.type = toDbCase(formatted.type);
    if (formatted.category) formatted.category = toDbCase(formatted.category);
    if (formatted.description) formatted.description = formatted.description.toLowerCase();
    if (formatted.paymentMethod) formatted.paymentMethod = toDbCase(formatted.paymentMethod);
    
    return formatted;
};

module.exports = {
    toDbCase,
    toDisplayCase,
    toProperCase,
    formatTransactionForFrontend,
    formatTransactionForDb
};
