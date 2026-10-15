import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class CoffeeStickerModule extends NativeModule<{}> {
  stickerAsync(source: string, key: string, size: number): Promise<string | null>;
}

// Missing on Android, the web and in Expo Go, where photos stay photos.
export default requireOptionalNativeModule<CoffeeStickerModule>('CoffeeSticker');
