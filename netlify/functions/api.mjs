import serverless from 'serverless-http';
import { connectLambda } from '@netlify/blobs';
import { createApp } from '../../server/app.js';

const app = createApp({ serveStatic: false });
const slsHandler = serverless(app);

export async function handler(event, context) {
  if (event?.blobs) {
    try {
      connectLambda(event);
    } catch (err) {
      console.warn('[blobs] connectLambda:', err.message);
    }
  }
  return slsHandler(event, context);
}
