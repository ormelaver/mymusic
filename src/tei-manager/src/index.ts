import 'dotenv/config';
import { app } from './app';

const PORT = process.env.PORT || 8080;

const start = async () => {
  console.log('Starting up...');
  try {
    app.listen(PORT, () => {
      console.log(process.env.PORT);
      console.log('server listening on port ' + PORT);
    });
  } catch (error: any) {
    throw error;
  }
};

try {
  start();
} catch (error) {
  console.error(error);
}
