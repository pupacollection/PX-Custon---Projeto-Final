// PX CUSTOM — Supabase Storage Architecture & Client Helpers
import { supabase, getSupabaseConfig } from './supabase';
import { fileToDataUrl, cleanExtension, generateStorageUUID } from '../config/media';

export type StorageBucket = 'events' | 'vehicles' | 'profiles' | 'branding';

export interface StorageUploadResult {
  url: string;
  path: string;
  bucket: StorageBucket;
  isRealStorage: boolean;
  message: string;
}

export interface StorageBucketInfo {
  id: StorageBucket;
  name: string;
  description: string;
  public: boolean;
  fileSizeLimit: string;
  maxSizeBytes: number;
  allowedMimes: string[];
}

export const STORAGE_BUCKET_CONFIGS: Record<StorageBucket, StorageBucketInfo> = {
  events: {
    id: 'events',
    name: 'events',
    description: 'Imagens públicas para eventos publicados (banner principal, capa e galeria).',
    public: true,
    fileSizeLimit: '10 MB',
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  vehicles: {
    id: 'vehicles',
    name: 'vehicles',
    description: 'Fotos dos veículos cadastrados pelos usuários (foto principal e galeria).',
    public: true,
    fileSizeLimit: '10 MB',
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  profiles: {
    id: 'profiles',
    name: 'profiles',
    description: 'Fotos de perfil / avatares dos usuários e operadores.',
    public: true,
    fileSizeLimit: '5 MB',
    maxSizeBytes: 5 * 1024 * 1024,
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  branding: {
    id: 'branding',
    name: 'branding',
    description: 'Logos, banners e artes institucionais do PX CUSTOM.',
    public: true,
    fileSizeLimit: '10 MB',
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  },
};

export const SUGGESTED_BUCKETS: StorageBucketInfo[] = Object.values(STORAGE_BUCKET_CONFIGS);

export function getSupabaseStorageConfig() {
  return getSupabaseConfig();
}

/**
 * Verifica se a conexão com o Supabase está ativa e configurada
 */
export function isSupabaseStorageConnected(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config.isConfigured && supabase);
}

/**
 * Extrai a extensão limpa do arquivo
 */
export function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  if (idx === -1) return 'jpg';
  return cleanExtension(filename.substring(idx + 1));
}

/**
 * Constrói o caminho organizado e único conforme especificação:
 *
 * EVENTOS:
 * events/{eventId}/banner/{uuid}.{ext}
 * events/{eventId}/cover/{uuid}.{ext}
 * events/{eventId}/gallery/{uuid}.{ext}
 *
 * VEÍCULOS:
 * vehicles/{userId}/{vehicleId}/{uuid}.{ext}
 *
 * PERFIS:
 * profiles/{userId}/{uuid}.{ext}
 *
 * BRANDING:
 * branding/{category}/{uuid}.{ext}
 */
export function buildOrganizedStoragePath(params: {
  bucket: StorageBucket;
  resourceType: 'event_banner' | 'event_cover' | 'event_gallery' | 'vehicle' | 'profile' | 'branding';
  resourceId?: string;
  userId?: string;
  vehicleId?: string;
  category?: string;
  extension: string;
}): { fullPath: string; bucketRelativePath: string } {
  const uuid = generateStorageUUID();
  const ext = cleanExtension(params.extension);

  let bucketRelativePath = '';

  switch (params.resourceType) {
    case 'event_banner': {
      const eventId = params.resourceId || 'new';
      bucketRelativePath = `${eventId}/banner/${uuid}.${ext}`;
      break;
    }
    case 'event_cover': {
      const eventId = params.resourceId || 'new';
      bucketRelativePath = `${eventId}/cover/${uuid}.${ext}`;
      break;
    }
    case 'event_gallery': {
      const eventId = params.resourceId || 'new';
      bucketRelativePath = `${eventId}/gallery/${uuid}.${ext}`;
      break;
    }
    case 'vehicle': {
      const uId = params.userId || 'usr-participant';
      const vId = params.vehicleId || params.resourceId || 'veh-new';
      bucketRelativePath = `${uId}/${vId}/${uuid}.${ext}`;
      break;
    }
    case 'profile': {
      const uId = params.userId || params.resourceId || 'usr-participant';
      bucketRelativePath = `${uId}/${uuid}.${ext}`;
      break;
    }
    case 'branding': {
      const category = params.category || 'institutional';
      bucketRelativePath = `${category}/${uuid}.${ext}`;
      break;
    }
  }

  const fullPath = `${params.bucket}/${bucketRelativePath}`;
  return { fullPath, bucketRelativePath };
}

/**
 * Envia o arquivo ao Supabase Storage.
 *
 * - Quando o Supabase estiver configurado:
 *   Utiliza supabase.storage.from(bucket).upload(...)
 *   Gera a URL pública permanente.
 *
 * - Quando falhar ou não estiver conectado:
 *   Fallback gracioso para Data URL seguro na sessão, com mensagem clara sem travar a interface.
 */
export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: File | Blob
): Promise<StorageUploadResult> {
  const config = getSupabaseConfig();

  // Limpa o caminho para o método from(bucket)
  const bucketPrefix = `${bucket}/`;
  const cleanBucketPath = path.startsWith(bucketPrefix)
    ? path.slice(bucketPrefix.length)
    : path.startsWith('/')
    ? path.slice(1)
    : path;

  const fullStoragePath = path.startsWith(bucketPrefix) ? path : `${bucket}/${cleanBucketPath}`;

  // 1. Tentar upload real no Supabase Storage se configurado
  if (config.isConfigured && supabase) {
    try {
      const contentType = file.type || (bucket === 'branding' && path.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg');

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(cleanBucketPath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType,
        });

      if (error) {
        throw new Error(error.message);
      }

      // Obter URL pública do Supabase Storage
      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(cleanBucketPath);

      const publicUrl = publicData.publicUrl;

      return {
        url: publicUrl,
        path: fullStoragePath,
        bucket,
        isRealStorage: true,
        message: 'Arquivo armazenado com sucesso no Supabase Storage.',
      };
    } catch (err: any) {
      console.warn(
        `[Supabase Storage] Falha ao enviar para bucket "${bucket}" (${err.message}). Recorrendo ao preview local seguro.`,
        err
      );
    }
  }

  // 2. Fallback gracioso para modo local / preview transparente (NUNCA finge que salvou no Supabase)
  let localDataUrl: string;
  if (file instanceof File) {
    localDataUrl = await fileToDataUrl(file);
  } else {
    localDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return {
    url: localDataUrl,
    path: fullStoragePath,
    bucket,
    isRealStorage: false,
    message: 'Modo de demonstração: Supabase Storage não conectado. Imagens salvas localmente nesta sessão.',
  };
}

/**
 * Exclusão de arquivo no Supabase Storage
 */
export async function deleteFile(bucket: StorageBucket, path: string): Promise<boolean> {
  const config = getSupabaseConfig();

  const bucketPrefix = `${bucket}/`;
  const cleanBucketPath = path.startsWith(bucketPrefix)
    ? path.slice(bucketPrefix.length)
    : path.startsWith('/')
    ? path.slice(1)
    : path;

  if (config.isConfigured && supabase) {
    try {
      const { error } = await supabase.storage.from(bucket).remove([cleanBucketPath]);
      if (error) {
        console.error('Erro ao deletar arquivo do Supabase Storage:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Erro na chamada de exclusão do Supabase Storage:', err);
      return false;
    }
  }

  return true;
}

/**
 * Retorna URL pública do asset no Supabase Storage
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const config = getSupabaseConfig();

  const bucketPrefix = `${bucket}/`;
  const cleanBucketPath = path.startsWith(bucketPrefix)
    ? path.slice(bucketPrefix.length)
    : path.startsWith('/')
    ? path.slice(1)
    : path;

  if (config.isConfigured && supabase) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(cleanBucketPath);
    return data.publicUrl;
  }

  return path;
}
