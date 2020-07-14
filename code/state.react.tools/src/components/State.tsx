import * as React from 'react';

import { css, CssValue } from '../common';
import { ObjectView } from './primitives'; // eslint-disable-line

export type IStateProps = {
  name?: string;
  expandPaths?: string | string[];
  data?: object;
  style?: CssValue;
};

export class State extends React.PureComponent<IStateProps> {
  /**
   * [Render]
   */
  public render() {
    const { name = 'state', data = {}, expandPaths } = this.props;
    const styles = {
      base: css({
        PaddingY: 8,
        PaddingX: 12,
      }),
    };
    return (
      <div {...css(styles.base, this.props.style)}>
        <ObjectView
          name={name}
          data={data}
          theme={'DARK'}
          expandLevel={1}
          expandPaths={expandPaths}
        />
      </div>
    );
  }
}
