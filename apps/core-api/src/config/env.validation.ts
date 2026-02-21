export interface EnvSchema {
  PORT?: string;
  NODE_ENV?: string;
  PERSISTENCE_MODE?: string;
  DATABASE_URL?: string;
  DB_POOL_MAX?: string;
}

export function validateEnv(env: EnvSchema): EnvSchema {
  if (env.PORT && Number.isNaN(Number(env.PORT))) {
    throw new Error('PORT must be numeric');
  }

  if (env.DB_POOL_MAX && Number.isNaN(Number(env.DB_POOL_MAX))) {
    throw new Error('DB_POOL_MAX must be numeric');
  }

  if (env.PERSISTENCE_MODE && !['memory', 'postgres'].includes(env.PERSISTENCE_MODE)) {
    throw new Error('PERSISTENCE_MODE must be memory or postgres');
  }

  return env;
}
