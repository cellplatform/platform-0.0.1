import { t, Model, coord } from '../common';
import { Schema } from '../schema';

import { Row } from './Row';
import { Column } from './Column';

const Uri = coord.Uri;

/**
 * Represents a logical collection of cells (aka a "sheet").
 */
export class Ns {
  public static factory: t.ModelFactory<t.IDbModelNs> = ({ db, path }) => {
    const query = Schema.query;

    const children: t.IModelChildrenDefs<t.IDbModelNsChildren> = {
      cells: { query: query.cells, factory: Cell.factory },
      rows: { query: query.rows, factory: Row.factory },
      columns: { query: query.columns, factory: Column.factory },
    };

    const uri = Schema.from.ns(path);
    const id = uri.parts.id;
    const initial: t.IDbModelNsProps = { id, props: { name: undefined } };

    return Model.create<
      t.IDbModelNsProps,
      t.IDbModelNsDoc,
      t.IDbModelNsLinks,
      t.IDbModelNsChildren
    >({
      db,
      path,
      children,
      initial,
    });
  };

  public static create(args: { db: t.IDb; uri?: string }) {
    const { uri, db } = args;
    const ns = Schema.ns(uri);
    const path = ns.path;
    return Ns.factory({ db, path });
  }
}

/**
 * Represetns a single cell within a namespace.
 */
export class Cell {
  public static factory: t.ModelFactory<t.IDbModelCell> = ({ path, db }) => {
    const initial: t.IDbModelCellProps = {
      value: undefined,
      props: undefined,
      hash: undefined,
      error: undefined,
    };

    const links: t.IModelLinkDefs<t.IDbModelCellLinks> = {
      namespaces: {
        relationship: '1:*',
        field: 'nsRefs',
        factory: Ns.factory,
      },
    };

    return Model.create<
      t.IDbModelCellProps,
      t.IDbModelCellDoc,
      t.IDbModelCellLinks,
      t.IDbModelCellChilden
    >({
      db,
      path,
      initial,
      links,
    });
  };

  public static create(args: { db: t.IDb; uri: string }) {
    const { db } = args;
    const uri = Uri.parse<t.ICellUri>(args.uri);
    if (uri.error) {
      throw new Error(uri.error.message);
    }
    const ns = Schema.ns(uri.parts.ns);
    const path = ns.cell(uri.parts.key).path;
    return Cell.factory({ db, path });
  }
}
