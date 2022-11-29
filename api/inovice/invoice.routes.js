import express from 'express';
import invoiceController from './invoice.controller.js';
let invoiceRouter = express.Router();

invoiceRouter.post('/sendInvoice', invoiceController.sendInvoice);

export default invoiceRouter;