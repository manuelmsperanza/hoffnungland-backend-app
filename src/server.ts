import express, { Application, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Pool } from 'pg';
import { env as dbEnv } from './db_config';

import nodemailer from 'nodemailer';
import { env as mailEnv } from './mail_config'; 
// Create an Express application
const app: Application = express();
const port: number = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to DB
const pool = new Pool({
  user: dbEnv.db_username,
  host: dbEnv.db_host,
  database: dbEnv.db_name,
  password: dbEnv.db_passwd,
  port: (dbEnv.db_port ? Number(dbEnv.db_port) : 5432),
  ssl: {
    // For many hosted providers, simply "require: true" is enough
    rejectUnauthorized: false
  }
});


// Connect to mail server
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

// Middleware to log session info
app.use('/submit-email', (req: Request, res: Response, next: NextFunction) => {

  const sessionInfo = {
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, // Client IP
    protocol: req.headers['x-forwarded-proto'], // HTTP or HTTPS
    userAgent: req.headers['user-agent'], // User agent
    referer: req.headers['referer'] || 'N/A', // Referrer
    timestamp: new Date().toISOString() // Session start time
  };

  console.log('Session Information:', sessionInfo);

  // Store session info in request object for further use
  (req as any).sessionInfo = sessionInfo;
  next();
});

// Define a route
app.get('/verify/:email_hash', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'UPDATE hlschema.emails set verified = true where email_hash = $1 and verified = false',
      [req.params.email_hash]
    );
    
    
    if (result.rowCount === 0) {
      res.status(400).json({ error: 'Email already verified' });
      return;
    }

    const mailOptions = {
      from: mailEnv.mail_username,
      to: mailEnv.mail_default_receiver,
      subject: 'Hoffnungland Resume Request - Requestor verified',
      text: req.params.email_hash + ' has verified their email'
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error){
          console.log(error);
      }else {
          console.log('Email sent: ' + info.response);
      }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Define the request body type for /submit-email route
interface SubmitEmailRequest extends Request {
  body: {
    email: string;
    message : string
  };
  sessionInfo?: {
    ip: string | string[];
    protocol: string | undefined;
    userAgent: string | undefined;
    referer: string | undefined;
    timestamp: string;
  };
}

app.post('/submit-email', async (req: SubmitEmailRequest, res: Response) => {

  const { email, message } = req.body;

  // Anonymize email with SHA-256 hash
  const hash = crypto.createHash('sha256').update(email).digest('hex');
  const domain = email.split('@')[1]; // Extract domain for analysis
  const sessionInfo = req.sessionInfo;
  try {
    const result = await pool.query(
      'INSERT INTO hlschema.emails (ip_address, email_hash, email_domain, message) VALUES ($1, $2, $3, $4) ON CONFLICT (email_hash) DO NOTHING',
      [sessionInfo?.ip, hash, domain, message]
    );
    
    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const mailOptions = {
      from: mailEnv.mail_username,
      to: email,
      subject: 'Hoffnungland Resume Request',
      text: 'Thank you for your interest. Please verify your email at http://hoffnungland.com/verify/' + hash
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error){
          console.log(error);
      }else {
          console.log('Email sent: ' + info.response);
      }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Start the server
app.listen(port, (): void => {
  console.log(`Example app listening on port ${port}`);
});
