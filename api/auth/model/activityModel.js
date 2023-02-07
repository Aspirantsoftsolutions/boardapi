import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activityType: {
        type: String, required: true
    },
    info: {
        type: Schema.Types.Mixed
    },
    schoolId: { type: String }
}, { timestamps: true });

export default mongoose.model('activity', schema);