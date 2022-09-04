import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: String, required: true },
    qrInfo: { type: String, required: true, unique: true },
    loginType: { type: String, required: true },
    status: { type: String, required: true },
}, { timestamps: true });

schema.virtual('isExpired').get(function () {
    return Date.now() >= this.expires;
});

schema.virtual('isActive').get(function () {
    return !this.revoked && !this.isExpired;
});

schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret._id;
        delete ret.id;
        delete ret.user;
    }
});

export default mongoose.model('loginSessions', schema);