import {securityVault} from './securityVault.js';
import {createConfiguredMediaTransport} from './mediaApiTransport.js';

// Every media mutation uses an authenticated server grant. No browser signing fallback.
const publicUrl=key=>securityVault.getPublicCloudUrl(key);
export const cloudMediaTransport=createConfiguredMediaTransport({
 gatewayUrl:import.meta.env.VITE_MEDIA_API_URL?.trim()||'https://krc-erp-media-gateway.jyotsnachaudhari999.workers.dev/api/media',
 publicUrl,
 uploadOrigins:[new URL(publicUrl('')).origin],
 allowLocal:import.meta.env.DEV,
});
