import * as React from 'react';
import { Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';

import { css, GlamorValue, id as idUtil, log, t } from '../../common';
import { Divider } from '../Divider';
import { ThreadComment } from '../ThreadComment';
import { ThreadCommentHeader } from '../ThreadCommentHeader';

export type IConversationViewProps = {
  model: t.IThreadModel;
  dispatch$: Subject<t.ThreadEvent>;
  style?: GlamorValue;
};

const TEMP = {
  WOMAN_1: require('../../../static/images/woman-1.jpg'),
  WOMAN_2: require('../../../static/images/woman-2.jpg'),
};

export class ConversationView extends React.PureComponent<IConversationViewProps> {
  private unmounted$ = new Subject();
  private editor$ = new Subject<t.TextEditorEvent>();

  /**
   * [Lifecycle]
   */
  public componentWillMount() {
    const editor$ = this.editor$.pipe(takeUntil(this.unmounted$));
    const editorChanged$ = editor$.pipe(
      filter(e => e.type === 'EDITOR/changed'),
      map(e => e.payload as t.ITextEditorChanged),
    );

    editorChanged$.subscribe(e => {
      const markdown = e.value.to;
      const user = this.user;
      const draft = markdown ? { user, markdown } : { user };
      this.dispatch({ type: 'THREAD/draft', payload: { draft } });
    });
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();
  }

  /**
   * [Properties]
   */
  public get items() {
    return this.props.model.items;
  }

  public get draft() {
    return this.props.model.draft;
  }

  public get user() {
    return this.draft.user;
  }

  /**
   * [Render]
   */
  public render() {
    const styles = {
      base: css({
        flex: 1,
        Flex: 'vertical-stretch-stretch',
      }),
      body: css({
        paddingTop: 20,
        flex: 1,
      }),
    };

    const elItems = this.items.map((item, i) => [
      this.renderItem(item),
      <Divider key={i} height={25} left={78} />,
    ]);

    return (
      <div {...css(styles.base, this.props.style)}>
        <div {...styles.body}>
          {elItems}
          {this.renderNextComment()}
        </div>
      </div>
    );
  }

  private renderItem(item: t.ThreadItem) {
    switch (item.kind) {
      case 'THREAD/comment':
        const name = item.user.name || item.user.id;
        const elHeader = <ThreadCommentHeader timestamp={item.timestamp} name={name} />;
        const body = item.body ? item.body.markdown : undefined;
        return (
          <ThreadComment key={item.id} avatarUrl={TEMP.WOMAN_1} header={elHeader} body={body} />
        );

      default:
        log.warn(`Item of kind '${item.kind}' not supported.`);
        return null;
    }
  }

  private renderNextComment() {
    const body = this.draft.markdown;
    return (
      <ThreadComment
        avatarUrl={TEMP.WOMAN_1}
        body={body}
        isEditing={true}
        editor$={this.editor$}
        onComment={this.handleCommentClick}
      />
    );
  }

  private handleCommentClick = () => {
    const markdown = this.draft.markdown || '';
    const item: t.IThreadComment = {
      kind: 'THREAD/comment',
      id: idUtil.cuid(),
      timestamp: new Date(),
      user: this.user,
      body: { markdown },
    };
    this.dispatch({ type: 'THREAD/add', payload: { item } });
  };

  private dispatch = (e: t.ThreadEvent) => this.props.dispatch$.next(e);
}
