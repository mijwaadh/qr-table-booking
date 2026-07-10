import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ConsoleLayout from './layouts/ConsoleLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Tables from './pages/Tables';
import Menu from './pages/Menu';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import KDS from './pages/KDS';
import MobileOrder from './pages/MobileOrder';
import DemoControl from './pages/DemoControl';
import AIIntelligence from './pages/AIIntelligence';
import GlobalAICopilot from './components/GlobalAICopilot';


export const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Desktop Management Console routes */}
        <Route path="/" element={<ConsoleLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="tables" element={<Tables />} />
          <Route path="menu" element={<Menu />} />
          <Route path="billing" element={<Payments />} />
          <Route path="reports" element={<Reports />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="demo" element={<DemoControl />} />
          <Route path="ai-intelligence" element={<AIIntelligence />} />
          {/* Fallback settings page just routes to dashboard */}
          <Route path="settings" element={<Navigate to="/" replace />} />
        </Route>

        {/* Task-focused Fullscreen Kitchen Display */}
        <Route path="/kds" element={<KDS />} />

        {/* Customer-facing Mobile App */}
        <Route path="/order-now" element={<MobileOrder />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <GlobalAICopilot />
    </>
  );
};

export default App;
