import serverless from 'serverless-http';
import { connectLambda } from '@netlify/blobs';
import { createApp } from '../../server/app.js';
import { setLambdaEvent } from '../../server/db/blobContext.js';

const app = createApp({ serveStatic: false });
const slsHandler = serverless(app, {
  request(request, event) {
    request.apiGateway = { event };
    setLambdaEvent(event);
    if (event?.blobs) {
      try {
        connectLambda(event);
      } catch (err) {
        console.warn('[api] connectLambda:', err.message);
      }
    }
  },
});

export async function handler(event, context) {
  setLambdaEvent(event);
  if (event?.blobs) {
    try {
      connectLambda(event);
    } catch (err) {
      console.warn('[api] connectLambda outer:', err.message);
    }
  }
  return slsHandler(event, context);
}
