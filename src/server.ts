import express, { Request, Response } from 'express';

// Create an Express application
const app = express();
const port: number = 3000;

// Define a route
app.get('/', (req: Request, res: Response): void => {
  res.send('Hello World!');
});

// Start the server
app.listen(port, (): void => {
  console.log(`Example app listening on port ${port}`);
});
