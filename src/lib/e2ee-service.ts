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

// ============================================================
// Sauvegarde / Restauration Zero-Knowledge de la Clé Privée
// ============================================================

/**
 * Dérive une clé AES-GCM 256 bits à partir de la phrase secrète de l'utilisateur
 * en utilisant PBKDF2 (100 000 itérations, SHA-256).
 */
async function deriveWrappingKey(passphrase: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const passphraseBytes = new TextEncoder().encode(passphrase);
  
  // 1. Importer le matériau de clé brut à partir de la phrase de passe
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    passphraseBytes,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  // 2. Dériver la clé AES
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Récupère la clé privée depuis IndexedDB, l'exporte en JWK,
 * la chiffre en AES-GCM avec une clé dérivée de la phrase secrète,
 * et renvoie la clé chiffrée (Base64) et le sel (Base64).
 */
export async function backupPrivateKey(passphrase: string): Promise<{ encryptedKeyBase64: string; saltBase64: string }> {
  // 1. Récupérer la clé privée d'IndexedDB
  const myPrivateKey = await getPrivateKey();
  if (!myPrivateKey) {
    throw new Error("Clé privée locale introuvable dans ce navigateur.");
  }

  // 2. Générer un sel aléatoire pour PBKDF2 (16 octets)
  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  // 3. Dériver la clé de wrapping à partir de la phrase secrète et du sel
  const wrappingKey = await deriveWrappingKey(passphrase, salt.buffer);

  // 4. Exporter la clé privée E2EE en JWK
  const privateKeyJWK = await window.crypto.subtle.exportKey("jwk", myPrivateKey);
  const privateKeyBytes = new TextEncoder().encode(JSON.stringify(privateKeyJWK));

  // 5. Chiffrer la clé exportée avec AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    wrappingKey,
    privateKeyBytes
  );

  const ivBase64 = arrayBufferToBase64(iv.buffer);
  const cipherBase64 = arrayBufferToBase64(encryptedBuffer);

  return {
    encryptedKeyBase64: `${ivBase64}:${cipherBase64}`,
    saltBase64: arrayBufferToBase64(salt.buffer),
  };
}

/**
 * Déchiffre la clé privée sauvegardée à l'aide de la phrase secrète,
 * puis la réimporte et l'enregistre de manière sécurisée dans IndexedDB.
 */
export async function restorePrivateKey(
  encryptedKeyBase64: string,
  saltBase64: string,
  passphrase: string
): Promise<boolean> {
  try {
    // 1. Extraire l'IV et le texte chiffré
    const [ivBase64, cipherBase64] = encryptedKeyBase64.split(":");
    if (!ivBase64 || !cipherBase64) {
      throw new Error("Format de clé privée chiffrée invalide.");
    }

    const saltBuffer = base64ToArrayBuffer(saltBase64);
    const ivBuffer = base64ToArrayBuffer(ivBase64);
    const cipherBuffer = base64ToArrayBuffer(cipherBase64);

    // 2. Dériver la clé de wrapping
    const wrappingKey = await deriveWrappingKey(passphrase, saltBuffer);

    // 3. Déchiffrer la clé privée
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(ivBuffer),
      },
      wrappingKey,
      cipherBuffer
    );

    const privateKeyJWKString = new TextDecoder().decode(decryptedBuffer);
    const privateKeyJWK = JSON.parse(privateKeyJWKString);

    // 4. Importer la clé privée déchiffrée
    const importedPrivateKey = await window.crypto.subtle.importKey(
      "jwk",
      privateKeyJWK,
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      ["deriveKey", "deriveBits"]
    );

    // 5. Enregistrer localement dans IndexedDB
    await savePrivateKey(importedPrivateKey);
    return true;
  } catch (err) {
    console.error("[E2EE] Échec du déchiffrement et de la restauration de la clé E2EE :", err);
    return false;
  }
}

