const useJsonBackend = process.env.DB_BACKEND === "json" || process.env.VERCEL === "1";

const backend = useJsonBackend ? await import("./db-json") : await import("./db-sqlite");

export const getTrades = backend.getTrades;
export const getTradeById = backend.getTradeById;
export const upsertTrade = backend.upsertTrade;
export const upsertAuthor = backend.upsertAuthor;
export const getAuthors = backend.getAuthors;
export const getAuthorById = backend.getAuthorById;
export const saveSnapshot = backend.saveSnapshot;
export const getSnapshotsByTradeId = backend.getSnapshotsByTradeId;
export const upsertMarket = backend.upsertMarket;
export const getMarkets = backend.getMarkets;
export const recomputeAuthorStats = backend.recomputeAuthorStats;
