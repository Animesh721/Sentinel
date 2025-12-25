import Pusher from 'pusher';

let pusherInstance = null;

export function getPusher() {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true
    });
  }
  return pusherInstance;
}

export async function emitVideoProgress(organization, data) {
  const pusher = getPusher();
  await pusher.trigger(`org-${organization}`, 'video:progress', data);
}

export async function emitVideoComplete(organization, data) {
  const pusher = getPusher();
  await pusher.trigger(`org-${organization}`, 'video:complete', data);
}

export async function emitVideoError(organization, data) {
  const pusher = getPusher();
  await pusher.trigger(`org-${organization}`, 'video:error', data);
}
