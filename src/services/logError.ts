// Tiny shared error sink. Console-only for now, but centralizing every catch
// here means failures are diagnosable and can later be routed to Crashlytics /
// analytics from a single place without touching call sites.
export const logError = (scope: string, err: unknown): void => {
  console.error(`[${scope}]`, err)
}
