import * as React from 'react';
import { Subject, merge } from 'rxjs';
import { filter, map, share, takeUntil } from 'rxjs/operators';

import { GlamorValue, t } from '../../common';
import { CommandTreeView, ICommandTreeViewProps } from './CommandTreeView';

export type ICommandTreeProps = {
  cli: t.ICommandState;
  theme?: ICommandTreeViewProps['theme'];
  background?: ICommandTreeViewProps['background'];
  events$?: Subject<t.CommandTreeEvent>;
  style?: GlamorValue;
};
export type ICommandTreeState = {};

export class CommandTree extends React.PureComponent<ICommandTreeProps, ICommandTreeState> {
  public state: ICommandTreeState = {};
  private unmounted$ = new Subject();
  private state$ = new Subject<Partial<ICommandTreeState>>();

  private _events$ = new Subject<t.CommandTreeEvent>();
  public events$ = this._events$.pipe(
    takeUntil(this.unmounted$),
    share(),
  );

  /**
   * [Lifecycle]
   */
  public componentWillMount() {
    // Setup observables.
    const state$ = this.state$.pipe(takeUntil(this.unmounted$));
    const changed$ = this.cli.changed$.pipe(takeUntil(this.unmounted$));
    const invoked$ = this.cli.invoked$.pipe(takeUntil(this.unmounted$));
    const events$ = this.events$;

    // Update state.
    state$.subscribe(e => this.setState(e));

    // Bubble events.
    if (this.props.events$) {
      this.events$.subscribe(this.props.events$);
    }

    // Redraw on CLI changed.
    merge(changed$, invoked$).subscribe(e => this.forceUpdate());

    events$
      // Invoke command on click.
      .pipe(
        filter(e => e.type === 'COMMAND_TREE/click'),
        map(e => e.payload as t.ICommandTreeClick),
      )
      .subscribe(e => {
        this.cli.change({ text: e.command.name });
        this.cli.invoke({ stepIntoNamespace: false });
      });

    events$
      // Invoke command on click.
      .pipe(
        filter(e => e.type === 'COMMAND_TREE/current'),
        map(e => e.payload as t.ICommandTreeCurrent),
      )
      .subscribe(e => {
        const command = e.command;
        const namespace = e.direction === 'PARENT' ? 'PARENT' : true;
        const text = command ? command.name : '';
        this.cli.change({ text, namespace });
      });
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();
  }

  /**
   * [Properties]
   */
  public get cli() {
    return this.props.cli;
  }

  public get nsCommand() {
    return this.cli.namespace ? this.cli.namespace.command : undefined;
  }

  /**
   * [Render]
   */
  public render() {
    return (
      <CommandTreeView
        rootCommand={this.cli.root}
        nsCommand={this.nsCommand}
        currentCommand={this.cli.command}
        fuzzyMatches={this.cli.fuzzyMatches}
        theme={this.props.theme}
        background={this.props.background}
        events$={this._events$}
        style={this.props.style}
      />
    );
  }
}
