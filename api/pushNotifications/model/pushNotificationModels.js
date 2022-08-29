import mongoose from 'mongoose';

const pushNotifications = mongoose.Schema({
    type: {
        type: String, required: true, default: 'text', enum: ['text', 'audio', 'video', 'image']
    },
    title: {
        type: String, required: true
    },
    description: {
        type: String, required: true
    },
    image: {
        type: String, default: ''
    },
    audio: {
        type: String, default: ''
    },
    video: {
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
    userGroup: {
        type: String, default: ''
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
    publishStatus: {
        type: String, enum: ['sent', 'failed', 'not_sent', 'scheduled'], default: 'not_sent'
    },
    retryCount: {
        type: Number, default: 0
    },
    deviceId: { type: String, required: true },
    jobId: { type: String, required: true }
});

export default mongoose.model('pushNotifications', pushNotifications);