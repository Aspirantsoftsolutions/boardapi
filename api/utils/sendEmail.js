import nodemailer from "nodemailer";

async function main(email, otp) {
  console.log(otp);
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "devwo45@gmail.com", // generated ethereal user
      pass: "Devwo123", // generated ethereal password
    },
  });

  let info = await transporter.sendMail({
    from: "StreamBoard", // sender address
    to: email, // list of receivers
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
