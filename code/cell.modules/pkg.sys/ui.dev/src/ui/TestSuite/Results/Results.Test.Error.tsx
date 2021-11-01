import React from 'react';
import { color, css, CssValue, t, ObjectView } from '../common';

export type TestErrorProps = { data: t.TestRunResponse; style?: CssValue };

export const TestError: React.FC<TestErrorProps> = (props) => {
  const { data } = props;
  if (!data.error) return null;

  const error = {
    ...data.error,
    message: data.error.message,
    stack: data.error.stack,
  };

  /**
   * [Render]
   */
  const styles = { base: css({}) };
  return (
    <div {...css(styles.base, props.style)}>
      <ObjectView data={error} fontSize={10} />
    </div>
  );
};
