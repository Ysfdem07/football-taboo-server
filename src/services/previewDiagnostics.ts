// src/services/previewDiagnostics.ts
//
// Temporary, on-screen error reporting for the "preview" EAS build/channel
// only — used to see exactly why a native init call fails on a real device
// without needing Xcode/Console.app access. Never fires on the production
// channel, so it's safe to leave the call sites in place even if this file
// ships in a production bundle by accident; only remove once Crashlytics/
// Analytics are confirmed working on iOS.
//
// Uses React Native's own Alert.alert(), not our CustomAlert component:
// CustomAlert.show() routes through a module-level function that only gets
// wired up once <CustomAlert /> itself has mounted, and every prior round
// of diagnostics through it produced zero visible alerts on a real preview
// build (even ones bounded by a timeout, guaranteed to fire) — so it's
// suspect on its own. Alert.alert() is native and has no such dependency.
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

function isPreview(): boolean {
  try {
    return Updates.channel !== 'production';
  } catch (e) {
    return true; // if we can't even tell, err on the side of showing it
  }
}

export function reportPreviewInitError(label: string, err: unknown): void {
  try {
    if (!isPreview()) return;
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    Alert.alert(`[Preview] ${label} failed`, message);
  } catch (e) {
    // Never let the diagnostic itself throw.
  }
}

// Same idea, but for confirming things WORKED (not just errors) — used when
// "no error was thrown" isn't enough to know whether a native call actually
// did anything.
export function reportPreviewStatus(label: string, lines: string[]): void {
  try {
    if (!isPreview()) return;
    Alert.alert(`[Preview] ${label}`, lines.join('\n'));
  } catch (e) {
    // Never let the diagnostic itself throw.
  }
}
