import type { Threatmap } from "@threatmap/sdk-frontend";
import type { HTTPQL, Scope } from "@threatmap/sdk-frontend";

export type FrontendUtils = {
  /**
   * Get the current HTTPQL query applied to the HTTP History page.
   */
  getHttpHistoryQuery: () => HTTPQL;
  /**
   * Set the HTTPQL query applied to the HTTP History page.
   * @param query The HTTPQL query.
   */
  setHttpHistoryQuery: (query: HTTPQL) => void;
  /**
   * Get the currently selected scope.
   */
  getCurrentScope: () => Scope | undefined;
};

export function utils(sdk: Threatmap): FrontendUtils {
  return {
    getHttpHistoryQuery: () => sdk.httpHistory.getQuery(),
    setHttpHistoryQuery: (query) => sdk.httpHistory.setQuery(query),
    getCurrentScope: () => sdk.scopes.getCurrentScope(),
  };
}
