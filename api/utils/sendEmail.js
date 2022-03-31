import nodemailer from "nodemailer";

async function main(email, otp) {
  console.log(otp);
  let transporter = nodemailer.createTransport({
    // host: "smtp.gmail.com",
    // port: 465,
    // secure: false, // true for 465, false for other ports
    // auth: {
    //   user: "helpful9786@gmail.com", // generated ethereal user
    //   pass: "987654fdsa", // generated ethereal password
    // },
    service: 'gmail',
    auth: {
        user: 'helpful9786@gmail.com',
        pass: '987654fdsa'
    }
  });

  let info = await transporter.sendMail({
    from: "helpful9786@gmail.com", // sender address
    to: 'venkat.gsvs@gmail.com', // list of receivers
    subject: "OTP", // Subject line
    text: `${otp} `, // plain text body
    html: `${otp} `, // html body
  });

  console.log("Message sent: %s", info.messageId);

  // Preview only available when sending through an Ethereal account
  // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: htps://ethereal.email/message/WaQKMgKddxQDoou...
}

export default main;
