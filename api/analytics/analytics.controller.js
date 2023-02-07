import activityModel from "../auth/model/activityModel.js";
import paymentModel from "../payment/payment.model.js";
import UserModel from "../user/model/UserModel.js";
import { ErrorResponseWithData, successResponseWithData, validationErrorWithData } from "../utils/apiResponse.js";
import validator, { param,validationResult } from "express-validator";

const adminAnalytics = [
    async (req, res) => {
        const paymentsInfo = await paymentModel.aggregate([
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

        // const usersInfo = await UserModel.aggregate([
        //     {
        //         '$facet': {
        //             'totalUsers': [
        //                 {
        //                     '$group': {
        //                         '_id': '',
        //                         'amount': {
        //                             '$sum': 1
        //                         }
        //                     }
        //                 }
        //             ],
        //             'enterpriseUsers': [
        //                 {
        //                     '$match': {
        //                         'plan': 'Enterprise',
        //                         'role': 'School'
        //                     }
        //                 }, {
        //                     '$group': {
        //                         '_id': '',
        //                         'amount': {
        //                             '$sum': 1
        //                         }
        //                     }
        //                 }
        //             ],
        //             'professional': [
        //                 {
        //                     '$match': {
        //                         'plan': 'Premium',
        //                         'role': 'School'
        //                     }
        //                 }, {
        //                     '$group': {
        //                         '_id': '',
        //                         'amount': {
        //                             '$sum': 1
        //                         }
        //                     }
        //                 }
        //             ],
        //             'basic': [
        //                 {
        //                     '$match': {
        //                         'plan': 'Free',
        //                         'role': 'Individual'
        //                     }
        //                 }, {
        //                     '$group': {
        //                         '_id': '',
        //                         'amount': {
        //                             '$sum': 1
        //                         }
        //                     }
        //                 }
        //             ]
        //         }
        //     }, {
        //         '$unwind': {
        //             'path': '$totalUsers'
        //         }
        //     }, {
        //         '$unwind': {
        //             'path': '$enterpriseUsers'
        //         }
        //     }, {
        //         '$unwind': {
        //             'path': '$professional'
        //         }
        //     }, {
        //         '$unwind': {
        //             'path': '$basic'
        //         }
        //     }
        // ]);
        return successResponseWithData(res, 'success', paymentsInfo)
    }
];

const schoolActivity = [
    param("userId").not().isEmpty().isLength({ min: 12 }),
    async (req, res) => {
        try {
            console.log(req.body);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return validationErrorWithData(
                    res,
                    'Validation error',
                    errors.array()
                );
            } else {
                const resp = await activityModel.aggregate([
                    {
                        '$facet': {
                            'Teachers': [
                                {
                                    '$match': {
                                        'activityType': 'login',
                                        'info.role': 'Teacher',
                                        'schoolId': req.params.userId
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
                                }, { '$limit': 15 }
                            ],
                            'Students': [
                                {
                                    '$match': {
                                        'activityType': 'login',
                                        'info.role': 'Student',
                                        'schoolId': req.params.userId
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
                                }, { '$limit': 15 }
                            ],
                            'signup': [
                                {
                                    '$match': {
                                        'activityType': 'signup',
                                        'schoolId': req.params.userId
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
                                }, { '$limit': 15 }
                            ]
                        }
                    }
                ]);
                return successResponseWithData(res, 'success', resp);
            }

        } catch (err) {
            return ErrorResponseWithData(res, 'No Activity', {...err});
        }
    }
];


export default {
    adminAnalytics,
    schoolActivity
}