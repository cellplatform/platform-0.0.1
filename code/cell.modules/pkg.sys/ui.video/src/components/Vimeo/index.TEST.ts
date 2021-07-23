import { expect, rx } from '../../test';
import { VimeoEvents, Vimeo, VimeoBackground } from '.';

const bus = rx.bus();

describe('Vimeo', () => {
  describe('Events', () => {
    const is = VimeoEvents.is;

    it('is (static/instance)', () => {
      expect(Vimeo.Events.is).to.equal(is);
      expect(VimeoBackground.Events.is).to.equal(is);

      expect(Vimeo.Events({ bus }).is).to.equal(is);
      expect(VimeoBackground.Events({ bus }).is).to.equal(is);
    });

    it('is.base', () => {
      const test = (type: string, expected: boolean) => {
        expect(is.base({ type, payload: {} })).to.eql(expected);
      };
      test('foo', false);
      test('Vimeo/', true);
    });
  });
});
