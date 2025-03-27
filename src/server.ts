import express, { Application, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Pool } from 'pg';
import { env as dbEnv } from './db_config';

import OpenAI from 'openai';
import { OpenAiClient, OpenAiMessage } from './openAiClient';
import { env as openAiEnv } from './openAi_config'; 

import { auth } from 'express-oauth2-jwt-bearer'
import { env as auth0Env } from './auth0_config'; 

import nodemailer from 'nodemailer';
import { env as mailEnv } from './mail_config'; 
import { promises } from 'dns';
import e from 'express';

// Create an Express application
const app: Application = express();
const port: number = 3000;

// Connect to DB
const pool : Pool = new Pool({
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

// Connect to Auth0 authenticator
const checkJwt = auth({
  audience: auth0Env.auth0_audience, // the identifier of your API
  issuerBaseURL: auth0Env.auth0_domain, // the URL of your Auth0 tenant
});

// Connect to OpenAI
const openai: OpenAI = new OpenAI({
  apiKey: openAiEnv.openAi_key,
  organization : openAiEnv.openAi_Organization,
  project : openAiEnv.openAi_DefaultProject
});

// Middleware to parse JSON bodies
app.use(express.json());

/*app.use((req, res, next) => {
  console.log('language: ', req.headers['x-user-language']);
  next();
});*/

app.get('/retrieveThread', checkJwt, async (req: Request, res: Response): Promise<void> => {
  //console.log( req.auth);
  const resultQuery = await pool.query(
    'SELECT openaithreadid FROM hlschema.emails where oauthuserid = $1',  [req.auth?.payload.sub]
  );

  let openAiClient : OpenAiClient = new OpenAiClient(openai);
  //console.log(resultQuery);
  let openAiMessages : OpenAiMessage[];
  if (resultQuery.rowCount === 0) {

    const thread = await openai.beta.threads.create();

    const resultInsert = await pool.query(
      'INSERT INTO hlschema.emails (oauthuserid, openaithreadid) VALUES ($1, $2)',
      [req.auth?.payload.sub, thread.id]
    );
    
    const userLanguage = typeof req.headers['x-user-language'] === 'string' ? req.headers['x-user-language'] : 'en';
    openAiMessages = await openAiClient.initialiseThread(thread.id, userLanguage, openAiEnv.openAi_ResumeAssistant);
    
  } else {
    let openAiThreadId = resultQuery.rows[0].openaithreadid;
    openAiMessages = await openAiClient.retrieveThread(openAiThreadId);
  }

  res.json(openAiMessages);

});

app.post('/enquiry', checkJwt, async (req: Request, res: Response): Promise<void> => {
  //console.log( req.auth);
  const resultQuery = await pool.query(
    'SELECT openaithreadid FROM hlschema.emails where oauthuserid = $1',  [req.auth?.payload.sub]
  );

  let openAiClient : OpenAiClient = new OpenAiClient(openai);
  //console.log(resultQuery);
  let openAiMessage : OpenAiMessage;
  //console.log(req.body);
  const { userMessage } = req.body;
  let openAiThreadId = resultQuery.rows[0].openaithreadid;
  openAiMessage = await openAiClient.enquiry(openAiThreadId, userMessage, openAiEnv.openAi_ResumeAssistant);
  res.json(openAiMessage);
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
app.get('/verify/:email_hash/:email_random', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'UPDATE hlschema.emails set verified = true where email_hash = $1 and email_random = $2 and verified = false',
      [req.params.email_hash, req.params.email_random]
    );
    
    
    if (result.rowCount === 0) {
      res.json({ success: false, error: 'Email already verified' });
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
interface SubmitEmailRequest extends Request<any, any, { email: string; message: string }> {
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

app.post('/submit-email', async (req: SubmitEmailRequest, res: Response) : Promise<void> => {

  const { email, message } = req.body;

  // Anonymize email with SHA-256 hash
  const hash = crypto.createHash('sha256').update(email).digest('hex');
  const email_random = crypto.randomBytes(16).toString('hex');
  const domain = email.split('@')[1]; // Extract domain for analysis
  const sessionInfo = req.sessionInfo;
  try {
    const result = await pool.query(
      'INSERT INTO hlschema.emails (ip_address, email_hash, email_domain, email_random, message) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email_hash) DO NOTHING',
      [sessionInfo?.ip, hash, domain, email_random, message]
    );
    
    if (result.rowCount === 0) {
      res.json({ success: false, error: 'Email already exists' });
      return;
    }

    const mailOptions = {
      from: mailEnv.mail_username,
      to: email,
      subject: 'Hoffnungland Resume Request',
      text: 'Thank you for your interest. Please verify your email at https://hoffnungland.com/api/verify/' + hash + '/' + email_random
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error){
        res.json({ success: false, error: error});
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
