import nodemailer from 'nodemailer';

import { env } from './mail_config'; 

const transporter = nodemailer.createTransport({
    host: env.mail_host,
    port: (env.mail_port ? Number(env.mail_port) : 587),
    secure: Boolean(env.mail_secure),
    auth: {
      type: 'login',
      user: env.mail_username,
      pass: env.mail_passwd
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
    debug: Boolean(env.mail_debug),   // Enable debug output
    logger: Boolean(env.mail_logger)   // Enable logging
  });
  
  const mailOptions = {
    from: env.mail_username,
    to: 'a.b@c.com',
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