import mongoose from 'mongoose';

const NotificationSchema = mongoose.Schema({
    type: {
        type: String, required: true, default: 'text'
    },
    title: {
        type: String, required: true
    },
    body: {
        type: String, required: true
    },
    image: {
        type: String, default: ''
    },
    icon: {
        type: String, default: ''
    },
    publishNow: {
        type: Boolean, default: true
    },
    pageToLink: {
        type: String, default: ''
    },
    to: {
        type: [Object], default: {}
    },
    publishDate: {
        type: Date, default: Date.now()
    },
    publishTime: {
        type: Date, default: Date.now()
    },
    repeat: {
        type: Boolean, default: false
    },
    days: [{
        name: {
            type: String, default: ''
        },
        value: {
            type: String, default: ''
        },
        selected: {
            type: Boolean, default: false
        }
    }],
    status: {
        type: Boolean, default: false
    },
    sucessCount: {
        type: Number, default: 0
    },
    failsCount: {
        type: Number, default: 0
    },
    publishStatus: {
        type: Boolean, default: false
    }
});

export default mongoose.model('Notifications', NotificationSchema);