import nodemailer from "nodemailer";

async function main(email, otp) {
  console.log(otp);
  let transporter = nodemailer.createTransport({
    host: "bh-in-34.webhostbox.net",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "info@tryoutweb.com", // generated ethereal user
      pass: "[CN%lh)n~j5?", // generated ethereal password
    },    
  });

  let info = await transporter.sendMail({
    from: "info@tryoutweb.com", // sender address
    to: email, // list of receivers
    subject: "Welcome to StreamBoard", // Subject line
    html: `${otp} `, // html body
  });

  console.log("Message sent: %s", info.messageId);

  // Preview only available when sending through an Ethereal account
  // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: htps://ethereal.email/message/WaQKMgKddxQDoou...
}

export default main;
