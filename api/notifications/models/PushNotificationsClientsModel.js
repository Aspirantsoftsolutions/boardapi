import mongoose from 'mongoose';

const PushNotificationsClientsSchema = mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    token: {
        type: String
    },
    deviceId: {
        type: String
    },
    deviceType: {
        type: String
    },
}, {
    timestamps: true
});

export default mongoose.model('PushNotificationsClients', PushNotificationsClientsSchema);