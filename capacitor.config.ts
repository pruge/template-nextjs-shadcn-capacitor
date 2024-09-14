import type {CapacitorConfig} from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.cling.serial',
  appName: 'serial',
  webDir: 'out',
  server: {
    url: 'http://192.168.0.206:3000',
    cleartext: true,
  },
}

export default config
