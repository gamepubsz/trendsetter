const secretPattern = /(api[_-]?key|token|secret|password)/i;

export function redactSecret(value: string): string {
  if (value.length <= 8) {
    return "[REDACTED]";
  }

  return `${value.slice(0, 4)}...[REDACTED]...${value.slice(-2)}`;
}

export function sanitizeConfigRecord(
  values: Record<string, string | undefined>,
): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (!value) {
        return [key, value];
      }

      return [key, secretPattern.test(key) ? redactSecret(value) : value];
    }),
  );
}

export function requireScopes(grantedScopes: string[], requiredScopes: string[]): string[] {
  return requiredScopes.filter((scope) => !grantedScopes.includes(scope));
}
