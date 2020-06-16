import { t } from '../../common';
import { load } from './TypeClient.fn.load';
import { typescript } from './TypeClient.fn.typescript';

/**
 * Client that retrieves the type definition of a
 * namespace from the network.
 */
export class TypeClient {
  /**
   * Load types from the network using the given HTTP client.
   */
  public static client(fetch: t.ISheetFetcher) {
    return {
      load: (ns: string | t.INsUri) => TypeClient.load({ ns, fetch }),
    };
  }

  /**
   * Retrieve and assemble types from the network.
   */
  public static load = load;

  /**
   * Converts type definitions to valid typescript declarations.
   */
  public static typescript = typescript;
}
