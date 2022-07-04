import React, { useState } from 'react';
import { Style, Color, COLORS, css, CssValue, t, rx } from '../common';
import { FsPathListStateful } from '../Fs.PathList/FsPathList.Stateful';

export type PathListDevLabel = 'FS.Instance' | 'FS.Name';

export type PathListDevProps = {
  instance: t.FsViewInstance;
  labels?: boolean | PathListDevLabel[];
  height?: number;
  width?: number;
  margin?: number | [number, number] | [number, number, number, number];
  style?: CssValue;
  onStateChanged?: t.FsPathListStateChangedHandler;
};

/**
 * A stateful version of the <PathList> for use within the DevHarness actions panel.
 */
export const PathListDev: React.FC<PathListDevProps> = (props) => {
  const { instance, height, width } = props;
  const labels = Wrangle.labels(props.labels ?? true);

  const [isLabelsOver, setLabelsOver] = useState(false);
  const labelsOver = (isOver: boolean) => () => setLabelsOver(isOver);

  /**
   * [Render]
   */
  const styles = {
    base: css({ ...Style.toMargins(props.margin) }),
    outer: css({
      height,
      width,
      minHeight: 80,
      borderRadius: 4,
      backgroundColor: Color.alpha(COLORS.DARK, 0.02),
      border: `solid 1px ${Color.format(-0.06)}`,
      display: 'flex',
    }),
    labelBar: {
      base: css({
        fontFamily: 'monospace',
        color: Color.alpha(COLORS.DARK, isLabelsOver ? 0.8 : 0.4),
        transition: 'color 150ms',
        cursor: 'default',
        fontSize: 11,
        fontWeight: 600,
        PaddingX: 4,
        Flex: 'x-spaceBetween-center',
      }),
      top: css({ marginBottom: 4 }),
      bottom: css({ marginTop: 3 }),
    },
  };

  const elTop = labels.includes('FS.Name') && (
    <div
      {...css(styles.labelBar.base, styles.labelBar.top)}
      onMouseEnter={labelsOver(true)}
      onMouseLeave={labelsOver(false)}
    >
      <div>{`filesystem: "${instance.fs}"`}</div>
    </div>
  );

  const elBottom = labels.includes('FS.Instance') && (
    <div
      {...css(styles.labelBar.base, styles.labelBar.bottom)}
      onMouseEnter={labelsOver(true)}
      onMouseLeave={labelsOver(false)}
    >
      <div />
      <div>{`${rx.bus.instance(instance.bus)}/id:${instance.id}`}</div>
    </div>
  );

  return (
    <div {...css(styles.base, props.style)}>
      {elTop}
      <div {...styles.outer}>
        <FsPathListStateful
          style={{ flex: 1 }}
          instance={instance}
          scrollable={true}
          droppable={true}
          selectable={true}
          onStateChanged={props.onStateChanged}
        />
      </div>
      {elBottom}
    </div>
  );
};

/**
 * Helpers
 */

const Wrangle = {
  labels(input: PathListDevProps['labels']): PathListDevLabel[] {
    if (input === false) return [];
    if (input === true) return ['FS.Name', 'FS.Instance'];
    return Array.isArray(input) ? input : [];
  },
};
