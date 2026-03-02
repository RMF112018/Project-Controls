/**
 * Stage 20 / HBC-PC-PID-001 — useProjectHubNavigate Tests
 *
 * Tests pid-only search-param preservation (URL > context fallback),
 * caller param merging, ref-stability, and edge cases.
 *
 * After pid-only migration, useProjectHubNavigate no longer propagates
 * projectCode or leadId — only pid is carried across navigations.
 */
import { renderHook, act } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();
const mockSearchParams: Record<string, unknown> = {};

jest.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useSearch: () => mockSearchParams,
}));

let mockSelectedProject: Record<string, unknown> | null = null;
jest.mock('../../contexts/AppContext', () => ({
  useAppContext: () => ({
    selectedProject: mockSelectedProject,
  }),
}));

// ── Import after mocks ───────────────────────────────────────────────

import { useProjectHubNavigate } from '../useProjectHubNavigate';

// ── Helpers ─────────────────────────────────────────────────────────

function resetSearchParams(): void {
  Object.keys(mockSearchParams).forEach(k => delete mockSearchParams[k]);
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('Stage 20: useProjectHubNavigate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSearchParams();
    mockSelectedProject = null;
  });

  it('preserves pid from URL search params (not projectCode/leadId)', () => {
    mockSearchParams.pid = 'ab12345';
    mockSearchParams.projectCode = '25-022-01';
    mockSearchParams.leadId = 31;

    const { result } = renderHook(() => useProjectHubNavigate());

    act(() => {
      result.current('/project-hub/precon/turnover');
    });

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/project-hub/precon/turnover',
      replace: undefined,
      search: {
        pid: 'ab12345',
      },
    });
  });

  it('falls back to context projectUuid when URL pid is absent', () => {
    mockSelectedProject = {
      projectCode: '25-030-02',
      projectUuid: 'ab123456-7890-abcd-ef01-234567890abc',
      leadId: 7,
    };

    const { result } = renderHook(() => useProjectHubNavigate());

    act(() => {
      result.current('/project-hub/dashboard');
    });

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/project-hub/dashboard',
      replace: undefined,
      search: {
        pid: 'ab12345',
      },
    });
  });

  it('URL pid takes precedence over context projectUuid', () => {
    mockSearchParams.pid = 'url1234';
    mockSelectedProject = {
      projectCode: '25-030-02',
      projectUuid: 'ctx12345-7890-abcd-ef01-234567890abc',
      leadId: 7,
    };

    const { result } = renderHook(() => useProjectHubNavigate());

    act(() => {
      result.current('/project-hub/precon/estimating-kickoff');
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        search: { pid: 'url1234' },
      }),
    );
  });

  it('normalizes legacy projectUuid search param to pid', () => {
    mockSearchParams.projectUuid = 'ab123456-7890-abcd-ef01-234567890abc';

    const { result } = renderHook(() => useProjectHubNavigate());

    act(() => {
      result.current('/project-hub/dashboard');
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        search: { pid: 'ab12345' },
      }),
    );
  });

  it('merges caller search params alongside pid', () => {
    mockSearchParams.pid = 'ab12345';

    const { result } = renderHook(() => useProjectHubNavigate());

    act(() => {
      result.current('/project-hub/dashboard', {
        search: { handoffFrom: 'turnover' },
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/project-hub/dashboard',
      replace: undefined,
      search: {
        pid: 'ab12345',
        handoffFrom: 'turnover',
      },
    });
  });

  it('caller search can add arbitrary params', () => {
    mockSearchParams.pid = 'ab12345';

    const { result } = renderHook(() => useProjectHubNavigate());

    act(() => {
      result.current('/project-hub/dashboard', {
        search: { leadId: 99 },
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        search: {
          pid: 'ab12345',
          leadId: 99,
        },
      }),
    );
  });

  it('passes replace option through', () => {
    mockSearchParams.pid = 'ab12345';

    const { result } = renderHook(() => useProjectHubNavigate());

    act(() => {
      result.current('/project-hub/settings', { replace: true });
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/project-hub/settings',
        replace: true,
      }),
    );
  });

  it('navigates without project params when neither source has data', () => {
    const { result } = renderHook(() => useProjectHubNavigate());

    act(() => {
      result.current('/project-hub/dashboard');
    });

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/project-hub/dashboard',
      replace: undefined,
      search: {},
    });
  });

  it('returns a ref-stable callback', () => {
    mockSearchParams.pid = 'ab12345';

    const { result, rerender } = renderHook(() => useProjectHubNavigate());
    const firstRef = result.current;

    rerender();
    const secondRef = result.current;

    expect(firstRef).toBe(secondRef);
  });
});
