/**
 * Stage 20 — useProjectHubNavigate Tests
 *
 * Tests dual-source search-param preservation (URL > context fallback),
 * caller param merging, ref-stability, and edge cases.
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

  it('merges projectCode and leadId from URL search params', () => {
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
        projectCode: '25-022-01',
        leadId: 31,
      },
    });
  });

  it('falls back to selectedProject context when URL params are absent', () => {
    mockSelectedProject = {
      projectCode: '25-030-02',
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
        projectCode: '25-030-02',
        leadId: 7,
      },
    });
  });

  it('URL params take precedence over context values', () => {
    mockSearchParams.projectCode = '25-022-01';
    mockSearchParams.leadId = 31;
    mockSelectedProject = {
      projectCode: '25-030-02',
      leadId: 7,
    };

    const { result } = renderHook(() => useProjectHubNavigate());

    act(() => {
      result.current('/project-hub/precon/estimating-kickoff');
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        search: expect.objectContaining({
          projectCode: '25-022-01',
          leadId: 31,
        }),
      }),
    );
  });

  it('merges caller search params alongside preserved params', () => {
    mockSearchParams.projectCode = '25-022-01';
    mockSearchParams.leadId = 31;

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
        projectCode: '25-022-01',
        leadId: 31,
        handoffFrom: 'turnover',
      },
    });
  });

  it('caller search can override preserved params', () => {
    mockSearchParams.projectCode = '25-022-01';
    mockSearchParams.leadId = 31;

    const { result } = renderHook(() => useProjectHubNavigate());

    act(() => {
      result.current('/project-hub/dashboard', {
        search: { leadId: 99 },
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        search: expect.objectContaining({
          projectCode: '25-022-01',
          leadId: 99,
        }),
      }),
    );
  });

  it('passes replace option through', () => {
    mockSearchParams.projectCode = '25-022-01';

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
    mockSearchParams.projectCode = '25-022-01';

    const { result, rerender } = renderHook(() => useProjectHubNavigate());
    const firstRef = result.current;

    rerender();
    const secondRef = result.current;

    expect(firstRef).toBe(secondRef);
  });
});
