/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { BottomNav } from './components/common/BottomNav';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/public/HomePage';
import { EventsPage } from './pages/public/EventsPage';
import { EventDetailPage } from './pages/public/EventDetailPage';
import { CheckoutPage } from './pages/public/CheckoutPage';
import { MyTicketsPage } from './pages/public/MyTicketsPage';
import { MyVehiclesPage } from './pages/public/MyVehiclesPage';
import { ProfilePage } from './pages/public/ProfilePage';
import { NotificationsPage } from './pages/public/NotificationsPage';

// PX CONTROL (Admin)
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCheckinPage } from './pages/admin/AdminCheckinPage';
import { AdminMercadoPagoPage } from './pages/admin/AdminMercadoPagoPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminTicketsPage } from './pages/admin/AdminTicketsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminVehiclesPage } from './pages/admin/AdminVehiclesPage';
import { AdminAdminsPage } from './pages/admin/AdminAdminsPage';
import { AdminSupabasePage } from './pages/admin/AdminSupabasePage';
import { AdminBrandingPage } from './pages/admin/AdminBrandingPage';

import { api } from './services/api';
import { EventItem, Ticket, Vehicle, UserProfile, DashboardStats, NotificationItem } from './types';
import { CURRENT_USER } from './services/mockData';

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedEventSlug, setSelectedEventSlug] = useState<string>('encontro-px-custom');
  
  // Admin State
  const [adminSection, setAdminSection] = useState<string>('dashboard');
  const [selectedAdminEvent, setSelectedAdminEvent] = useState<string>('all');

  // Application Data State
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<UserProfile>(CURRENT_USER);

  // Loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [evts, tkts, vehs, notifs, st] = await Promise.all([
          api.getEvents(),
          api.getTickets(),
          api.getVehicles(),
          api.getNotifications(),
          api.getDashboardStats(),
        ]);
        setEvents(evts);
        setTickets(tkts);
        setVehicles(vehs);
        setNotifications(notifs);
        setStats(st);
      } catch (err) {
        console.error('Error loading initial data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectEvent = (slug: string) => {
    setSelectedEventSlug(slug);
    setCurrentView('event-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBuyTickets = (slug: string) => {
    setSelectedEventSlug(slug);
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckoutSuccess = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev]);
    // Refresh stats and notifications
    api.getDashboardStats().then((st) => setStats(st));
    api.getNotifications().then((notifs) => setNotifications(notifs));
    setCurrentView('tickets');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddVehicle = async (vehData: Partial<Vehicle>) => {
    const created = await api.addVehicle(vehData);
    setVehicles((prev) => [...prev, created]);
  };

  const handleUpdateVehicle = async (id: string, vehData: Partial<Vehicle>) => {
    const updated = await api.updateVehicle(id, vehData);
    setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const handleMarkAllNotifsRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleAddEvent = async (eventData: Partial<EventItem>) => {
    const created = await api.createEvent(eventData);
    setEvents((prev) => [created, ...prev]);
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const currentEvent = events.find((e) => e.slug === selectedEventSlug) || events[0];

  // ---------------------------------------------------------------------------
  // 1. PX CONTROL (ADMINISTRATION INTERFACE)
  // ---------------------------------------------------------------------------
  if (currentView === 'px-control') {
    return (
      <AdminLayout
        currentSection={adminSection}
        onNavigateSection={setAdminSection}
        onExitToPublic={() => handleNavigate('home')}
        selectedEvent={selectedAdminEvent}
        onSelectEvent={setSelectedAdminEvent}
      >
        {adminSection === 'dashboard' && stats && (
          <AdminDashboard
            stats={stats}
            events={events}
            onNavigateSection={setAdminSection}
          />
        )}

        {adminSection === 'events' && (
          <AdminEventsPage
            events={events}
            onAddEvent={handleAddEvent}
          />
        )}

        {adminSection === 'tickets' && (
          <AdminTicketsPage tickets={tickets} />
        )}

        {adminSection === 'checkin' && (
          <AdminCheckinPage />
        )}

        {adminSection === 'users' && (
          <AdminUsersPage />
        )}

        {adminSection === 'vehicles' && (
          <AdminVehiclesPage vehicles={vehicles} onUpdateVehicle={handleUpdateVehicle} />
        )}

        {adminSection === 'mercadopago' && (
          <AdminMercadoPagoPage />
        )}

        {adminSection === 'branding' && (
          <AdminBrandingPage />
        )}

        {adminSection === 'payments' && (
          <AdminMercadoPagoPage />
        )}

        {adminSection === 'notifications' && (
          <NotificationsPage
            notifications={notifications}
            onMarkAllAsRead={handleMarkAllNotifsRead}
            onNavigate={handleNavigate}
          />
        )}

        {adminSection === 'reports' && stats && (
          <AdminDashboard
            stats={stats}
            events={events}
            onNavigateSection={setAdminSection}
          />
        )}

        {adminSection === 'admins' && (
          <AdminAdminsPage />
        )}

        {adminSection === 'supabase' && (
          <AdminSupabasePage />
        )}
      </AdminLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. ÁREA PÚBLICA / USUÁRIO
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-black text-white flex flex-col antialiased selection:bg-[#FF1A2D] selection:text-white pb-14 md:pb-0">
      
      {/* Top Header Navbar */}
      <Navbar
        currentTab={currentView}
        onNavigate={handleNavigate}
        unreadCount={unreadNotifsCount}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            events={events}
            user={user}
            vehicles={vehicles}
            unreadNotifsCount={unreadNotifsCount}
            onSelectEvent={handleSelectEvent}
            onNavigate={handleNavigate}
            onAddVehicleClick={() => handleNavigate('vehicles')}
          />
        )}

        {currentView === 'events' && (
          <EventsPage
            events={events}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {currentView === 'event-detail' && currentEvent && (
          <EventDetailPage
            event={currentEvent}
            onBack={() => handleNavigate('events')}
            onBuyTickets={handleBuyTickets}
          />
        )}

        {currentView === 'checkout' && currentEvent && (
          <CheckoutPage
            event={currentEvent}
            user={user}
            onBack={() => handleNavigate('event-detail')}
            onSuccess={handleCheckoutSuccess}
          />
        )}

        {currentView === 'tickets' && (
          <MyTicketsPage
            tickets={tickets}
            onBrowseEvents={() => handleNavigate('events')}
          />
        )}

        {currentView === 'vehicles' && (
          <MyVehiclesPage
            vehicles={vehicles}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
          />
        )}

        {currentView === 'profile' && (
          <ProfilePage
            user={user}
            onUpdateUser={(updated) => setUser({ ...user, ...updated })}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'notifications' && (
          <NotificationsPage
            notifications={notifications}
            onMarkAllAsRead={handleMarkAllNotifsRead}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Mobile Bottom Navigation Bar (Matching Mockup Screen) */}
      <BottomNav
        currentTab={currentView}
        onNavigate={handleNavigate}
      />

    </div>
  );
}
