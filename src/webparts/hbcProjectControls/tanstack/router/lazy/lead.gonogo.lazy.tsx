import { createLazyRoute } from '@tanstack/react-router';
import { GoNoGoScorecard } from '../../../components/pages/hub/GoNoGoScorecard';

export const Route = createLazyRoute('/lead/$id/gonogo')({
  component: GoNoGoScorecard,
});
