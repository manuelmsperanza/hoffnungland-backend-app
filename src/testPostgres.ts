import {Pool} from 'pg';
import { env as dbEnv } from './db_config'; 

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
  
  pool.query('SELECT NOW()', (err, res) => {
    console.log(err, res);
    pool.end();
  });