import * as React from 'react';

import * as main from '../../src/main';
import { Button, css, ObjectView, renderer, value } from './common';
import { TestPanel } from './TestPanel';

export type ITestState = {
  data: any;
};

export class Test extends React.PureComponent<{}, ITestState> {
  public state: ITestState = { data: {} };
  public static contextType = renderer.Context;
  public context!: renderer.ReactContext;

  public db: main.Db;
  public swarm: main.Swarm;

  public componentWillMount() {
    this.init();
  }

  private init = async () => {
    const { id } = this.context;
    const dir = `.db/db-tmp-${id}`;
    const dbKey =
      id > 1 ? '4a1e914a33a9b2a6e4f5769f0cd73e308e33ec8cf86a804b74cda010c1aeed62' : undefined;

    const res = await main.init({ dir, dbKey });
    const db = (this.db = res.db);
    const swarm = (this.swarm = res.swarm);

    console.group('🌳 HyperDB');
    console.log('- dbKey:', res.dbKey);
    console.log('- localKey:', res.localKey);
    console.groupEnd();

    db.watch().watch$.subscribe(async e => {
      this.setPropData(e.key, e.value);
    });

    swarm.events$.subscribe(e => this.updateData());
    this.updateData();
    this.getValue();
  };

  private updateData = async () => {
    const db = this.db;
    const swarm = this.swarm;
    this.setData({
      db: {
        dbKey: db.buffer.key.toString('hex'),
        localKey: db.buffer.localKey.toString('hex'),
        version: await db.version(),
        watching: db.watching,
      },
      swarm: {
        id: swarm.id,
        isActive: swarm.isActive,
        connections: await swarm.connections(),
      },
    });
  };

  public render() {
    const styles = {
      base: css({ margin: 20 }),
      columns: css({ Flex: 'horizontal', lineHeight: 1.6 }),
      left: css({ width: 250 }),
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
                <Button label={'db.get'} onClick={this.getValue} />
              </li>
              <li>
                db.put: <Button label={'foo'} onClick={this.putValue('foo')} />
                <Button label={'bar'} onClick={this.putValue('bar')} />
              </li>
              <li>
                <Button label={'db.del'} onClick={this.deleteValue} />
              </li>
              <li>
                <Button label={'db.dispose'} onClick={this.dispose} />
              </li>
              <li>
                <Button label={'swarm.leave'} onClick={this.leaveSwarm} />
              </li>
              <li>
                <Button label={'swarm.join'} onClick={this.joinSwarm} />
              </li>
            </ul>
          </div>
          <div {...styles.right}>
            <ObjectView name={'state'} data={this.state.data} expandPaths={['$.values']} />
          </div>
        </div>
      </TestPanel>
    );
  }

  private count = 0;
  private getValue = async () => {
    const res = await this.db.get('foo');
    // console.log('get:', res);
    this.count = res.value || 0;
    this.setPropData('foo', res.value);
  };
  private putValue = (key: string) => {
    return async () => {
      await this.getValue();
      this.count++;
      const res = await this.db.put(key, this.count);
      // console.log('put:', res);
      this.count = res.value || 0;
    };
  };

  private deleteValue = async () => {
    const res = await this.db.del('foo');
    // console.log('del:', res);
    // this.setData({ foo: res.value });
    this.setPropData('foo', res.value);
  };

  private setPropData = (key: string | number | symbol, value: any) => {
    if (key) {
      const values = { ...(this.state.data.values || {}), [key]: value };
      this.setData({ values });
    }
  };

  private setData = (obj: {}) => {
    let data = { ...this.state.data };
    Object.keys(obj).forEach(key => {
      data = { ...data, [key]: obj[key] };
    });
    data = value.deleteUndefined(data);
    this.setState({ data });
  };

  private dispose = () => {
    this.db.dispose();
  };

  private joinSwarm = async () => {
    await this.swarm.join();
  };
  private leaveSwarm = async () => {
    this.swarm.leave();
  };
}
