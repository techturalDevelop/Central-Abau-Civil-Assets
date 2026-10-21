import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { GisMap } from './components/GisMap';
import { AssetRegister } from './components/AssetRegister';
import { InspectionsView } from './components/InspectionsView';
import { DefectsView } from './components/DefectsView';
import { MaintenanceView } from './components/MaintenanceView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { QuickFieldCaptureModal } from './components/QuickFieldCaptureModal';
import { SyncQueueDrawer } from './components/SyncQueueDrawer';
import { PdfExportModal } from './components/PdfExportModal';
import { ModuleSelectionModal } from './components/ModuleSelectionModal';

const AppContent: React.FC = () => {
  const {
    activeTab,
    isPdfStudioOpen,
    setIsPdfStudioOpen,
    isModuleSelectModalOpen,
    setIsModuleSelectModalOpen,
  } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Government Navigation Header */}
      <Navbar
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Viewport Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950/60 relative">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'map' && <GisMap />}
          {activeTab === 'register' && <AssetRegister />}
          {activeTab === 'inspections' && <InspectionsView />}
          {activeTab === 'defects' && <DefectsView />}
          {activeTab === 'maintenance' && <MaintenanceView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Floating Field & Offline Overlays */}
      <QuickFieldCaptureModal />
      <SyncQueueDrawer />

      {/* Global Interactive PDF Layout Review & Export Studio */}
      <PdfExportModal
        isOpen={isPdfStudioOpen}
        onClose={() => setIsPdfStudioOpen(false)}
      />

      {/* Core Platform Module Selector (Prompted on dashboard or triggered via switcher) */}
      <ModuleSelectionModal
        isOpen={isModuleSelectModalOpen}
        onClose={() => setIsModuleSelectModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
