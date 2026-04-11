const express = require('express');
const router = express.Router();
const { 
    createCustomer, 
    getCustomers, 
    getCustomer, 
    updateCustomer, 
    addPayment, 
    getCustomerHistory,
    deleteCustomer
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

router.use(protect); // All customer routes protected

router.route('/')
    .post(createCustomer)
    .get(getCustomers);

router.route('/:id')
    .get(getCustomer)
    .put(updateCustomer)
    .delete(deleteCustomer);

router.post('/:id/payments', addPayment);
router.get('/:id/history', getCustomerHistory);

module.exports = router;
