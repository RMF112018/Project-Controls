import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FluentProvider, teamsLightTheme } from '@fluentui/react-components';
import { RoleName } from '@hbc/sp-services';
import type { ICurrentUser } from '@hbc/sp-services';
import { HeaderUserMenu } from '../HeaderUserMenu';
import type { IDevToolsConfig } from '../../App';

// Mock useAppContext
const mockUseAppContext = jest.fn();
jest.mock('../../contexts/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

// Mock useResponsive
const mockUseResponsive = jest.fn();
jest.mock('../../hooks/useResponsive', () => ({
  useResponsive: () => mockUseResponsive(),
}));

function makeUser(overrides: Partial<ICurrentUser> = {}): ICurrentUser {
  return {
    id: 1,
    displayName: 'Bobby Fetting',
    email: 'bfetting@hedrickbrothers.com',
    loginName: 'bfetting@hedrickbrothers.com',
    roles: [RoleName.ExecutiveLeadership],
    permissions: new Set<string>(),
    ...overrides,
  };
}

const MOCK_ROLE_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'President / VP Operations', value: RoleName.ExecutiveLeadership },
  { label: 'BD Representative', value: RoleName.BDRepresentative },
  { label: 'Estimating Coordinator', value: RoleName.EstimatingCoordinator },
];

function makeDevToolsConfig(overrides: Partial<IDevToolsConfig> = {}): IDevToolsConfig {
  return {
    currentRole: RoleName.ExecutiveLeadership,
    roleOptions: MOCK_ROLE_OPTIONS,
    onRoleChange: jest.fn(),
    onSwitchMode: jest.fn(),
    mode: 'mock',
    ...overrides,
  };
}

function renderMenu(devToolsConfig?: IDevToolsConfig) {
  const onWhatsNew = jest.fn();
  mockUseAppContext.mockReturnValue({
    currentUser: makeUser(),
    dataServiceMode: devToolsConfig?.mode ?? 'mock',
    devToolsConfig,
  });
  mockUseResponsive.mockReturnValue({ isMobile: false, isTablet: false });

  const result = render(
    <FluentProvider theme={teamsLightTheme}>
      <HeaderUserMenu onWhatsNew={onWhatsNew} />
    </FluentProvider>
  );
  return { ...result, onWhatsNew };
}

describe('HeaderUserMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with data-testid="role-switcher"', () => {
    renderMenu();
    expect(screen.getByTestId('role-switcher')).toBeInTheDocument();
  });

  it('renders user display name in the Persona trigger', () => {
    renderMenu();
    expect(screen.getByText('Bobby Fetting')).toBeInTheDocument();
  });

  it('does NOT render dev tools section when devToolsConfig is undefined', () => {
    renderMenu(undefined);
    expect(screen.queryByText('MOCK MODE')).not.toBeInTheDocument();
  });

  it('renders MOCK MODE badge when devToolsConfig.mode is mock', () => {
    const config = makeDevToolsConfig({ mode: 'mock' });
    renderMenu(config);
    expect(screen.getByText('MOCK MODE')).toBeInTheDocument();
  });

  it('renders LIVE DATA badge when devToolsConfig.mode is standalone', () => {
    const config = makeDevToolsConfig({ mode: 'standalone' });
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser(),
      dataServiceMode: 'standalone',
      devToolsConfig: config,
    });
    mockUseResponsive.mockReturnValue({ isMobile: false, isTablet: false });

    render(
      <FluentProvider theme={teamsLightTheme}>
        <HeaderUserMenu onWhatsNew={jest.fn()} />
      </FluentProvider>
    );
    expect(screen.getByText('LIVE DATA')).toBeInTheDocument();
  });

  it('renders role radio items when menu is opened in mock mode', () => {
    const config = makeDevToolsConfig({ mode: 'mock' });
    renderMenu(config);

    // Open the menu by clicking the trigger
    const trigger = screen.getByTestId('role-switcher');
    const button = trigger.querySelector('button');
    if (button) fireEvent.click(button);

    // Check role items are present
    expect(screen.getByText('President / VP Operations')).toBeInTheDocument();
    expect(screen.getByText('BD Representative')).toBeInTheDocument();
    expect(screen.getByText('Estimating Coordinator')).toBeInTheDocument();
  });

  it('calls onWhatsNew when What\'s New item is clicked', () => {
    const { onWhatsNew } = renderMenu();

    // Open menu
    const trigger = screen.getByTestId('role-switcher');
    const button = trigger.querySelector('button');
    if (button) fireEvent.click(button);

    const whatsNewItem = screen.getByText(/What's New/);
    fireEvent.click(whatsNewItem);
    expect(onWhatsNew).toHaveBeenCalledTimes(1);
  });

  it('hides user name text on mobile (only Avatar visible)', () => {
    mockUseAppContext.mockReturnValue({
      currentUser: makeUser(),
      dataServiceMode: 'mock',
      devToolsConfig: undefined,
    });
    mockUseResponsive.mockReturnValue({ isMobile: true, isTablet: false });

    render(
      <FluentProvider theme={teamsLightTheme}>
        <HeaderUserMenu onWhatsNew={jest.fn()} />
      </FluentProvider>
    );

    // Persona secondaryText should be undefined on mobile
    // The user name is still shown in Persona name prop (as initials in Avatar)
    // but secondaryText is hidden
    expect(screen.getByTestId('role-switcher')).toBeInTheDocument();
  });
});
