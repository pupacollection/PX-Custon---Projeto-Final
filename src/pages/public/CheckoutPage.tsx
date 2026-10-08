import React, { useState } from 'react';
import { ArrowLeft, Clock, MapPin, ShieldCheck, CheckCircle2, QrCode, CreditCard, FileText, Loader2 } from 'lucide-react';
import { EventItem, Ticket } from '../../types';
import { api } from '../../services/api';

interface CheckoutPageProps {
  event: EventItem;
  user: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
  };
  onBack: () => void;
  onSuccess: (ticket: Ticket) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  event,
  user,
  onBack,
  onSuccess,
}) => {
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARTAO' | 'BOLETO'>('PIX');
  const [buyerName, setBuyerName] = useState(user.name);
  const [buyerEmail, setBuyerEmail] = useState(user.email);
  const [buyerCpf, setBuyerCpf] = useState(user.cpf);
  const [buyerPhone, setBuyerPhone] = useState(user.phone);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const batches = event?.ticketBatches || [];
  const selectedBatch = batches[selectedBatchIndex] || batches[0] || { id: 'default', name: 'Ingresso Oficial', price: 50 };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName || !buyerEmail || !buyerCpf) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setProcessing(true);
    setErrorMsg('');

    try {
      const ticket = await api.purchaseTicket({
        eventId: event.id,
        batchName: selectedBatch.name,
        price: selectedBatch.price,
        buyerName,
        buyerEmail,
        buyerCpf,
        buyerPhone,
        paymentMethod,
      });

      // Small delay to simulate Mercado Pago secure processing
      setTimeout(() => {
        setProcessing(false);
        onSuccess(ticket);
      }, 1200);
    } catch (err) {
      setProcessing(false);
      setErrorMsg('Erro ao processar compra. Tente novamente.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      
      {/* Header (Matching Mockup Screen 4) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-[#111111] hover:bg-[#181818] text-gray-300 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-heading">
            Comprar Ingressos
          </h1>
          <p className="text-xs text-gray-400">{event.name}</p>
        </div>
      </div>

      {/* Event Summary Mini Card (Matching Mockup Screen 4) */}
      <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-2xl p-4 flex items-center gap-3.5">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-[#2a2a2a]">
          <img
            src={event.bannerImage}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1 left-1 bg-black/90 border border-[#2a2a2a] rounded px-1.5 py-0.5 text-center">
            <span className="block text-[10px] font-black text-[#FF1A2D] font-heading leading-tight">
              {event.dateBadge.split(' ')[0]}
            </span>
            <span className="block text-[8px] font-bold text-white uppercase">
              {event.dateBadge.split(' ')[1]}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-black text-white font-heading">{event.name}</h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <MapPin className="w-3.5 h-3.5 text-[#FF1A2D] shrink-0" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{event.time}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleCheckout} className="space-y-6">
        {/* Ticket Type Selection (Matching Mockup Screen 4) */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-white font-heading uppercase tracking-wide">
            Selecione o ingresso
          </label>

          <div className="space-y-2.5">
            {event.ticketBatches.map((batch, idx) => {
              const isSelected = selectedBatchIndex === idx;
              return (
                <div
                  key={batch.id}
                  onClick={() => setSelectedBatchIndex(idx)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#141414] border-[#FF1A2D] shadow-lg shadow-red-950/30'
                      : 'bg-[#0a0a0a] border-[#1f1f1f] hover:border-[#333333]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Radio indicator */}
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#FF1A2D]' : 'border-gray-500'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#FF1A2D]" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-heading">{batch.name}</span>
                        <span className="text-[10px] text-gray-400 bg-[#1a1a1a] px-2 py-0.5 rounded">
                          {batch.batchNumber}º Lote
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{batch.description}</p>
                    </div>
                  </div>

                  <span className="text-base font-black text-white whitespace-nowrap font-heading">
                    R$ {batch.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buyer Data Form */}
        <div className="space-y-3 bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-4 sm:p-5">
          <h3 className="text-sm font-bold text-white font-heading uppercase tracking-wide">
            Dados do Comprador
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] focus:border-[#FF1A2D] rounded-lg p-2.5 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">CPF *</label>
              <input
                type="text"
                required
                value={buyerCpf}
                onChange={(e) => setBuyerCpf(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] focus:border-[#FF1A2D] rounded-lg p-2.5 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">E-mail para Envio do Ingresso *</label>
              <input
                type="email"
                required
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] focus:border-[#FF1A2D] rounded-lg p-2.5 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">WhatsApp / Telefone *</label>
              <input
                type="text"
                required
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] focus:border-[#FF1A2D] rounded-lg p-2.5 text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-white font-heading uppercase tracking-wide">
            Forma de Pagamento
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setPaymentMethod('PIX')}
              className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                paymentMethod === 'PIX'
                  ? 'bg-[#141414] border-[#FF1A2D] text-white shadow-md shadow-red-950/30'
                  : 'bg-[#0a0a0a] border-[#1f1f1f] text-gray-400 hover:text-white'
              }`}
            >
              <QrCode className="w-5 h-5 text-[#FF1A2D]" />
              <span className="text-xs font-bold">PIX</span>
              <span className="text-[10px] text-emerald-400">Aprovação imediata</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CARTAO')}
              className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                paymentMethod === 'CARTAO'
                  ? 'bg-[#141414] border-[#FF1A2D] text-white shadow-md shadow-red-950/30'
                  : 'bg-[#0a0a0a] border-[#1f1f1f] text-gray-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-5 h-5 text-[#FF1A2D]" />
              <span className="text-xs font-bold">Cartão</span>
              <span className="text-[10px] text-gray-400">Até 12x</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('BOLETO')}
              className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                paymentMethod === 'BOLETO'
                  ? 'bg-[#141414] border-[#FF1A2D] text-white shadow-md shadow-red-950/30'
                  : 'bg-[#0a0a0a] border-[#1f1f1f] text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-5 h-5 text-[#FF1A2D]" />
              <span className="text-xs font-bold">Boleto</span>
              <span className="text-[10px] text-gray-400">Até 3 dias</span>
            </button>
          </div>
        </div>

        {/* Resumo da Compra (Matching Mockup Screen 4) */}
        <div className="bg-[#0e0e0e] border border-[#1c1c1c] rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Ingresso ({selectedBatch.name})</span>
            <span>R$ {selectedBatch.price.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Taxa de emissão oficial</span>
            <span className="text-emerald-400 font-bold">GRÁTIS</span>
          </div>
          <div className="border-t border-[#1a1a1a] pt-2 flex justify-between items-center">
            <span className="text-sm font-bold text-white font-heading">Total</span>
            <span className="text-xl font-black text-white font-heading">
              R$ {selectedBatch.price.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-[#FF1A2D] bg-[#1a0507] border border-[#FF1A2D]/40 p-3 rounded-lg">
            {errorMsg}
          </p>
        )}

        {/* CTA Button (Matching Mockup Screen 4) */}
        <button
          type="submit"
          disabled={processing}
          className="w-full py-4 rounded-xl bg-[#FF1A2D] hover:bg-[#C90018] disabled:opacity-50 text-white font-black text-base uppercase tracking-wider transition shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 cursor-pointer font-heading"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processando pagamento via Mercado Pago...</span>
            </>
          ) : (
            <span>Finalizar compra</span>
          )}
        </button>

        {/* Security Badge (Matching Mockup Screen 4) */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Pagamento seguro via Mercado Pago</span>
        </div>
      </form>

    </div>
  );
};
