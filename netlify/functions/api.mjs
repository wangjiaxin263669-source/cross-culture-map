import serverless from 'serverless-http';
import { connectLambda } from '@netlify/blobs';
import { createApp } from '../../server/app.js';

const app = createApp({ serveStatic: false });

export const handler = serverless(app, {
  request(request, event) {
    request.apiGateway = { event };
    try {
      connectLambda(event);
    } catch (err) {
      console.warn('[blobs] connectLambda:', err.message);
    }
  },
});
