const Sale = require('../models/Sale');

const generateInvoiceNo = async () => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const prefix = `INV-${year}${month}${day}`;

    // Find last invoice of the day
    const lastInvoice = await Sale.findOne(
        { invoiceNo: { $regex: `^${prefix}` } },
        { invoiceNo: 1 },
        { sort: { invoiceNo: -1 } }
    );

    let sequence = 1;
    if (lastInvoice) {
        const lastSeq = parseInt(lastInvoice.invoiceNo.split('-')[2]) || 0;
        sequence = lastSeq + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

module.exports = generateInvoiceNo;
