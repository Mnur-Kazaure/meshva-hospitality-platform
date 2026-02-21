export interface UpsertFeatureFlagDto {
  key: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}
