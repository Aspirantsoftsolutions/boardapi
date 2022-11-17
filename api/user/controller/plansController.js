import { ErrorResponseWithData, successResponseWithData } from "../../utils/apiResponse.js";
import PlansSchema from "../model/Plans.model.js";

const getPlans = [
    async (req, res) => {
        try {
            const plans = await PlansSchema.findOne({});
            return successResponseWithData(res, 'Success', plans);
        } catch (error) {
            return ErrorResponseWithData(res, error.message, error)
        }
    }
];
const updatePlans = [
    async (req, res) => {
        try {
            const { basic, premium, enterprise } = req.body;
            const plans = await PlansSchema.findOneAndUpdate({ type: "master" }, { $set: { plans: { basic, premium, enterprise } } }).exec();
            return successResponseWithData(res, 'Success', plans);
        } catch (error) {
            return ErrorResponseWithData(res, error.message, error)
        }
    }
];


export default {
    getPlans,
    updatePlans
}