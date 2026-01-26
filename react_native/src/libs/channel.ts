import { ChannelIO, BootConfig } from 'react-native-channel-plugin';
import Config from 'react-native-config';

let booted = false;

interface ChannelUser {
  name?: string | null;
  mobileNumber?: string | null;
}

export async function ensureChannelBoot(profile: ChannelUser) {
  if (booted) return;

  const cfg: BootConfig = {
    pluginKey: Config.CHANNEL_PLUGIN_KEY!,

    profile: {
      name: profile?.name,
      mobileNumber: profile?.mobileNumber,
    },
    language: 'ko',
  };

  try {
    await ChannelIO.boot(cfg);
    if (__DEV__) {
      console.log('[Channel][ensureChannelBoot] boot success');
    }
  } catch (error) {
    if (__DEV__) {
      console.log('[Channel][ensureChannelBoot] boot FAILED:', error);
    }
    throw error;
  }
}

export async function shutdownChannelIO() {
  booted = false;
  await ChannelIO.shutdown();
}

export function openChannelTalk() {
  return ChannelIO.openWorkflow('776955');
}

export function openReport() {
  return ChannelIO.openWorkflow('777357');
}
