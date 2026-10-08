/**
 * Fail-fast environment check (BACKLOG.md I2). Run by ConfigModule at boot so
 * a missing or malformed variable stops the server with one clear message,
 * instead of surfacing later as a 503 or a CORS error on first use.
 */

const ALWAYS_REQUIRED = ['JWT_SECRET', 'REFRESH_JWT_SECRET'] as const;

const PRODUCTION_REQUIRED = [
  'MONGO_URI',
  'FRONTEND_URL',
  'GROQ_API_KEY',
  'GEMINI_API_KEY',
  'QDRANT_URL',
  'QDRANT_API_KEY',
  'LLAMA_CLOUD_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

const DEVELOPMENT_REQUIRED = ['MONGO_URI_Local'] as const;

// Not required: the app boots and degrades (sign-in with Google answers 503).
const PRODUCTION_RECOMMENDED = [
  'CLIENT_ID',
  'CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
] as const;

export interface EnvValidationResult {
  errors: string[];
  warnings: string[];
}

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === '';
}

export function checkEnv(config: Record<string, unknown>): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = config.NODE_ENV === 'production';

  const required = [
    ...ALWAYS_REQUIRED,
    ...(isProduction ? PRODUCTION_REQUIRED : DEVELOPMENT_REQUIRED),
  ];
  for (const key of required) {
    if (isBlank(config[key])) errors.push(`${key} is required`);
  }

  // The browser compares the Origin header to this string exactly; a path or
  // trailing slash makes every CORS preflight fail.
  const frontendUrl = config.FRONTEND_URL;
  if (!isBlank(frontendUrl)) {
    try {
      const url = new URL(String(frontendUrl));
      if (url.origin !== String(frontendUrl).trim()) {
        errors.push(
          `FRONTEND_URL must be a bare origin like ${url.origin} (no path or trailing slash)`,
        );
      }
    } catch {
      errors.push(
        'FRONTEND_URL must be a valid URL such as https://app.example.com',
      );
    }
  }

  // Qdrant Cloud only speaks TLS. Plain http:// (the Qdrant quickstart's
  // default) doesn't fail clearly: the connection is reset, which the app
  // reports as "AI assistant temporarily unavailable" (BACKLOG.md I4).
  const qdrantUrl = config.QDRANT_URL;
  if (isProduction && !isBlank(qdrantUrl)) {
    try {
      if (new URL(String(qdrantUrl)).protocol !== 'https:') {
        errors.push(
          'QDRANT_URL must use https:// (plain http connections to Qdrant Cloud are reset)',
        );
      }
    } catch {
      errors.push(
        'QDRANT_URL must be a valid URL such as https://<cluster>.cloud.qdrant.io',
      );
    }
  }

  if (isProduction) {
    for (const key of PRODUCTION_RECOMMENDED) {
      if (isBlank(config[key])) {
        warnings.push(`${key} is not set: Google sign-in will be unavailable`);
      }
    }
  }

  return { errors, warnings };
}

/** ConfigModule `validate` hook: returns the config unchanged, or throws. */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const { errors } = checkEnv(config);
  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
  return config;
}
