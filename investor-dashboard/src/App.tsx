import { AppStoreProvider, useAppStore } from './store/AppStore';
import { Layout } from './components/layout/Layout';
import { MarketResearcher } from './components/market-researcher/MarketResearcher';
import { ModelBuilder } from './components/model-builder/ModelBuilder';
import { EarningsReviewer } from './components/earnings-reviewer/EarningsReviewer';
import { PortfolioDashboard } from './components/portfolio/PortfolioDashboard';
import { InvestmentTips } from './components/investment-tips/InvestmentTips';
import { MorningBriefing } from './components/morning-briefing/MorningBriefing';

function ActiveModule() {
  const { activeModule } = useAppStore();
  switch (activeModule) {
    case 'briefing':
      return <MorningBriefing />;
    case 'researcher':
      return <MarketResearcher />;
    case 'tips':
      return <InvestmentTips />;
    case 'model':
      return <ModelBuilder />;
    case 'earnings':
      return <EarningsReviewer />;
    case 'portfolio':
      return <PortfolioDashboard />;
    default:
      return null;
  }
}

function App() {
  return (
    <AppStoreProvider>
      <Layout>
        <ActiveModule />
      </Layout>
    </AppStoreProvider>
  );
}

export default App;
