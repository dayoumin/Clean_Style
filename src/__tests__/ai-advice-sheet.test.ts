import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import AiAdviceSheet, { type AiAdviceMessage } from '@/components/AiAdviceSheet';

vi.mock('@/components/BottomSheet', () => ({
  default: ({ children }: { children: ReactNode }) => createElement('div', null, children),
}));

const messages: AiAdviceMessage[] = [
  { role: 'user', content: '요즘 고민이 있어.' },
  { role: 'assistant', content: '함께 살펴볼게요.' },
];

function render(overrides: Partial<Parameters<typeof AiAdviceSheet>[0]> = {}) {
  return renderToStaticMarkup(createElement(AiAdviceSheet, {
    loading: false,
    messages,
    inputValue: '',
    onInputChange: vi.fn(),
    onSubmit: vi.fn(),
    onAbort: vi.fn(),
    onClose: vi.fn(),
    onDeleteConversation: vi.fn(),
    inputRef: { current: null },
    scrollAnchorRef: { current: null },
    placeholder: '이어서 이야기해 주세요',
    ...overrides,
  }));
}

describe('always-visible advice composer', () => {
  it('shows a short input for both a new and an existing conversation', () => {
    for (const history of [[], messages]) {
      const html = render({ messages: history });
      expect(html).toContain('<textarea');
      expect(html).toContain('rows="2"');
      expect(html).toContain('>전송</button>');
      expect(html).not.toContain('질문하기');
    }
  });

  it('keeps the input visible and read-only during generation, with a stop action', () => {
    const html = render({ loading: true, inputValue: '고민', currentUserMessage: '고민' });
    expect(html).toContain('<textarea');
    expect(html).toContain('readOnly=""');
    expect(html).toContain('>중단</button>');
    expect(html).not.toContain('>전송</button>');
    expect(html).not.toContain('>대화 지우기</button>');
  });

  it('warns before the cap and replaces input with an explicit new conversation at the cap', () => {
    expect(render({ maxTurns: 2 })).toContain('이어서 질문은 1번 더 가능해요.');
    const html = render({ maxTurns: 1, onStartNewConversation: vi.fn() });
    expect(html).not.toContain('<textarea');
    expect(html).toContain('>새 대화 시작</button>');
    expect(html).toContain('>닫기</button>');
  });

  it('leaves the draft available for correction after a failed request', () => {
    const html = render({ errorType: 'network', inputValue: '내 질문' });
    expect(html).toContain('내 질문</textarea>');
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('readOnly=""');
  });
});
