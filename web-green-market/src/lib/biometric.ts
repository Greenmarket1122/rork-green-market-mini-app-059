/**
 * WebAuthn-based "Face ID" / biometric authentication helper.
 * Uses the Web Authentication API (platform authenticator) to
 * register and verify a credential on the admin's device.
 *
 * On supported devices (iOS Safari with Face ID, Android with
 * fingerprint, etc.), this triggers the native biometric prompt.
 * Falls back gracefully when not available.
 */

const CREDENTIAL_KEY = "gm_admin_credential";
const CHALLENGE = new Uint8Array(32);
crypto.getRandomValues(CHALLENGE);

interface StoredCredential {
  id: string;
  rawId: string;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Check if WebAuthn with platform authenticator is available */
export function isBiometricAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials !== "undefined"
  );
}

/** Check if a platform authenticator (Face ID / fingerprint) is available */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isBiometricAvailable()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Check if admin has already registered a biometric credential */
export function hasBiometricCredential(): boolean {
  try {
    return localStorage.getItem(CREDENTIAL_KEY) !== null;
  } catch {
    return false;
  }
}

/** Register a new biometric credential on this device */
export async function registerBiometric(): Promise<boolean> {
  if (!isBiometricAvailable()) return false;
  try {
    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge: CHALLENGE,
      rp: { name: "Green Market Admin" },
      user: {
        id: new Uint8Array(16),
        name: "admin",
        displayName: "Green Market Admin",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: 60000,
      attestation: "none",
    };

    const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
    if (!credential) return false;

    const stored: StoredCredential = {
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
    };
    localStorage.setItem(CREDENTIAL_KEY, JSON.stringify(stored));
    return true;
  } catch (err) {
    console.warn("Biometric registration failed", err);
    return false;
  }
}

/** Verify the biometric credential (triggers Face ID / fingerprint prompt) */
export async function verifyBiometric(): Promise<boolean> {
  if (!isBiometricAvailable()) return false;
  const storedRaw = localStorage.getItem(CREDENTIAL_KEY);
  if (!storedRaw) return false;

  try {
    const stored = JSON.parse(storedRaw) as StoredCredential;
    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge: CHALLENGE,
      allowCredentials: [
        {
          id: base64ToArrayBuffer(stored.rawId),
          type: "public-key",
          transports: ["internal"],
        },
      ],
      userVerification: "required",
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({ publicKey });
    return assertion !== null;
  } catch (err) {
    console.warn("Biometric verification failed", err);
    return false;
  }
}

/** Remove the stored biometric credential */
export function removeBiometric(): void {
  localStorage.removeItem(CREDENTIAL_KEY);
}
