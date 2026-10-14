import { Capacitor } from '@capacitor/core';

export const isNativeApp = Capacitor.isNativePlatform();
export const isParentOnlyBuild = import.meta.env.VITE_APP_TARGET === 'parent' || isNativeApp;
export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
