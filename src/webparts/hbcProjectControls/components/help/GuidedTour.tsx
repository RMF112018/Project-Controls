import * as React from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useHelp } from '../contexts/HelpContext';
import { HBC_COLORS } from '../../theme/tokens';

export const GuidedTour: React.FC = () => {
  const { isTourActive, tourModuleKey, guides, endTour } = useHelp();

  const steps: Step[] = React.useMemo(() => {
    if (!tourModuleKey) return [];
    return guides
      .filter(
        g =>
          g.isActive &&
          g.moduleKey === tourModuleKey &&
          g.targetSelector &&
          g.guideType === 'walkthrough',
      )
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(g => ({
        target: g.targetSelector!,
        title: g.title,
        content: g.content,
        disableBeacon: true,
        placement: 'bottom' as const,
      }));
  }, [guides, tourModuleKey]);

  const handleCallback = React.useCallback(
    (data: CallBackProps) => {
      const { status } = data;
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        endTour();
      }
    },
    [endTour],
  );

  // If tour was started but no steps found, end immediately
  React.useEffect(() => {
    if (isTourActive && steps.length === 0) {
      endTour();
    }
  }, [isTourActive, steps.length, endTour]);

  if (!isTourActive || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={isTourActive}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: HBC_COLORS.orange,
          textColor: HBC_COLORS.gray800,
          backgroundColor: '#fff',
          arrowColor: '#fff',
          overlayColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1200,
        },
        buttonNext: {
          backgroundColor: HBC_COLORS.navy,
          borderRadius: 4,
          fontSize: 14,
        },
        buttonBack: {
          color: HBC_COLORS.navy,
          marginRight: 8,
        },
        buttonSkip: {
          color: HBC_COLORS.gray500,
        },
        tooltip: {
          borderRadius: 8,
          fontSize: 13,
        },
        tooltipTitle: {
          fontSize: 15,
          fontWeight: 600,
          color: HBC_COLORS.navy,
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};
