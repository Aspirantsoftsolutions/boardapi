import mongoose from 'mongoose';

const UserReferralsSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    referral: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    referral_code: {
        type: String
    },
    referredDate: {
        type: Date,
        defauult: Date.now()
    },
    userBonus: {
        type: Number
    },
    userDeposit: {
        type: Number
    },
    referralBonus: {
        type: Number
    },
    referralDeposit: {
        type: Number
    }
});

export default mongoose.model('UserReferrals', UserReferralsSchema);