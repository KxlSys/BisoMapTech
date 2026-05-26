/**
 * Service de Chiffrement de Bout en Bout (E2EE)
 * 
 * Ce module implémente une cryptographie hybride au niveau du client en utilisant
 * l'API standard et hautement sécurisée Web Crypto du navigateur :
 * - Échange de clés : ECDH (Elliptic Curve Diffie-Hellman) sur la courbe P-256.
 * - Chiffrement symétrique : AES-GCM (256 bits) avec vecteur d'initialisation unique de 12 octets.
 * - Stockage des clés privées : IndexedDB (sécurisé, isolé par origine, clés non extractibles).
 */

const DB_NAME = "BisoMapE2EE";
const STORE_NAME = "keys";
const PRIVATE_KEY_ID = "privateKey";

// ============================================================
// Helpers de stockage IndexedDB (Promisifié)
// ============================================================

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePrivateKey(key: CryptoKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(key, PRIVATE_KEY_ID);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getPrivateKey(): Promise<CryptoKey | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(PRIVATE_KEY_ID);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// ============================================================
// Helpers d'encodage Base64 / ArrayBuffer
// ============================================================

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ============================================================
// API Cryptographique Principale
// ============================================================

export interface E2EEKeyPair {
  publicKeyJWK: string; // Clé publique au format JSON String (sauvegardée en DB)
}

/**
 * Génère une paire de clés ECDH P-256.
 * Enregistre la clé privée dans IndexedDB et retourne la clé publique au format JWK string.
 */
export async function generateE2EEKeyPair(): Promise<E2EEKeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // Extractible pour la clé publique (et la privée pour stockage initial)
    ["deriveKey", "deriveBits"]
  );

  // Sauvegarder la clé privée localement dans IndexedDB
  await savePrivateKey(keyPair.privateKey);

  // Exporter la clé publique sous forme de chaîne JSON JWK pour l'enregistrer dans profiles
  const publicKeyJWK = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);

  return {
    publicKeyJWK: JSON.stringify(publicKeyJWK),
  };
}

/**
 * Vérifie si l'utilisateur possède déjà une clé privée E2EE dans son IndexedDB.
 */
export async function hasE2EELocalKey(): Promise<boolean> {
  try {
    const key = await getPrivateKey();
    return key !== null;
  } catch {
    return false;
  }
}

/**
 * Dérive une clé symétrique AES-GCM-256 à partir de la clé privée de l'utilisateur
 * et de la clé publique JWK du correspondant.
 */
async function deriveSharedKey(
  myPrivateKey: CryptoKey,
  partnerPublicKeyJWKString: string
): Promise<CryptoKey> {
  const partnerJWK = JSON.parse(partnerPublicKeyJWKString);
  const partnerPublicKey = await window.crypto.subtle.importKey(
    "jwk",
    partnerJWK,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    []
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: partnerPublicKey,
    },
    myPrivateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// ============================================================
// Chiffrement / Déchiffrement de TEXTE
// ============================================================

export interface EncryptedPayload {
  cipherText: string; // Base64
  iv: string; // Base64
}

/**
 * Chiffre un texte en utilisant la clé publique du destinataire.
 */
export async function encryptText(
  plainText: string,
  recipientPublicKeyJWK: string
): Promise<EncryptedPayload> {
  const myPrivateKey = await getPrivateKey();
  if (!myPrivateKey) {
    throw new Error("Clé privée locale absente. Veuillez réinitialiser vos clés E2EE.");
  }

  const sharedKey = await deriveSharedKey(myPrivateKey, recipientPublicKeyJWK);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(plainText);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    sharedKey,
    encodedText
  );

  return {
    cipherText: arrayBufferToBase64(cipherBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Déchiffre un message chiffré en utilisant la clé publique de l'expéditeur.
 */
export async function decryptText(
  cipherTextBase64: string,
  senderPublicKeyJWK: string,
  ivBase64: string
): Promise<string> {
  const myPrivateKey = await getPrivateKey();
  if (!myPrivateKey) {
    throw new Error("Clé privée locale absente.");
  }

  const sharedKey = await deriveSharedKey(myPrivateKey, senderPublicKeyJWK);
  const cipherBuffer = base64ToArrayBuffer(cipherTextBase64);
  const ivBuffer = base64ToArrayBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer),
    },
    sharedKey,
    cipherBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}

// ============================================================
// Chiffrement / Déchiffrement de FICHIERS (Hybride)
// ============================================================

export interface EncryptedFilePayload {
  encryptedBlob: Blob;
  fileIv: string; // Base64
  wrappedFileKey: string; // Base64 (Clé AES locale chiffrée avec la clé publique du destinataire)
}

/**
 * Chiffre un fichier localement avec une clé AES-GCM unique, puis chiffre cette clé
 * symétrique avec la clé publique du destinataire.
 */
export async function encryptFile(
  file: File,
  recipientPublicKeyJWK: string
): Promise<EncryptedFilePayload> {
  const myPrivateKey = await getPrivateKey();
  if (!myPrivateKey) {
    throw new Error("Clé privée locale absente.");
  }

  // 1. Dériver le secret partagé (ECDH) avec le destinataire
  const sharedKey = await deriveSharedKey(myPrivateKey, recipientPublicKeyJWK);

  // 2. Générer une clé symétrique AES-GCM 256 bits dédiée pour le fichier
  const fileKey = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  // 3. Chiffrer le fichier en binaire
  const fileIv = window.crypto.getRandomValues(new Uint8Array(12));
  const fileBuffer = await file.arrayBuffer();
  const encryptedFileBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: fileIv,
    },
    fileKey,
    fileBuffer
  );

  // 4. Exporter la clé du fichier sous forme brute ("raw")
  const rawFileKey = await window.crypto.subtle.exportKey("raw", fileKey);

  // 5. Chiffrer (emballer) cette clé brute avec la clé secrète ECDH partagée
  const keyIv = window.crypto.getRandomValues(new Uint8Array(12));
  const wrappedKeyBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: keyIv,
    },
    sharedKey,
    rawFileKey
  );

  // 6. Assembler la clé enveloppée et son propre IV sous forme de chaîne base64 unifiée
  const wrappedPayload =
    arrayBufferToBase64(wrappedKeyBuffer) + ":" + arrayBufferToBase64(keyIv.buffer);

  return {
    encryptedBlob: new Blob([encryptedFileBuffer], { type: "application/octet-stream" }),
    fileIv: arrayBufferToBase64(fileIv.buffer),
    wrappedFileKey: wrappedPayload,
  };
}

/**
 * Déchiffre un fichier crypté à partir de son Blob chiffré, de l'IV, et de la clé
 * enveloppée de l'expéditeur.
 */
export async function decryptFile(
  encryptedBlob: Blob,
  senderPublicKeyJWK: string,
  fileIvBase64: string,
  wrappedFileKeyPayload: string,
  originalMimeType: string
): Promise<Blob> {
  const myPrivateKey = await getPrivateKey();
  if (!myPrivateKey) {
    throw new Error("Clé privée locale absente.");
  }

  // 1. Extraire la clé enveloppée et son IV
  const [wrappedKeyBase64, keyIvBase64] = wrappedFileKeyPayload.split(":");
  if (!wrappedKeyBase64 || !keyIvBase64) {
    throw new Error("Payload de clé de fichier invalide.");
  }

  // 2. Dériver le secret partagé ECDH avec l'expéditeur
  const sharedKey = await deriveSharedKey(myPrivateKey, senderPublicKeyJWK);

  // 3. Déballer (déchiffrer) la clé symétrique AES brute du fichier
  const wrappedKeyBuffer = base64ToArrayBuffer(wrappedKeyBase64);
  const keyIvBuffer = base64ToArrayBuffer(keyIvBase64);

  const rawFileKeyBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(keyIvBuffer),
    },
    sharedKey,
    wrappedKeyBuffer
  );

  // 4. Importer la clé symétrique AES déballée
  const fileKey = await window.crypto.subtle.importKey(
    "raw",
    rawFileKeyBuffer,
    "AES-GCM",
    true,
    ["decrypt"]
  );

  // 5. Déchiffrer le binaire du fichier
  const fileIvBuffer = base64ToArrayBuffer(fileIvBase64);
  const encryptedFileData = await encryptedBlob.arrayBuffer();

  const decryptedFileBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(fileIvBuffer),
    },
    fileKey,
    encryptedFileData
  );

  // 6. Retourner le Blob restauré avec son type MIME d'origine
  return new Blob([decryptedFileBuffer], { type: originalMimeType });
}
