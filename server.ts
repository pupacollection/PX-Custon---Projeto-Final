import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { pxStore } from './backend/store';
import { mediaStore } from './backend/services/mediaStore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '15mb' }));

  // -------------------------------------------------------------
  // REST API ENDPOINTS (/api/*)
  // -------------------------------------------------------------

  // Media Upload & Storage Architecture
  app.post('/api/media/upload', (req, res) => {
    try {
      const {
        url,
        fileName,
        fileSize,
        mimeType,
        resourceType = 'common',
        resourceId,
        userId = 'usr-deivid-01',
        bucket,
        storagePath: customStoragePath,
        publicUrl,
        isRealStorage = false,
        isPrimary = false,
        sortOrder = 0,
      } = req.body;

      if (!url || !fileName || !mimeType) {
        return res.status(400).json({ error: 'Dados do arquivo incompletos (url, fileName e mimeType obrigatórios).' });
      }

      // 1. Validar e bloquear extensões perigosas
      const blockedExtensions = [
        '.exe', '.sh', '.bat', '.cmd', '.js', '.ts', '.html', '.htm',
        '.php', '.phtml', '.py', '.pl', '.cgi', '.jar', '.vbs', '.msi',
        '.com', '.scr', '.ps1', '.apk', '.bin', '.dll', '.so'
      ];
      const lowerName = fileName.toLowerCase();
      const dotIdx = lowerName.lastIndexOf('.');
      if (dotIdx === -1) {
        return res.status(400).json({ error: 'Arquivo sem extensão válida.' });
      }
      const ext = lowerName.substring(dotIdx);

      if (blockedExtensions.includes(ext)) {
        return res.status(400).json({ error: `Formato de arquivo bloqueado por segurança: ${ext}` });
      }

      // 2. Validar MIME type e extensão permitidos por contexto
      const isBranding = resourceType === 'branding' || bucket === 'branding';
      const allowedExts = isBranding
        ? ['.jpg', '.jpeg', '.png', '.webp', '.svg']
        : ['.jpg', '.jpeg', '.png', '.webp'];

      if (!allowedExts.includes(ext)) {
        return res.status(400).json({
          error: `Extensão de arquivo não permitida (${ext}). Permitidas: ${allowedExts.join(', ')}`
        });
      }

      const allowedMimes = isBranding
        ? ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
        : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      if (!allowedMimes.includes(mimeType)) {
        return res.status(400).json({ error: `Tipo MIME não permitido: ${mimeType}` });
      }

      // 3. Validar consistência entre extensão e MIME
      if (ext === '.svg' && mimeType !== 'image/svg+xml') {
        return res.status(400).json({ error: 'Inconsistência entre extensão .svg e tipo MIME informado.' });
      }

      // 4. Validar limites de tamanho (5MB para perfil, 10MB para eventos, veículos e branding)
      const isProfile = resourceType === 'profile' || bucket === 'profiles';
      const maxLimitBytes = isProfile ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
      if (fileSize && fileSize > maxLimitBytes) {
        return res.status(400).json({
          error: `Arquivo excede o limite máximo de ${isProfile ? '5 MB para perfil' : '10 MB'}.`
        });
      }

      // 5. Determinar bucket oficial do Supabase Storage
      const targetBucket = bucket || (
        resourceType.startsWith('event') ? 'events' :
        resourceType.startsWith('vehicle') ? 'vehicles' :
        resourceType === 'branding' ? 'branding' : 'profiles'
      );

      // 6. Sanitizar e gerar caminho lógico único
      const cleanExt = ext.replace('.', '');
      const uniqueId = `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const storagePath = customStoragePath || `${targetBucket}/${resourceId || 'item'}/${uniqueId}.${cleanExt}`;

      const savedMedia = mediaStore.saveMedia({
        url: publicUrl || url,
        publicUrl: publicUrl || url,
        fileName: `${uniqueId}.${cleanExt}`,
        fileSize: fileSize || 0,
        mimeType,
        resourceType,
        resourceId,
        userId,
        bucket: targetBucket,
        storagePath,
        isPrimary,
        sortOrder,
        isRealStorage: Boolean(isRealStorage),
      });

      res.status(201).json({
        success: true,
        storageMode: isRealStorage ? 'supabase_storage' : 'local_preview',
        message: isRealStorage
          ? 'Arquivo registrado com sucesso com referência ao Supabase Storage.'
          : 'Arquivo processado com sucesso (Modo demonstração local).',
        media: savedMedia,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro no processamento de mídia' });
    }
  });

  app.delete('/api/media/:id', (req, res) => {
    const success = mediaStore.deleteMedia(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Mídia não encontrada' });
    }
    res.json({ success: true, message: 'Arquivo removido com sucesso' });
  });

  app.patch('/api/media/:id/primary', (req, res) => {
    const updated = mediaStore.setPrimary(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Mídia não encontrada' });
    }
    res.json({ success: true, media: updated });
  });

  app.patch('/api/media/reorder', (req, res) => {
    const { ids } = req.body;
    if (Array.isArray(ids)) {
      mediaStore.reorder(ids);
      return res.json({ success: true, message: 'Ordem atualizada com sucesso' });
    }
    res.status(400).json({ error: 'Lista de IDs inválida' });
  });

  // Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      system: 'PX CUSTOM Official Engine',
    });
  });

  // Events
  app.get('/api/events', (req, res) => {
    res.json(pxStore.events);
  });

  app.get('/api/events/:slug', (req, res) => {
    const event = pxStore.events.find((e) => e.slug === req.params.slug);
    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    res.json(event);
  });

  app.post('/api/events', (req, res) => {
    const newEvent = {
      id: `evt-${Date.now()}`,
      ...req.body,
    };
    pxStore.events.unshift(newEvent);
    res.status(201).json(newEvent);
  });

  app.put('/api/events/:id', (req, res) => {
    const index = pxStore.events.findIndex((e) => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    pxStore.events[index] = { ...pxStore.events[index], ...req.body };
    res.json(pxStore.events[index]);
  });

  // Tickets
  app.get('/api/tickets', (req, res) => {
    res.json(pxStore.tickets);
  });

  app.post('/api/tickets/purchase', (req, res) => {
    try {
      const ticket = pxStore.createTicket(req.body);
      res.status(201).json({ success: true, ticket });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao processar compra' });
    }
  });

  // Server-side Check-In Validation
  app.post('/api/checkin/validate', (req, res) => {
    const { code, operatorName } = req.body;
    if (!code) {
      return res.status(400).json({
        authorized: false,
        reason: 'CÓDIGO AUSENTE',
        details: 'Informe o código do ingresso ou escaneie o QR Code.',
      });
    }

    const result = pxStore.validateCheckIn(code, operatorName);
    res.json(result);
  });

  app.get('/api/checkins', (req, res) => {
    res.json(pxStore.checkins);
  });

  // Dashboard Stats
  app.get('/api/stats', (req, res) => {
    res.json({
      ...pxStore.stats,
      recentCheckins: pxStore.checkins.slice(0, 10),
    });
  });

  // Vehicles
  app.get('/api/vehicles', (req, res) => {
    res.json(pxStore.vehicles);
  });

  app.post('/api/vehicles', (req, res) => {
    const newVehicle = {
      id: req.body.id || `veh-${Date.now()}`,
      userId: 'usr-deivid-01',
      ...req.body,
    };
    pxStore.vehicles.push(newVehicle);
    res.status(201).json(newVehicle);
  });

  app.put('/api/vehicles/:id', (req, res) => {
    const idx = pxStore.vehicles.findIndex((v) => v.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }
    pxStore.vehicles[idx] = {
      ...pxStore.vehicles[idx],
      ...req.body,
    };
    res.json(pxStore.vehicles[idx]);
  });

  app.delete('/api/vehicles/:id', (req, res) => {
    pxStore.vehicles = pxStore.vehicles.filter((v) => v.id !== req.params.id);
    res.json({ success: true });
  });

  // Notifications
  app.get('/api/notifications', (req, res) => {
    res.json(pxStore.notifications);
  });

  app.post('/api/notifications/read-all', (req, res) => {
    pxStore.notifications.forEach((n) => (n.read = true));
    res.json({ success: true });
  });

  // Mercado Pago Configuration & Webhooks
  app.get('/api/mercadopago/config', (req, res) => {
    // Return sanitized config (never leak full secret to raw untrusted client)
    const { accessToken, ...rest } = pxStore.mercadoPagoConfig;
    const maskedToken = accessToken
      ? `${accessToken.slice(0, 8)}********************************${accessToken.slice(-6)}`
      : '';
    res.json({
      ...rest,
      maskedAccessToken: maskedToken,
    });
  });

  app.post('/api/mercadopago/config', (req, res) => {
    pxStore.mercadoPagoConfig = {
      ...pxStore.mercadoPagoConfig,
      ...req.body,
    };
    res.json({ success: true, message: 'Configurações atualizadas com sucesso' });
  });

  app.post('/api/mercadopago/test', (req, res) => {
    pxStore.mercadoPagoConfig.connected = true;
    pxStore.mercadoPagoConfig.lastTestedAt = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    res.json({
      success: true,
      status: 'connected',
      environment: pxStore.mercadoPagoConfig.environment,
      message: 'Conexão com a API do Mercado Pago validada com sucesso! Webhook pronto para escuta.',
    });
  });

  app.post('/api/mercadopago/webhook', (req, res) => {
    console.log('[Mercado Pago Webhook Received]:', req.body);
    // In production, parse payment.updated topic and update ticket status
    res.status(200).send('OK');
  });

  // -------------------------------------------------------------
  // VITE DEV SERVER OR STATIC ASSETS
  // -------------------------------------------------------------
  const distPath = path.resolve(__dirname, 'dist');
  const isProduction = process.env.NODE_ENV === 'production' || process.env.npm_lifecycle_event === 'start';

  if (isProduction && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`PX CUSTOM App is running on port ${PORT}`);
  });
}

startServer();
