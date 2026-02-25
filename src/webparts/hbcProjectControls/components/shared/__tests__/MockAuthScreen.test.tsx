import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MockAuthScreen } from '../MockAuthScreen';
import { RoleName } from '@hbc/sp-services';

function renderWithFluent(ui: React.ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);
}

describe('MockAuthScreen', () => {
  const allRoles = Object.values(RoleName);
  let onRoleSelect: jest.Mock;

  beforeEach(() => {
    onRoleSelect = jest.fn();
  });

  it('renders all 16 role options', () => {
    renderWithFluent(<MockAuthScreen onRoleSelect={onRoleSelect} />);
    for (const role of allRoles) {
      expect(screen.getByTestId(`role-option-${role}`)).toBeInTheDocument();
    }
  });

  it('continue button is disabled when no role selected', () => {
    renderWithFluent(<MockAuthScreen onRoleSelect={onRoleSelect} />);
    const btn = screen.getByTestId('role-continue-btn');
    expect(btn).toBeDisabled();
  });

  it('calls onRoleSelect with the selected role', () => {
    renderWithFluent(<MockAuthScreen onRoleSelect={onRoleSelect} />);
    const radio = screen.getByTestId(`role-option-${RoleName.Leadership}`);
    fireEvent.click(radio);
    const btn = screen.getByTestId('role-continue-btn');
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(onRoleSelect).toHaveBeenCalledWith(RoleName.Leadership);
  });

  it('calls onRoleSelect for each role when selected', () => {
    for (const role of allRoles) {
      onRoleSelect.mockClear();
      const { unmount } = renderWithFluent(<MockAuthScreen onRoleSelect={onRoleSelect} />);
      fireEvent.click(screen.getByTestId(`role-option-${role}`));
      fireEvent.click(screen.getByTestId('role-continue-btn'));
      expect(onRoleSelect).toHaveBeenCalledWith(role);
      unmount();
    }
  });
});
