import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendMail = async (email, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true cho port 465, false cho các port khác
      auth: {
        user: process.env.EMAIL_USER, // Email của bạn (trong file .env)
        pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng (App Password)
      },
    });

    const mailOptions = {
      from: `"Photography Service" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent: ", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending email: ", error);
    throw new Error("Gửi email thất bại.");
  }
};

export default sendMail;