
import React from 'react';
import {SidebarProvider} from "@/components/ui/sidebar";
import { AppContent } from "@/components/main/app-content";

export default function Home() {
  return (
    <SidebarProvider defaultOpen={true} collapsible="offcanvas"> 
      <AppContent />
    </SidebarProvider>
  );
}
