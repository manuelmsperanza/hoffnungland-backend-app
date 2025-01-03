import nodemailer from 'nodemailer';
import { env as mailEnv } from './mail_config'; 

const transporter = nodemailer.createTransport({
    host: mailEnv.mail_host,
    port: (mailEnv.mail_port ? Number(mailEnv.mail_port) : 587),
    secure: Boolean(mailEnv.mail_secure),
    auth: {
      type: 'login',
      user: mailEnv.mail_username,
      pass: mailEnv.mail_passwd
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
    debug: Boolean(mailEnv.mail_debug),   // Enable debug output
    logger: Boolean(mailEnv.mail_logger)   // Enable logging
  });
  
  const mailOptions = {
    from: mailEnv.mail_username,
    to: mailEnv.mail_default_receiver,
    subject: 'Your Resume Request',
    text: 'Thank you for your interest. Here is my resume.'
  };

  /*transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });*/

  transporter.sendMail(mailOptions, (error, info) => {
    if (error){
        console.log(error);
    }else {
        console.log('Email sent: ' + info.response);
    }
  });