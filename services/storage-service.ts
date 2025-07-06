import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

/**
 * Helper to get a real file path from a URI (handles iOS ph:// URIs)
 */
export async function getRealPathFromURI(uri: string): Promise<string> {
  if (uri.startsWith('ph://')) {
    try {
      const assetInfo = await MediaLibrary.getAssetInfoAsync(uri);
      if (assetInfo.localUri) {
        return assetInfo.localUri;
      }
      throw new Error('Could not resolve localUri from ph:// URI');
    } catch (e) {
      console.error('Error resolving ph:// URI:', e, uri);
      throw e;
    }
  }
  return uri;
}

export class StorageService {
  /**
   * Test Firebase Storage connection and configuration
   */
  static async testStorageConnection(): Promise<boolean> {
    try {
      console.log('=== Testing Firebase Storage Connection ===');
      console.log('Storage app options:', storage.app.options);
      console.log('Storage bucket:', storage.app.options.storageBucket);
      console.log('Project ID:', storage.app.options.projectId);
      
      // Try to create a test reference
      const testRef = ref(storage, 'test-connection.txt');
      console.log('Test reference created successfully');
      
      return true;
    } catch (error) {
      console.error('Firebase Storage connection test failed:', error);
      return false;
    }
  }
  /**
   * Upload a profile image to Firebase Storage
   * @param uri - Local file URI
   * @param userId - User ID to associate with the image
   * @returns Promise<string> - Download URL of the uploaded image
   */
  static async uploadProfileImage(uri: string, userId: string): Promise<string> {
    try {
      console.log('Uploading image. URI:', uri);
      if (!userId) {
        throw new Error('User ID is undefined. User must be authenticated.');
      }
      
      // Debug Firebase Storage configuration
      console.log('Firebase Storage bucket:', storage.app.options.storageBucket);
      console.log('Firebase project ID:', storage.app.options.projectId);
      
      const realUri = await getRealPathFromURI(uri);
      console.log('Resolved real URI:', realUri);
      
      // Ensure the URI is a file URI
      const fileUri = realUri.startsWith('file://') ? realUri : `file://${realUri}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      console.log('File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('File does not exist at path: ' + fileUri);
      }
      
      // Read the file as a blob
      const response = await fetch(fileUri);
      if (!response.ok) {
        throw new Error('Failed to fetch image for upload');
      }
      const blob = await response.blob();
      console.log('Blob size:', blob.size, 'bytes');
      
      // Create a unique filename
      const filename = `profile-images/${userId}/${Date.now()}.jpg`;
      console.log('Uploading to path:', filename);
      const storageRef = ref(storage, filename);
      
      // Upload the blob with better error handling
      console.log('Starting upload...');
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
      });
      console.log('Upload completed, snapshot:', snapshot);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      return downloadURL;
    } catch (error: any) {
      // Enhanced error logging with more details
      console.error('=== Firebase Storage Upload Error ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status_);
      console.error('Error customData:', error.customData);
      console.error('Full error object:', error);
      
      // Check for specific error types
      if (error.code === 'storage/unauthorized') {
        console.error('Storage unauthorized - check Firebase Storage rules');
      } else if (error.code === 'storage/bucket-not-found') {
        console.error('Storage bucket not found - check Firebase project configuration');
      } else if (error.code === 'storage/unknown') {
        console.error('Unknown storage error - check network connection and Firebase configuration');
      }
      
      throw new Error(`Failed to upload profile image: ${error.message}`);
    }
  }

  /**
   * Delete a profile image from Firebase Storage
   * @param imageUrl - Full URL of the image to delete
   */
  static async deleteProfileImage(imageUrl: string): Promise<void> {
    try {
      // Extract the path from the URL
      const url = new URL(imageUrl);
      const path = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] || '');
      
      if (path) {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
      }
    } catch (error) {
      console.error('Error deleting profile image:', error);
      // Don't throw error for deletion failures as it's not critical
    }
  }

  /**
   * Update profile image - uploads new image and optionally deletes old one
   * @param newImageUri - Local URI of the new image
   * @param userId - User ID
   * @param oldImageUrl - Optional URL of the old image to delete
   * @returns Promise<string> - Download URL of the new image
   */
  static async updateProfileImage(
    newImageUri: string, 
    userId: string, 
    oldImageUrl?: string
  ): Promise<string> {
    try {
      // Upload new image
      const newImageUrl = await this.uploadProfileImage(newImageUri, userId);
      
      // Delete old image if provided
      if (oldImageUrl) {
        await this.deleteProfileImage(oldImageUrl);
      }
      
      return newImageUrl;
    } catch (error) {
      console.error('Error updating profile image:', error);
      throw new Error('Failed to update profile image');
    }
  }
} 