import mongoose from 'mongoose';

const NotificationSchema = mongoose.Schema({
    type: {
        type: String
    },
    title: {
        type: String
    },
    body: {
        type: String
    },
    image: {
        type: String
    },
    icon: {
        type: String
    },
    publishNow: {
        type: Boolean
    },
    pageToLink: {
        type: String
    },
    userGroup: {
        type: String
    },
    publishDate: {
        type: Date
    },
    publishTime: {
        type: String
    },
    repeat: {
        type: Boolean
    },
    days: [{
        name: {
            type: String
        },
        value: {
            type: String
        },
        selected: {
            type: Boolean
        }
    }],
    status: {
        type: Boolean
    },
    sucessCount: {
        type: Number
    },
    failsCount: {
        type: Number
    },
    publishStatus: {
        type: Boolean
    }
});

export default mongoose.model('Notifications', NotificationSchema);