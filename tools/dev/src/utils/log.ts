export const logInfo = (message: string): void => {
  console.log(`[*] ${message}`);
};

export const logError = (error: unknown): void => {
  console.error(
    `[*] ${error instanceof Error ? error.message : "Unknown error"}`,
  );
};
