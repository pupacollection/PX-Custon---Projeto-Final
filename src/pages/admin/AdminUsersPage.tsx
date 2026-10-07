import React, { useState } from 'react';
import { Users, User, ShieldCheck, Mail, Phone, MapPin, Search } from 'lucide-react';
import { CURRENT_USER } from '../../services/mockData';

export const AdminUsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const sampleUsers = [
    CURRENT_USER,
    {
      id: 'usr-02',
      name: 'João Silva',
      email: 'joao.silva@email.com',
      phone: '(33) 98811-2233',
      cpf: '333.444.555-66',
      city: 'Manhuaçu',
      state: 'MG',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      role: 'USER' as const,
      createdAt: '2025-10-15',
    },
    {
      id: 'usr-03',
      name: 'Lucas Ferreira',
      email: 'lucas.ferreira@email.com',
      phone: '(33) 99122-3344',
      cpf: '777.888.999-00',
      city: 'Caratinga',
      state: 'MG',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      role: 'USER' as const,
      createdAt: '2025-10-20',
    },
    {
      id: 'usr-04',
      name: 'Rafael Souza',
      email: 'rafael.souza@email.com',
      phone: '(33) 98455-6677',
      cpf: '111.222.333-44',
      city: 'Manhumirim',
      state: 'MG',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80',
      role: 'CHECKIN_OPERATOR' as const,
      createdAt: '2025-10-22',
    },
  ];

  const filtered = sampleUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-heading">
            Gerenciamento de Usuários
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Base oficial de participantes cadastrados na PX CUSTOM
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar participante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#141414] border border-[#262626] rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((u) => (
          <div
            key={u.id}
            className="p-5 rounded-2xl bg-[#0c0c0c] border border-[#1c1c1c] flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <img
                src={u.avatarUrl}
                alt={u.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#FF1A2D]"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-heading">{u.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#141414] text-[#FF1A2D] border border-[#2a2a2a]">
                    {u.role}
                  </span>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  <span>{u.email}</span>
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {u.phone}
                  </span>
                  <span>•</span>
                  <span>{u.city} - {u.state}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
