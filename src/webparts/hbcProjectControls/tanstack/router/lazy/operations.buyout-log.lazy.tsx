import { createLazyRoute } from '@tanstack/react-router';
import { BuyoutLogPage } from '../../../components/pages/project/BuyoutLogPage';

export const Route = createLazyRoute('/operations/buyout-log')({
  component: BuyoutLogPage,
});
