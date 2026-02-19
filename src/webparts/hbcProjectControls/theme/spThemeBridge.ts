import type { Theme } from '@fluentui/react-components';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';

export type FluentThemePatch = Partial<Theme>;

export function mapSpThemeToFluentTheme(spTheme?: IReadonlyTheme): FluentThemePatch {
  if (!spTheme?.semanticColors) {
    return {};
  }

  const semanticColors = spTheme.semanticColors;
  return {
    colorNeutralBackground1: semanticColors.bodyBackground,
    colorNeutralBackground2: semanticColors.bodyStandoutBackground,
    colorNeutralForeground1: semanticColors.bodyText,
    colorNeutralForeground2: semanticColors.bodySubtext,
    colorNeutralStroke1: semanticColors.bodyDivider,
    colorBrandForeground1: semanticColors.link,
    colorBrandForegroundLink: semanticColors.link,
    colorBrandForegroundLinkHover: semanticColors.linkHovered,
    colorBrandBackground: semanticColors.primaryButtonBackground,
    colorBrandBackgroundHover: semanticColors.primaryButtonBackgroundHovered,
    colorBrandBackgroundPressed: semanticColors.primaryButtonBackgroundPressed
  };
}
