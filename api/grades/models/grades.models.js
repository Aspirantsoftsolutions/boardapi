import mongoose from "mongoose";


function makeid() {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 3; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

var gradesModel = new mongoose.Schema(
    {
        name: { type: String, required: true },
        school_id: { type: String, required: true },
        students: { type: Array },
        shortId: {
            type: String,
            default: makeid
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("grades", gradesModel);
