import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { css, CssValue, t, ui, COLORS } from '../../common';
import { Card, PropList } from '../primitives';

export type IHelpersProps = { style?: CssValue };
export type IHelpersState = {};

export class Helpers extends React.PureComponent<IHelpersProps, IHelpersState> {
  public state: IHelpersState = {};
  private state$ = new Subject<Partial<IHelpersState>>();
  private unmounted$ = new Subject<{}>();

  public static contextType = ui.Context;
  public context!: t.IAppContext;

  /**
   * [Lifecycle]
   */

  public componentDidMount() {
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe((e) => this.setState(e));
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();
  }

  /**
   * [Render]
   */
  public render() {
    const styles = {
      base: css({ display: 'flex' }),
      card: css({
        PaddingX: 15,
        PaddingY: 15,
      }),
      icon: css({ Absolute: [10, 15, null, null] }),
    };

    const items: t.IPropListItem[] = [{ label: 'namespace uri', value: 'generate' }];

    return (
      <div {...styles.base}>
        <Card padding={0} style={{ flex: 1 }}>
          <div {...styles.card}>
            <PropList title={'Helpers'} items={items} />
          </div>
        </Card>
      </div>
    );
  }
}
