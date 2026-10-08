import { checkEnv, validateEnv } from './env.validation';

const productionEnv = {
  NODE_ENV: 'production',
  JWT_SECRET: 's',
  REFRESH_JWT_SECRET: 's',
  MONGO_URI: 'mongodb://x',
  FRONTEND_URL: 'https://app.example.com',
  GROQ_API_KEY: 'k',
  GEMINI_API_KEY: 'k',
  QDRANT_URL: 'https://q',
  QDRANT_API_KEY: 'k',
  LLAMA_CLOUD_API_KEY: 'k',
  CLOUDINARY_CLOUD_NAME: 'c',
  CLOUDINARY_API_KEY: 'k',
  CLOUDINARY_API_SECRET: 's',
  CLIENT_ID: 'id',
  CLIENT_SECRET: 'secret',
  GOOGLE_CALLBACK_URL: 'https://api.example.com/api/auth/google/callback',
};

describe('checkEnv', () => {
  it('accepts a complete production config with no warnings', () => {
    expect(checkEnv(productionEnv)).toEqual({ errors: [], warnings: [] });
  });

  it('lists every missing production variable', () => {
    const { errors } = checkEnv({ NODE_ENV: 'production' });

    expect(errors).toEqual(
      expect.arrayContaining([
        'MONGO_URI is required',
        'FRONTEND_URL is required',
        'QDRANT_URL is required',
        'JWT_SECRET is required',
      ]),
    );
  });

  it('treats whitespace-only values as missing', () => {
    const { errors } = checkEnv({ ...productionEnv, GROQ_API_KEY: '  ' });

    expect(errors).toEqual(['GROQ_API_KEY is required']);
  });

  it('rejects a FRONTEND_URL with a trailing slash or path', () => {
    expect(
      checkEnv({ ...productionEnv, FRONTEND_URL: 'https://app.example.com/' })
        .errors[0],
    ).toMatch(/bare origin/);
    expect(
      checkEnv({ ...productionEnv, FRONTEND_URL: 'https://app.example.com/x' })
        .errors[0],
    ).toMatch(/bare origin/);
  });

  it('rejects a FRONTEND_URL that is not a URL', () => {
    expect(
      checkEnv({ ...productionEnv, FRONTEND_URL: 'not a url' }).errors,
    ).toEqual([
      'FRONTEND_URL must be a valid URL such as https://app.example.com',
    ]);
  });

  it('rejects a non-https QDRANT_URL in production', () => {
    expect(
      checkEnv({
        ...productionEnv,
        QDRANT_URL: 'http://abc.cloud.qdrant.io:6333',
      }).errors,
    ).toEqual([
      'QDRANT_URL must use https:// (plain http connections to Qdrant Cloud are reset)',
    ]);
  });

  it('rejects a QDRANT_URL that is not a URL (e.g. the scheme is missing)', () => {
    expect(
      checkEnv({ ...productionEnv, QDRANT_URL: 'abc.cloud.qdrant.io' })
        .errors[0],
    ).toMatch(/valid URL/);
  });

  it('allows an http QDRANT_URL outside production (local Qdrant)', () => {
    expect(
      checkEnv({
        NODE_ENV: 'development',
        JWT_SECRET: 's',
        REFRESH_JWT_SECRET: 's',
        MONGO_URI_Local: 'mongodb://localhost/x',
        QDRANT_URL: 'http://localhost:6333',
      }).errors,
    ).toEqual([]);
  });

  it('only warns about missing Google variables in production', () => {
    const result = checkEnv({ ...productionEnv, CLIENT_ID: '' });

    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });

  it('requires only the local Mongo URI and JWT secrets in development', () => {
    expect(
      checkEnv({
        NODE_ENV: 'development',
        JWT_SECRET: 's',
        REFRESH_JWT_SECRET: 's',
        MONGO_URI_Local: 'mongodb://localhost/x',
      }).errors,
    ).toEqual([]);
  });
});

describe('validateEnv', () => {
  it('returns the config unchanged when valid', () => {
    expect(validateEnv(productionEnv)).toBe(productionEnv);
  });

  it('throws one error naming every problem', () => {
    expect(() => validateEnv({ NODE_ENV: 'production' })).toThrow(
      /Invalid environment configuration[\s\S]*MONGO_URI is required[\s\S]*QDRANT_URL is required/,
    );
  });
});
