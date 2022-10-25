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

const analytics = [
    async (req, res) => {
        const resp = await paymentModel.aggregate([
            {
                '$facet': {
                    'monthWise': [
                        {
                            '$group': {
                                '_id': {
                                    '$dateToString': {
                                        'date': {
                                            '$dateFromString': {
                                                'dateString': '$paymentDate'
                                            }
                                        },
                                        'format': '%Y-%m'
                                    }
                                },
                                'amount': {
                                    '$sum': '$amount'
                                }
                            }
                        }, {
                            '$sort': {
                                '_id': -1
                            }
                        }
                    ],
                    'tillDate': [
                        {
                            '$group': {
                                '_id': '',
                                'total': {
                                    '$sum': '$amount'
                                }
                            }
                        }
                    ]
                }
            }
        ]);
        return successResponseWithData(res, 'success', resp)
    }
];

export default {
    savePayment,
    payments,
    analytics
}