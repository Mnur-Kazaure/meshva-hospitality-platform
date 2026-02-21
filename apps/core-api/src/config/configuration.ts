export interface AppConfig {
  port: number;
  nodeEnv: string;
  persistenceMode: 'memory' | 'postgres';
}

export const configuration = (): AppConfig => ({
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  persistenceMode: (process.env.PERSISTENCE_MODE as 'memory' | 'postgres') ?? 'memory',
});
