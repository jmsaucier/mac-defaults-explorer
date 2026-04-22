const { contextBridge, ipcRenderer } = require('electron');

async function invoke(channel, ...args) {
  try {
    return await ipcRenderer.invoke(channel, ...args);
  } catch (error) {
    return {
      error: error.message || 'Request failed.',
    };
  }
}

contextBridge.exposeInMainWorld('defaultsApi', {
  listDomains: () => invoke('defaults:domains'),
  readDomain: (domain) => invoke('defaults:read-domain', domain),
  readType: (domain, key) => invoke('defaults:read-type', domain, key),
  find: (query) => invoke('defaults:find', query),
});
