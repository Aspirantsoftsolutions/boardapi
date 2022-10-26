import { body, query } from "express-validator";
import { successResponseWithData } from "../utils/apiResponse.js";
import paymentModel from "./payment.model.js";


const savePayment = [
    body('amount').notEmpty().isNumeric(),
    body('comments').notEmpty().isString(),
    body('clientId').notEmpty().isString(),
    body('paymentType').notEmpty().isString(),
    body('paymentDate').notEmpty().isString(),
    async (req, res) => {
        const resp = await paymentModel.create({ ...req.body, paymentDate: req.body.paymentDate[0] });
        return successResponseWithData(res, 'success', resp)
    }
];

const payments = [
    async (req, res) => {
        const resp = await paymentModel.find({}).populate('clientId');
        return successResponseWithData(res, 'success', resp)
    }
];


export default {
    savePayment,
    payments
}