import React, { useRef, useEffect } from 'react';
import { Observable } from 'rxjs';

import { useEventHistory } from '../Event';
import { css, CssValue, FC, rx, slug, t, CONSTANTS, color, COLORS } from './common';
import { EventListLayout as Layout, EventListLayoutProps } from './components/Layout';
import { EventListEvents as Events } from './Events';
import { Empty } from './components/Empty';
import { DebugBusInstance } from './components/Debug.BusInstance';

type Internal = { bus: t.EventBus<any>; instance: string };

/**
 * Types
 */
export type EventListProps = {
  bus: t.EventBus<any>;
  event?: Internal; // Optional, internally bus/instance used by the UI.
  reset$?: Observable<any>;
  debug?: EventListDebugProps;
  style?: CssValue;
};

export type EventListDebugProps = {
  showBus?: boolean;
};

/**
 * Component
 */
export const View: React.FC<EventListProps> = (props) => {
  const { bus, reset$, debug = {} } = props;
  const internal = useRef<Internal>(props.event ?? dummy());

  const history = useEventHistory(bus, { reset$ });
  const items = history.events;
  const isEmpty = items.length === 0;

  // NB: Reset this history log when/if the bus instance changes.
  useEffect(() => history.reset(), [bus]); // eslint-disable-line

  /**
   * [Render]
   */
  const styles = {
    base: css({ position: 'relative', display: 'flex' }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      {isEmpty && <Empty />}
      {!isEmpty && <Layout event={internal.current} items={items} style={{ flex: 1 }} />}
      {debug.showBus && <DebugBusInstance bus={bus} />}
    </div>
  );
};

/**
 * Export
 */
type Fields = {
  Events: t.EventListEventsFactory;
  Layout: React.FC<EventListLayoutProps>;
  useEventHistory: t.UseEventHistory;
  constants: typeof CONSTANTS;
};
export const EventList = FC.decorate<EventListProps, Fields>(
  View,
  { Events, Layout, useEventHistory, constants: CONSTANTS },
  { displayName: 'EventList' },
);

/**
 * [Helpers]
 */

function dummy(): Internal {
  return {
    bus: rx.bus(),
    instance: `EventList.${slug()}:internal`,
  };
}
