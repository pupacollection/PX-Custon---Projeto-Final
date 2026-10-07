import React, { useState } from 'react';
import { Bell, Search, Shield, User, Menu, X, Ticket, Car, Compass } from 'lucide-react';
import { PxLogo } from './PxLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { CURRENT_USER } from '../../services/mockData';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  unreadCount = 2,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const navLinks = [
    { id: 'home', label: 'Início' },
    { id: 'events', label: 'Eventos' },
    { id: 'tickets', label: 'Meus Ingressos' },
    { id: 'vehicles', label: 'Meus Veículos' },
    { id: 'profile', label: 'Perfil' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-[#181818]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          
          {/* Left: Official Logo */}
          <div
            onClick={() => onNavigate('home')}
            className="cursor-pointer transition-transform hover:scale-102 flex items-center"
          >
            <PxLogo size="md" />
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-3">
            {navLinks.map((link) => {
              const active = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                    active
                      ? 'text-[#FF1A2D] bg-[#181818]/70 border-b-2 border-[#FF1A2D]'
                      : 'text-gray-300 hover:text-white hover:bg-[#111111]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Actions, Search, Notifications, PX CONTROL & User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Toggle */}
            <div className="relative">
              {searchOpen ? (
                <div className="flex items-center bg-[#111111] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 w-44 sm:w-60">
                  <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar evento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onNavigate('events');
                        setSearchOpen(false);
                      }
                    }}
                    autoFocus
                    className="bg-transparent text-xs text-white focus:outline-none w-full"
                  />
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="text-gray-400 hover:text-white text-xs ml-1"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#111111] transition cursor-pointer"
                  title="Pesquisar"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Notifications */}
            <button
              onClick={() => onNavigate('notifications')}
              className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#111111] transition cursor-pointer"
              title="Notificações"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF1A2D] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton compact />

            {/* Admin Switcher: PX CONTROL */}
            <button
              onClick={() => onNavigate('px-control')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#262626] hover:border-[#FF1A2D] text-xs font-bold text-gray-200 transition cursor-pointer group shadow-sm"
              title="Acessar painel administrativo PX CONTROL"
            >
              <Shield className="w-3.5 h-3.5 text-[#FF1A2D] group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">PX CONTROL</span>
            </button>

            {/* User Profile Avatar / Entrar */}
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#111111] hover:bg-[#181818] border border-[#222222] text-xs font-semibold text-white transition cursor-pointer"
            >
              <img
                src={CURRENT_USER.avatarUrl}
                alt={CURRENT_USER.name}
                className="w-6 h-6 rounded-full object-cover border border-[#FF1A2D]"
              />
              <span className="hidden lg:inline">{CURRENT_USER.name.split(' ')[0]}</span>
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#111111] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#080808] border-b border-[#1f1f1f] px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                currentTab === link.id
                  ? 'text-[#FF1A2D] bg-[#181818] border-l-4 border-[#FF1A2D]'
                  : 'text-gray-300 hover:text-white hover:bg-[#111111]'
              }`}
            >
              {link.label}
            </button>
          ))}

          <div className="pt-2 border-t border-[#1a1a1a]">
            <button
              onClick={() => {
                onNavigate('px-control');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#181818] text-white font-bold text-sm border border-[#2a2a2a]"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#FF1A2D]" />
                <span>PX CONTROL (Administração)</span>
              </div>
              <span className="text-xs text-[#FF1A2D]">Acessar →</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
