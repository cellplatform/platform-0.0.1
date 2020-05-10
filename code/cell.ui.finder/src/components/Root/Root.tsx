import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { css, color, CssValue } from '../../common';

export type IRootProps = { style?: CssValue };
export type IRootState = {};

export class Root extends React.PureComponent<IRootProps, IRootState> {
  public state: IRootState = {};
  private state$ = new Subject<Partial<IRootState>>();
  private unmounted$ = new Subject<{}>();

  /**
   * [Lifecycle]
   */
  constructor(props: IRootProps) {
    super(props);
  }

  public componentDidMount() {
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe(e => this.setState(e));
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
      base: css({
        Absolute: 0,
        Flex: 'center-center',
      }),
      titlebar: css({
        WebkitAppRegion: 'drag',
        Absolute: [0, 0, null, 0],
        height: 38,
        borderBottom: `solid 1px ${color.format(-0.1)}`,
        boxSizing: 'border-box',
      }),
    };
    return (
      <div {...css(styles.base, this.props.style)}>
        <div>👋 Finder</div>
        <div {...styles.titlebar} />
      </div>
    );
  }
}
