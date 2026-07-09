import React from 'react';
import { Outlet } from 'react-router-dom';
import SideNavBar from '../components/SideNavBar';

export const ConsoleLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <SideNavBar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};
export default ConsoleLayout;
