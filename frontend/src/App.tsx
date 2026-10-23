import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Overview from './pages/Overview';
import MyDocuments from './pages/MyDocuments';
import DocumentIntelligence from './pages/DocumentIntelligence';
import LunaAssistant from './pages/LunaAssistant';
import Workflows from './pages/Workflows';
import Activity from './pages/Activity';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* SCREEN 1: Overview */}
          <Route path="/" element={<Overview />} />
          <Route path="/overview" element={<Overview />} />

          {/* SCREEN 2: My Documents */}
          <Route path="/documents" element={<MyDocuments />} />

          {/* SCREEN 3: Document Intelligence Workspace */}
          <Route path="/documents/:id" element={<DocumentIntelligence />} />

          {/* SCREEN 4: LUNA AI Assistant (Alexa+ signature experience) */}
          <Route path="/assistant" element={<LunaAssistant />} />

          {/* SCREEN 5: Workflows & Action Center */}
          <Route path="/workflows" element={<Workflows />} />

          {/* SCREEN 6: Activity Audit Feed */}
          <Route path="/activity" element={<Activity />} />

          {/* SCREEN 7: Settings & Profile */}
          <Route path="/settings" element={<Settings />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
