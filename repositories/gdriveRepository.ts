import { getDriveClient } from '@/lib/googleSheets';
import { Readable } from 'stream';

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER || '';

export class GDriveRepository {
  /**
   * Uploads a file buffer (PDF, JPG, PNG, JPEG) to Google Drive and returns a shareable link.
   */
  static async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<{ fileId: string; webViewLink: string }> {
    const drive = getDriveClient();

    if (!drive) {
      console.warn('Google Drive Service Account missing in ENV. Returning base64 data URL for preview.');
      const dataUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      return {
        fileId: `base64-mock-${Date.now()}`,
        webViewLink: dataUrl,
      };
    }

    try {
      const bufferStream = new Readable();
      bufferStream.push(fileBuffer);
      bufferStream.push(null);

      const fileMetadata: any = {
        name: `${Date.now()}_${fileName}`,
      };

      if (DRIVE_FOLDER_ID) {
        fileMetadata.parents = [DRIVE_FOLDER_ID];
      }

      const media = {
        mimeType: mimeType,
        body: bufferStream,
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink',
      });

      const fileId = response.data.id || `file-${Date.now()}`;
      const webViewLink = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

      // Set file permission to public read
      try {
        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
      } catch (permErr) {
        console.warn('Could not set public permission on Google Drive file:', permErr);
      }

      return { fileId, webViewLink };
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      const dataUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      return {
        fileId: `base64-fallback-${Date.now()}`,
        webViewLink: dataUrl,
      };
    }
  }
}
