import { ErrorResponseWithData, successResponseWithData } from "../utils/apiResponse.js"
import mailer from "../utils/sendEmail.js";
import * as path from "path";

const sendInvoice = [async (req, res) => {
    try {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const d = new Date();
        const email = "sales@thestreamboard.com";
        const template = "";
        const subject = `Invoice for the current month ${monthNames[d.getMonth()]}`;
        const filePath = path.join(path.dirname('.'), './invoice.pdf')
        const attachments = [{
            filename: 'invoice.pdf',
            path: `${filePath}`,
            contentType: 'application/pdf'
        }];
        const resp = mailer(email, template, subject, attachments);
        return successResponseWithData(res, 'success', resp);
    } catch (error) {
        return ErrorResponseWithData(res, 'failed', error, 500)
    }
}]


export default {
    sendInvoice
}