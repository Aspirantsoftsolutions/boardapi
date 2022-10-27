import activityModel from "../auth/model/activityModel.js";
import paymentModel from "../payment/payment.model.js";
import UserModel from "../user/model/UserModel.js";
import { successResponseWithData } from "../utils/apiResponse.js";

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
    async (req, res) => {
        const resp = await activityModel.aggregate([
            {
                '$facet': {
                    'Teachers': [
                        {
                            '$match': {
                                'activityType': 'login',
                                'info.role': 'Teacher'
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
                    'Students': [
                        {
                            '$match': {
                                'activityType': 'login',
                                'info.role': 'Student'
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
                    'signup': [
                        {
                            '$match': {
                                'activityType': 'signup'
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
                    ]
                }
            }
        ]);
        return successResponseWithData(res, 'success', resp);
    }
];


export default {
    adminAnalytics,
    schoolActivity
}