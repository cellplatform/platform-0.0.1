import * as t from '../../common/types';

export type ITextModifierKeys = {
  alt: boolean;
  control: boolean;
  shift: boolean;
  meta: boolean;
};

export type ITextInputFocusAction = {
  focusOnLoad?: boolean;
  focusAction?: 'SELECT' | 'END';
};

export type ITextInputMask = {
  text: string;
  char: string;
};
export type TextInputMaskHandler = (e: ITextInputMask) => boolean; // True - OK, False - disallow.

export type ITextInputStyle = t.ITextStyle & { disabledColor?: number | string };

/**
 * [Events]
 */

export type TextInputChangeEvent = {
  from: string;
  to: string;
  char: string;
  isMax: boolean | null;
  modifierKeys: ITextModifierKeys;
};
export type TextInputChangeEventHandler = (e: TextInputChangeEvent) => void;

export type TextInputTabEvent = {
  isCancelled: boolean;
  cancel(): void;
  modifierKeys: ITextModifierKeys;
};
export type TextInputTabEventHandler = (e: TextInputTabEvent) => void;

export type TextInputKeyEvent = React.KeyboardEvent<HTMLInputElement> & {
  modifierKeys: ITextModifierKeys;
};
export type TextInputKeyEventHandler = (e: TextInputKeyEvent) => void;

export type ITextInputEvents = {
  onChange?: TextInputChangeEventHandler;
  onKeyPress?: TextInputKeyEventHandler;
  onKeyDown?: TextInputKeyEventHandler;
  onKeyUp?: TextInputKeyEventHandler;
  onEnter?: TextInputKeyEventHandler;
  onEscape?: TextInputKeyEventHandler;
  onTab?: TextInputTabEventHandler;
  onFocus?: React.EventHandler<React.FocusEvent<HTMLInputElement>>;
  onBlur?: React.EventHandler<React.FocusEvent<HTMLInputElement>>;
};

/**
 * [Events]
 */
export type TextInputEvent =
  | ITextInputChangingEvent
  | ITextInputChangedEvent
  | ITextInputKeypressEvent
  | ITextInputMouseEvent
  | ITextInputFocusEvent
  | ITextInputLabelDblClickEvent;

export type ITextInputChangingEvent = {
  type: 'TEXT_INPUT/changing';
  payload: ITextInputChanging;
};
export type ITextInputChanging = TextInputChangeEvent & {
  isCancelled: boolean;
  cancel(): void;
};

export type ITextInputChangedEvent = {
  type: 'TEXT_INPUT/changed';
  payload: ITextInputChanged;
};
export type ITextInputChanged = TextInputChangeEvent;

export type ITextInputKeypressEvent = {
  type: 'TEXT_INPUT/keypress';
  payload: ITextInputKeypress;
};
export type ITextInputKeypress = {
  isPressed: boolean;
  key: TextInputKeyEvent['key'];
  event: TextInputKeyEvent;
};

export type ITextInputMouseEvent = {
  type: 'TEXT_INPUT/mouse';
  payload: t.MouseEvent;
};

export type ITextInputFocusEvent = {
  type: 'TEXT_INPUT/focus';
  payload: ITextInputFocus;
};
export type ITextInputFocus = { isFocused: boolean };

export type ITextInputLabelDblClickEvent = {
  type: 'TEXT_INPUT/label/dblClick';
  payload: ITextInputLabelDblClick;
};
export type ITextInputLabelDblClick = t.MouseEvent & { target: 'READ_ONLY' | 'PLACEHOLDER' };
