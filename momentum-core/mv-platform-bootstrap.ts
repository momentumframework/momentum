export interface MvPlatformBootstrap {
  onPlatformBootstrap(): void | Promise<void>;
}
