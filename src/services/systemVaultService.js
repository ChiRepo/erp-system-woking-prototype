import {securityVault} from './securityVault.js';

// Compatibility surface for public client API configuration only.
// Private signing material is managed in the media server secret store.
export const systemVaultService={
 async getApiKey(serviceName='klipy'){return securityVault.fetchEncryptedApiKey(serviceName);},
 async initializeAndSeedVault(){return false;},
};
