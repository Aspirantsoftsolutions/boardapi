import activityModel from "../auth/model/activityModel.js";
import paymentModel from "../payment/payment.model.js";
import { successResponseWithData } from "../utils/apiResponse.js";

const paymentAnalytics = [
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

const loginActivity = [
    async (req, res) => {
        const resp = await activityModel.aggregate([
            {
                '$facet': {
                    'dayWise': [
                        {
                            '$match': {
                                'activityType': 'login'
                            }
                        }, {
                            '$group': {
                                '_id': {
                                    '$dateToString': {
                                        'date': '$createdAt',
                                        'format': '%Y-%m-%d'
                                    }
                                },
                                'amount': {
                                    '$sum': 1
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
                                    '$sum': 1
                                }
                            }
                        }
                    ]
                }
            }
        ]);
        return successResponseWithData(res, 'success', resp);
    }
];


export default {
    paymentAnalytics,
    loginActivity
}