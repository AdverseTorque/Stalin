// How long items are kept. The ingest cleanup purges anything older, and the
// feed API, search, timelines and UI copy all derive from this one value so
// they can't drift apart.
export const RETENTION_DAYS = 2;
export const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;
