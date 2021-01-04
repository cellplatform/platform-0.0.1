import { color, css, CssValue } from '@platform/css';
import { Hr, log } from '@platform/ui.dev';
import { value } from '@platform/util.value';
import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Button, COLORS, IButtonProps, ISwitchProps, Switch, SwitchTheme, t } from '../common';
import { Icons } from './Icons';

export type ITestProps = { style?: CssValue };
export type ITestState = { isEnabled?: boolean; isChecked?: boolean };

const PINK = '#CD638D';
const ORANGE = '#F6A623';

const orange = Button.theme.BORDER.SOLID;
orange.backgroundColor.enabled = '#F6A623';
orange.color.enabled = -0.7;

export class Test extends React.PureComponent<ITestProps, ITestState> {
  public state: ITestState = {};
  private unmounted$ = new Subject<void>();
  private state$ = new Subject<ITestState>();

  private button$ = new Subject<t.ButtonEvent>();
  private switch$ = new Subject<t.SwitchEvent>();

  /**
   * [Lifecycle]
   */
  public componentDidMount() {
    const button$ = this.button$.pipe(takeUntil(this.unmounted$));
    const switch$ = this.switch$.pipe(takeUntil(this.unmounted$));
    const state$ = this.state$.pipe(takeUntil(this.unmounted$));
    state$.subscribe((e) => this.setState(e));

    button$.subscribe((e) => {
      log.info('🌳 button$', e.payload.id, e);
    });

    switch$.subscribe((e) => {
      log.info('🐷 switch$', e.payload.id, e);
    });
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
        Flex: 'horizontal-stretch-stretch',
        Absolute: 0,
      }),
      left: css({
        Flex: 'vertical-stretch-start',
        padding: 8,
        width: 120,
      }),
    };

    const margin = [null, 10, null, null];

    return (
      <div {...css(styles.base, this.props.style)}>
        <div {...styles.left}>
          <Button margin={margin} label={'enabled'} onClick={this.enabledHandler(true)} />
          <Button margin={margin} label={'disabled'} onClick={this.enabledHandler(false)} />
          <Button margin={margin} label={'checked'} onClick={this.checkedHandler(true)} />
          <Button margin={margin} label={'unchecked'} onClick={this.checkedHandler(false)} />
        </div>
        {this.renderButtons()}
      </div>
    );
  }

  public renderButtons() {
    const isEnabled = value.defaultValue(this.state.isEnabled, true);
    const styles = {
      base: css({
        flex: 1,
        padding: 30,
        Scroll: true,
      }),
      iconContent: css({
        Flex: 'horizontal-center-center',
      }),
      centerY: css({
        Flex: 'horizontal-start-start',
      }),
      pinkBg: css({
        backgroundColor: PINK,
        PaddingY: 30,
        PaddingX: 20,
      }),
      darkBg: css({
        backgroundColor: COLORS.DARK,
        PaddingY: 30,
        PaddingX: 20,
      }),
    };

    const common: Partial<IButtonProps> = {
      isEnabled,
      onClick: this.onButtonClick,
      margin: [null, 10, null, null],
      events$: this.button$,
    };

    return (
      <div {...styles.base}>
        <Button id={'simple-label'} {...common} label={'Click Me'} />

        <PinkDashed />

        <div {...styles.centerY}>
          <Button {...common} margin={[0, 20, 0, 0]}>
            {this.iconButtonContent({ label: 'Foo' })}
          </Button>
          <Button {...common} margin={[0, 20, 0, 0]}>
            {this.iconButtonContent({ label: 'Bar' })}
          </Button>
          <Button {...common}>{this.iconButtonContent({ color: COLORS.BLUE })}</Button>
        </div>

        <PinkDashed />

        <div {...styles.centerY}>
          <Button {...common} label={'Base Border'} theme={Button.theme.BORDER.BASE} />
          <Button
            {...common}
            label={'Down Theme'}
            theme={Button.theme.BORDER.BASE}
            downTheme={orange}
          />
          <Button
            {...common}
            label={'Blue Over'}
            theme={Button.theme.BORDER.BASE}
            overTheme={Button.theme.BORDER.BLUE}
          />
          <Button {...common} label={'Blue'} theme={Button.theme.BORDER.BLUE} />
          <Button {...common} theme={Button.theme.BORDER.BLUE}>
            {this.iconButtonContent({ label: 'Blue Icon', color: 1 })}
          </Button>
        </div>
        <PinkDashed />
        <div {...styles.centerY}>
          <Button {...common} label={'Green'} theme={Button.theme.BORDER.GREEN} />
          <Button {...common} label={'Dark'} theme={Button.theme.BORDER.DARK} />
        </div>

        <PinkDashed />

        <div {...styles.centerY}>
          <Button
            {...common}
            label={'minWidth: 250'}
            theme={Button.theme.BORDER.BASE}
            minWidth={250}
          />
          <Button
            {...common}
            label={'minWidth: 250'}
            theme={Button.theme.BORDER.BLUE}
            minWidth={250}
          />
        </div>

        <PinkDashed />

        <div {...styles.pinkBg}>
          <Button {...common} label={'Dark'} theme={Button.theme.BORDER.DARK} />
          <Button {...common} label={'White'} theme={Button.theme.BORDER.WHITE} />
        </div>

        <PinkDashed />

        <div {...styles.centerY}>{this.renderSwitches({})}</div>

        <PinkDashed />

        <div {...css(styles.centerY, styles.darkBg)}>{this.renderSwitches({ theme: 'DARK' })}</div>
      </div>
    );
  }

  private iconButtonContent(props: { label?: string; color?: number | string }) {
    const { label } = props;
    const styles = {
      base: css({ Flex: 'horizontal-center-center' }),
      icon: css({ marginRight: label && 3 }),
    };
    const elLabel = label && <div>{props.label}</div>;
    return (
      <div {...styles.base}>
        <Icons.Face style={styles.icon} color={color.format(props.color)} />
        {elLabel}
      </div>
    );
  }

  private renderSwitches(args: { theme?: t.SwitchThemeName }) {
    const { theme } = args;
    const styles = {
      base: css({ Flex: 'horizontal-center-center' }),
      switch: css({ marginRight: 20 }),
    };

    const render = (props: ISwitchProps) => {
      return (
        <Switch
          events$={this.switch$}
          theme={theme}
          style={styles.switch}
          isEnabled={this.state.isEnabled}
          value={this.state.isChecked}
          {...props}
          onClick={this.onSwitchClick}
        />
      );
    };

    const blueTheme = theme === 'DARK' ? SwitchTheme.DARK.BLUE : SwitchTheme.LIGHT.BLUE;

    return (
      <div {...styles.base}>
        {render({ id: 'my-switch' })}
        {render({ theme: blueTheme })}
        {render({ track: { borderWidth: { off: 2 } } })}
        {render({
          track: { borderWidth: { on: 2, off: 2 } },
          thumb: { color: { on: ORANGE, off: COLORS.WHITE, disabled: -0.1 } },
        })}
        {render({ track: { heightOffset: 6 }, thumb: { xOffset: 0, yOffset: 0 } })}
        {render({ height: 16 })}
        {render({ height: 16, theme: blueTheme })}
        {render({ height: 16, track: { borderWidth: { off: 2 } } })}
        {render({ height: 16, width: 35 })}
        {render({
          height: 16,
          width: 35,
          track: { heightOffset: 4 },
          thumb: { xOffset: 0, yOffset: 0 },
        })}
      </div>
    );
  }

  /**
   * [Handlers]
   */
  private onButtonClick = () => {
    log.info('click');
  };

  private onSwitchClick = () => {
    const isChecked = !this.state.isChecked;
    this.state$.next({ isChecked });
  };

  private enabledHandler = (isEnabled: boolean) => {
    return () => {
      this.state$.next({ isEnabled });
    };
  };

  private checkedHandler = (isChecked: boolean) => {
    return () => {
      this.state$.next({ isChecked });
    };
  };
}

const PinkDashed = () => <Hr.PinkDashed margin={[40, 0]} />;
