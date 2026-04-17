import PocketBase from 'pocketbase';

export const pb = new PocketBase(
  import.meta.env.VITE_POCKETBASE_URL || 'https://mjwdesign-core.pockethost.io'
);

pb.autoCancellation(false);

pb.afterSend = (response, data) => {
  if (response.status === 401 || response.status === 403) {
    pb.authStore.clear();
    window.dispatchEvent(new Event('pb:authError'));
  }
  return data;
};
