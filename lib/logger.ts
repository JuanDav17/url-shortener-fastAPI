interface LogContext {
  [key: string]: unknown;
}

function serializeContext(context: LogContext): string {
  return JSON.stringify(context, (_key, value) => {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }

    return value;
  });
}

export function logInfo(message: string, context: LogContext = {}): void {
  console.info(`[info] ${message} ${serializeContext(context)}`);
}

export function logWarn(message: string, context: LogContext = {}): void {
  console.warn(`[warn] ${message} ${serializeContext(context)}`);
}

export function logError(message: string, context: LogContext = {}): void {
  console.error(`[error] ${message} ${serializeContext(context)}`);
}
