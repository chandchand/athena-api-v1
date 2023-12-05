const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, body) => {
    const email = 'chandrayeager@gmail.com'
    const pass = 'udmv ttsr cxck opqh'
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: email, // Ganti dengan alamat email dan password Gmail Anda
        pass: pass
      },
    });
  
    const mailOptions = {
      from: email,
      to,
      subject,
      text: body,
    };
  
    await transporter.sendMail(mailOptions);
};

module.exports = {sendEmail}