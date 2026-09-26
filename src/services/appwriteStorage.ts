import { storage, ID } from '../lib/appwrite';

const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID || 'complaint-images';

export const appwriteStorageService = {
  /**
   * Upload an image file to Appwrite Storage bucket and return public/view URL
   */
  async uploadFile(file: File, bucketId = BUCKET_ID): Promise<{ fileId: string; url: string }> {
    try {
      const uniqueId = ID.unique();
      const response = await storage.createFile(bucketId, uniqueId, file);
      
      // Generate view/download URL
      const fileUrl = storage.getFileView(bucketId, response.$id);
      return {
        fileId: response.$id,
        url: fileUrl.toString()
      };
    } catch (error: any) {
      console.warn('[Appwrite Storage] Upload notice:', error);
      // Fallback: convert to base64 DataURL for client preview if storage bucket is not yet configured in cloud
      const fallbackDataUrl = await this.fileToDataUrl(file);
      return {
        fileId: 'local-' + Date.now(),
        url: fallbackDataUrl
      };
    }
  },

  /**
   * Delete a file from Appwrite Storage
   */
  async deleteFile(fileId: string, bucketId = BUCKET_ID): Promise<void> {
    try {
      if (fileId && !fileId.startsWith('local-')) {
        await storage.deleteFile(bucketId, fileId);
      }
    } catch (error) {
      console.warn('[Appwrite Storage] Delete notice:', error);
    }
  },

  /**
   * Helper to convert File to Data URL
   */
  fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};

export default appwriteStorageService;
