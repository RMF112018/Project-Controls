import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const TENANT_ID = process.env.AAD_TENANT_ID || '';
const CLIENT_ID = process.env.AAD_CLIENT_ID || '';

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
});

function getSigningKey(header: jwt.JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        reject(err);
        return;
      }
      const signingKey = key?.getPublicKey();
      if (!signingKey) {
        reject(new Error('No signing key found'));
        return;
      }
      resolve(signingKey);
    });
  });
}

export interface IValidatedUser {
  email: string;
  displayName: string;
  oid: string;
}

/**
 * Validate an AAD bearer token from an SPFx client.
 * Returns the user claims if valid, throws if invalid.
 */
export async function validateToken(authHeader: string | undefined): Promise<IValidatedUser> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.substring(7);

  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header) {
    throw new Error('Unable to decode token');
  }

  const signingKey = await getSigningKey(decoded.header);

  const verified = jwt.verify(token, signingKey, {
    audience: `api://${CLIENT_ID}`,
    issuer: `https://sts.windows.net/${TENANT_ID}/`,
    algorithms: ['RS256'],
  }) as jwt.JwtPayload;

  return {
    email: (verified.preferred_username || verified.upn || verified.email || '') as string,
    displayName: (verified.name || '') as string,
    oid: (verified.oid || '') as string,
  };
}
