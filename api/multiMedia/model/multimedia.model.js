import mongoose from 'mongoose';

const multimedia = mongoose.Schema({
    type: {
        type: String, required: true
    },
    name: {
        type: String, required: true
    },
    location: {
        type: String, required: true
    },
    school_id: {
        type: String, required: true
    }
});

export default mongoose.model('multimedia', multimedia);