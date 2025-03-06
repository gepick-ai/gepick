import { useRouter } from 'vue-router';

import type { GepickRoute } from '.';

interface IUseOpenTab {
  openTab: (routeName: GepickRoute) => void
}

export function useOpenTab(): IUseOpenTab {
  const router = useRouter();

  function openTab(routeName: string): void {
    const routeInfo = router.resolve({
      name: routeName,
    });

    window.open(routeInfo.fullPath, '_blank');
  }

  return {
    openTab,
  };
}
