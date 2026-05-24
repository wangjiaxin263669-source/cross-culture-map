/**
 * Netlify Functions 下初始化 Blobs 上下文（每次请求前调用）
 */
let lastEvent = null;

export function setLambdaEvent(event) {
  if (event) lastEvent = event;
}

export function getLambdaEvent() {
  return lastEvent;
}

export async function ensureBlobsReady(event = lastEvent) {
  const { connectLambda, setEnvironmentContext } = await import('@netlify/blobs');

  if (event?.blobs) {
    try {
      connectLambda(event);
      return true;
    } catch (err) {
      console.warn('[blobs] connectLambda:', err.message);
    }
  }

  const rawCtx = process.env.NETLIFY_BLOBS_CONTEXT;
  if (rawCtx) {
    try {
      const decoded = JSON.parse(Buffer.from(rawCtx, 'base64').toString('utf8'));
      setEnvironmentContext(decoded);
      return true;
    } catch (err) {
      console.warn('[blobs] NETLIFY_BLOBS_CONTEXT decode:', err.message);
    }
  }

  const siteID =
    process.env.SITE_ID ||
    process.env.NETLIFY_SITE_ID ||
    event?.headers?.['x-nf-site-id'] ||
    event?.headers?.['X-Nf-Site-Id'];
  const token =
    process.env.NETLIFY_AUTH_TOKEN ||
    process.env.NETLIFY_API_TOKEN ||
    process.env.NETLIFY_PAT;
  const deployID =
    process.env.DEPLOY_ID ||
    process.env.CONTEXT ||
    event?.headers?.['x-nf-deploy-id'] ||
    'production';

  if (siteID && token) {
    setEnvironmentContext({
      siteID,
      token,
      edgeURL: 'https://api.netlify.com',
      uncachedEdgeURL: 'https://api.netlify.com',
      deployID,
    });
    return true;
  }

  return false;
}
