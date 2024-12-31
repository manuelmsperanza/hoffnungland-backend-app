import {Pool} from 'pg';
import { env } from './db_config'; 

const pool : Pool = new Pool({
    user: env.db_username,
    host: env.db_host,
    database: env.db_name,
    password: env.db_passwd,
    port: (env.db_port ? Number(env.db_port) : 5432),
    ssl: {
      // For many hosted providers, simply "require: true" is enough
      rejectUnauthorized: false
    }
  });
  
  pool.query('SELECT NOW()', (err, res) => {
    console.log(err, res);
    pool.end();
  });