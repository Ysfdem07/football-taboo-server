// src/services/previewDiagnostics.ts
//
// Temporary, on-screen error reporting for the "preview" EAS build/channel
// only — used to see exactly why a native init call fails on a real device
// without needing Xcode/Console.app access. Never fires on the production
// channel, so it's safe to leave the call sites in place even if this file
// ships in a production bundle by accident; only remove once Crashlytics/
// Analytics are confirmed working on iOS.
import * as Updates from 'expo-updates';
import { CustomAlert } from '../components/CustomAlert';

export function reportPreviewInitError(label: string, err: unknown): void {
  try {
    if (Updates.channel === 'production') return;
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    CustomAlert.show(`[Preview] ${label} failed`, message);
  } catch (e) {
    // Never let the diagnostic itself throw.
  }
}
