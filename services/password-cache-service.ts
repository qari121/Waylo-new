import AsyncStorage from '@react-native-async-storage/async-storage';

const PASSWORD_CACHE_KEY = 'waylo_cached_password';
const CACHE_EXPIRY_KEY = 'password_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Simple obfuscation key for basic security
const OBFUSCATION_KEY = 'waylo_2024_secure_cache';

/**
 * Simple obfuscation function using XOR
 * This is not encryption, just basic obfuscation for storage
 */
const obfuscate = (text: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return result;
};

/**
 * Simple deobfuscation function
 */
const deobfuscate = (obfuscatedText: string): string => {
  try {
    let result = '';
    for (let i = 0; i < obfuscatedText.length; i++) {
      const charCode = obfuscatedText.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (error) {
    throw new Error('Failed to deobfuscate password');
  }
};

/**
 * Securely cache user password for BLE transmission
 * Password is obfuscated and stored in AsyncStorage
 */
export const cacheUserPassword = async (password: string): Promise<void> => {
  try {
    // Set expiry time
    const expiryTime = Date.now() + CACHE_DURATION;
    
    // Obfuscate password before storing
    const obfuscatedPassword = obfuscate(password);
    
    // Store obfuscated password and expiry in AsyncStorage
    await AsyncStorage.setItem(PASSWORD_CACHE_KEY, obfuscatedPassword);
    await AsyncStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString());
    
    console.log('🔐 Password cached securely (obfuscated)');
  } catch (error) {
    console.error('❌ Failed to cache password:', error);
    throw error;
  }
};

/**
 * Retrieve cached user password
 * Returns null if no password is cached or if cache has expired
 */
export const getCachedPassword = async (): Promise<string | null> => {
  try {
    // Check if cache has expired first
    const expiryTimeStr = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);
    if (!expiryTimeStr) {
      console.log('🔍 No cached password found');
      return null;
    }
    
    const expiryTime = parseInt(expiryTimeStr, 10);
    if (Date.now() > expiryTime) {
      console.log('⏰ Cached password has expired, clearing cache');
      await clearCachedPassword();
      return null;
    }
    
    // Retrieve obfuscated password from AsyncStorage
    const obfuscatedPassword = await AsyncStorage.getItem(PASSWORD_CACHE_KEY);
    
    if (!obfuscatedPassword) {
      console.log('🔍 No cached password found in storage');
      return null;
    }
    
    // Deobfuscate password
    const password = deobfuscate(obfuscatedPassword);
    
    console.log('🔓 Retrieved cached password successfully');
    return password;
  } catch (error) {
    console.error('❌ Failed to retrieve cached password:', error);
    await clearCachedPassword(); // Clear corrupted cache
    return null;
  }
};

/**
 * Clear cached password (call on logout)
 */
export const clearCachedPassword = async (): Promise<void> => {
  try {
    // Remove obfuscated password and expiry from AsyncStorage
    await AsyncStorage.removeItem(PASSWORD_CACHE_KEY);
    await AsyncStorage.removeItem(CACHE_EXPIRY_KEY);
    
    console.log('🗑️ Cached password cleared from storage');
  } catch (error) {
    console.error('❌ Failed to clear cached password:', error);
  }
};

/**
 * Check if password is currently cached and valid
 */
export const isPasswordCached = async (): Promise<boolean> => {
  const password = await getCachedPassword();
  return password !== null;
};
