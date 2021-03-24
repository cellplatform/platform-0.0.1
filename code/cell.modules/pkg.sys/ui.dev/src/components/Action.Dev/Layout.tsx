import React, { useEffect, useState } from 'react';

import { color, COLORS, constants, css, CssValue, t, defaultValue } from '../common';
import { Icons } from '../Icons';
import { Markdown } from '../Markdown';
import { Spinner } from '../Primitives';
import { LayoutLabel } from './Layout.Label';

export * from './Layout.Title';
export * from './Layout.Label';

/**
 * A base layout for the display of an dev [Action] item.
 */
export type LayoutProps = {
  label?: {
    body?: React.ReactNode;
    color?: string | number;
    pressOffset?: number;
    onClick?: () => void;
  };
  body?: React.ReactNode;
  description?: React.ReactNode;
  icon?: { Component?: t.IIcon; color?: string | number; size?: number };
  top?: React.ReactNode;
  right?: React.ReactNode;
  placeholder?: boolean;
  isActive: boolean;
  isSpinning?: boolean;
  ellipsis?: boolean;
  style?: CssValue;
};

export const Layout: React.FC<LayoutProps> = (props) => {
  const { label = {}, placeholder, isSpinning } = props;
  const ellipsis = defaultValue(props.ellipsis, true);

  const labelPressOffset = defaultValue(label.pressOffset, 0);

  const [isOver, setIsOver] = useState<boolean>(false);
  const [isDown, setIsDown] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(props.isActive);

  useEffect(() => {
    setIsActive(isSpinning ? false : props.isActive);
  }, [props.isActive, isSpinning]);

  const styles = {
    base: css({
      position: 'relative',
      boxSizing: 'border-box',
      PaddingY: 2,
    }),
    main: {
      outer: css({
        position: 'relative',
        Flex: 'horizontal-stretch-stretch',
        paddingLeft: 12,
        paddingRight: 15,
        opacity: isActive ? 1 : 0.4,
      }),
      iconOuter: css({
        width: 20,
        height: 20,
        Flex: 'center-center',
      }),
      icon: css({
        opacity: isOver || props.icon?.color !== undefined ? 1 : 0.4,
      }),
      spinner: css({ Absolute: [3, null, null, 13] }),
    },
    title: {
      markdown: css({
        color: color.format(-0.4),
        fontSize: 10,
        marginTop: 4,
      }),
    },
    body: {
      outer: css({
        position: 'relative',
        flex: 1,
        marginLeft: 6,
        marginTop: 4,
        overflow: ellipsis && label.body ? 'hidden' : undefined,
      }),
      label: css({
        width: '100%',
        fontFamily: constants.FONT.MONO,
        fontStyle: placeholder ? 'italic' : undefined,
        fontSize: 12,
        color: label.color ? label.color : isOver && isActive ? COLORS.BLUE : COLORS.DARK,
        opacity: !isActive ? 0.6 : !placeholder ? 1 : isOver ? 1 : 0.6,
        transform: isDown ? `translateY(${labelPressOffset}px)` : undefined,
        cursor: isActive && label.onClick ? 'pointer' : 'default',
      }),
      ellipsis:
        ellipsis && css({ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
      description: css({
        color: color.format(-0.4),
        fontSize: 11,
        marginTop: 4,
        marginBottom: 4,
      }),
    },
  };

  const labelOverHandler = (isOver: boolean) => () => {
    if (isActive) {
      setIsOver(isOver);
      if (!isOver) setIsDown(false);
    }
  };

  const labelClickHandler = (isDown: boolean) => (e: React.MouseEvent) => {
    if (isActive && e.button === 0) {
      setIsDown(isDown);
      if (!isDown && label.onClick) label.onClick();
    }
  };

  const elDescription = props.description && (
    <Markdown style={styles.body.description}>{props.description}</Markdown>
  );

  const Icon = props.icon?.Component || Icons.Variable;
  const elIcon = !isSpinning && (
    <Icon
      color={defaultValue(props.icon?.color, isOver ? COLORS.BLUE : COLORS.DARK)}
      size={defaultValue(props.icon?.size, 20)}
      style={styles.main.icon}
    />
  );

  const elLabel = label.body && (
    <div
      {...css(styles.body.label, styles.body.ellipsis)}
      onMouseEnter={labelOverHandler(true)}
      onMouseLeave={labelOverHandler(false)}
      onMouseDown={labelClickHandler(true)}
      onMouseUp={labelClickHandler(false)}
    >
      <LayoutLabel>{label.body}</LayoutLabel>
    </div>
  );

  return (
    <div {...css(styles.base, props.style)}>
      {props.top}
      <div {...styles.main.outer}>
        <div {...styles.main.iconOuter}>
          {elIcon}
          {isSpinning && <Spinner style={styles.main.spinner} size={18} />}
        </div>
        <div {...styles.body.outer}>
          {elLabel}
          {props.body}
          {elDescription}
        </div>
        {props.right}
      </div>
    </div>
  );
};
