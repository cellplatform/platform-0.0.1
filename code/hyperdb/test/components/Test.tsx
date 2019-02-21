import * as React from 'react';
import { distinctUntilChanged } from 'rxjs/operators';

import * as tmp from '../../src/_tmp';
import main from '../../src/main';
import { Button, css, ObjectView, R, renderer } from './common';
import { TestPanel } from './TestPanel';
import { HyperDb } from '../../src/db/main';

export type ITestState = { count?: number };

export class Test extends React.PureComponent<{}, ITestState> {
  public state: ITestState = { count: 0 };
  public static contextType = renderer.Context;
  public context!: renderer.ReactContext;

  public db: HyperDb;
  public tmp: any;
  public tmp2: any

  public componentWillMount() {
    // TEMP 🐷
    this.init();
    this.init__TMP();
  }

  private init__TMP = async () => {
    const { id } = this.context;
    const db = `.db/db-tmp-${id}`;
    const key =
      id > 1 ? 'a7ac000868a274408d44561da69ee8d8976c1e741c178b6abc47e8c3fc76e23c' : undefined;

    console.log('db', db);
    console.log('key', key);

    const res = await tmp.init({ db, key });
    this.tmp = res.db;
    console.log('TMP/init', res);
  };

  private init = async () => {
    const { id } = this.context;
    const db = `.db/db-${id}`;

    const dbKey =
      id > 1 ? 'c887f9c33cb50bcd1e1d71b17713a9272ae9953e68ac4d8ff53762ab27b67901' : undefined;
    const res = await main.init({ dir: db, dbKey });

    console.group('🌳 hyperdb');
    console.log(' - dir:', res.dir);
    console.log(' - dbKey:', res.dbKey);
    console.log(' - localKey:', res.localKey);
    console.log(' - db:', res.db);
    // console.log(' - swarm:', res.swarm);
    console.groupEnd();

    this.db = res.db;

    // res.swarm.events$
    //   .pipe(distinctUntilChanged((prev, next) => R.equals(prev, next)))
    //   .subscribe(e => {
    //     console.log('e', e);
    //   });
  };

  public render() {
    const styles = {
      base: css({ margin: 20 }),
      columns: css({ Flex: 'horizontal', lineHeight: 1.6 }),
      left: css({ flex: 1 }),
      right: css({ flex: 1 }),
    };

    return (
      <TestPanel title={'hyperdb'} style={styles.base}>
        <div {...styles.columns}>
          <div {...styles.left}>
            <ul>
              <li>
                <Button label={'init'} onClick={this.init} />
              </li>
              <li>
                <Button label={'get'} onClick={this.getValue} />
              </li>
              <li>
                <Button label={'put'} onClick={this.putValue} />
              </li>
            </ul>
          </div>
          <div {...styles.right}>
            <ObjectView name={'state'} data={this.state} />
          </div>
        </div>
      </TestPanel>
    );
  }

  private getValue = async () => {
    try {
      // console.group('🌳 get');

      console.log('this.db', this.db);

      // console.log('this.db', this.db);
      // console.log('this.tmp', this.tmp);
      // console.log('-------------------------------------------');

      this.tmp.get('foo', (err, result) => {
        console.log('TMP/get', result);
      });

      this.db._.db.get('foo', (err, result) => {
        console.log('NORMAL._db./get', result);
      });

      console.log('before');
      const res = await this.db.get('foo');
      console.log('NORMAL/get', res);
    } catch (error) {
      console.log('error', error);
    }
    // console.groupEnd();
  };

  private count = 0;
  private putValue = async () => {
    // console.group('🌳 put');

    this.count++;
    const res = await this.db.put('foo', this.count);
    console.log('NORMAL/put', res);
    // // this.db
    // console.log('-------------------------------------------');
    // console.groupEnd();

    this.db._.db.put('foo', this.count, (err, result) => {
      console.log('NORMAL._db./put', result);
    });

    this.tmp.put('foo', this.count, (err, result) => {
      console.log('TMP/put', result);
    });
  };
}
