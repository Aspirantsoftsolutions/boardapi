// Load the AWS SDK for Node.js
import AWS from 'aws-sdk'


/**
 * Send SMS through AWS
 * @param {*} message 
 * @param {*} phoneNumber 
 */
const sendSMS = async (message, phoneNumber) => {
    // Create SMS publish parameters
    AWS.config.update(
        {
            accessKeyId: "AKIASQMB4AV7KKF2I5US",
            secretAccessKey: "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",
            region: "us-east-2"
        }
    );
    
    let params = {
        Message: message,
        PhoneNumber: phoneNumber
    }
    let attributes = {
        attributes: {
            'DefaultSMSType': 'Transactional'
        }
    };

    // let publishTextPromise =  new AWS.SNS().setSMSAttributes(attributes).promise();

    // Create promise and SNS service object
    let publishTextPromise = new AWS.SNS().publish(params).promise();

    publishTextPromise.then((data) => {
        console.log(`Message sent to ${phoneNumber}`);
        console.log(data);
        return data;
    }).catch((err) => {
        console.log(err);
        return Promise.reject("There's some error", err);
    })

}

export default {
    sendSMS
}