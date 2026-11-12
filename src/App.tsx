import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileShell } from './components/layout/MobileShell';
import { WelcomeAndConnectScreen } from './components/onboarding/WelcomeAndConnectScreen';
import { HomeOverviewTab } from './components/home/HomeOverviewTab';
import { MyHomeTab } from './components/archetype/MyHomeTab';
import { RoadHomeTab } from './components/savings/RoadHomeTab';
import { HomeMarketTab } from './components/homemarket/HomeMarketTab';

const AppRouter: React.FC = () => {
  const { isBciConnected, activeTab } = useApp();

  if (!isBciConnected) {
    return <WelcomeAndConnectScreen />;
  }

  switch (activeTab) {
    case 'inicio':
      return <HomeOverviewTab />;
    case 'mi-casa':
      return <MyHomeTab />;
    case 'ahorro':
      return <RoadHomeTab />;
    case 'homemarket':
      return <HomeMarketTab />;
    default:
      return <RoadHomeTab />;
  }
};

export function App() {
  return (
    <AppProvider>
      <MobileShell>
        <AppRouter />
      </MobileShell>
    </AppProvider>
  );
}

export default App;

