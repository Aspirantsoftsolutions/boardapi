import express from "express";
import paymentsController from './payment.controller.js';

let paymentRouter = express.Router();

paymentRouter.post('/', paymentsController.savePayment);
paymentRouter.get('/', paymentsController.payments);
paymentRouter.get('/analytics', paymentsController.analytics);

export default paymentRouter;
