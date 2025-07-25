import { google } from 'googleapis';
import { Readable } from 'stream';

class DirectGDriveService {
    constructor() {
        this.drive = null;
        this.auth = null;
        this.isConnected = false;
    }

    async initialize() {
        try {
            // Initialize Google Auth
            if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
                // Use service account from environment variable
                const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
                this.auth = new google.auth.GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/drive']
                });
            } else {
                // Fallback to OAuth (for development)
                this.auth = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET,
                    process.env.GOOGLE_REDIRECT_URI
                );
            }

            this.drive = google.drive({ version: 'v3', auth: this.auth });
            this.isConnected = true;
            console.log('✅ Direct Google Drive service initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Google Drive service:', error);
            return false;
        }
    }

    async searchFiles(query, maxResults = 10) {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            const response = await this.drive.files.list({
                q: query,
                pageSize: maxResults,
                fields: 'files(id,name,mimeType,size,modifiedTime,parents)'
            });

            return {
                content: response.data.files || [],
                error: null
            };
        } catch (error) {
            console.error('Search files error:', error);
            return {
                content: [],
                error: error.message
            };
        }
    }

    async listFiles(folderId = 'root', maxResults = 50) {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            const response = await this.drive.files.list({
                q: `'${folderId}' in parents and trashed=false`,
                pageSize: maxResults,
                fields: 'files(id,name,mimeType,size,modifiedTime,parents)',
                orderBy: 'folder,name'
            });

            return {
                content: response.data.files || [],
                error: null
            };
        } catch (error) {
            console.error('List files error:', error);
            return {
                content: [],
                error: error.message
            };
        }
    }

    async createFolder(folderName, parentFolderId = 'root') {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            const response = await this.drive.files.create({
                requestBody: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [parentFolderId]
                },
                fields: 'id,name'
            });

            return {
                content: response.data,
                error: null
            };
        } catch (error) {
            console.error('Create folder error:', error);
            return {
                content: null,
                error: error.message
            };
        }
    }

    async uploadFile(fileName, fileBuffer, parentFolderId = 'root', mimeType = 'application/octet-stream') {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            const stream = new Readable();
            stream.push(fileBuffer);
            stream.push(null);

            const response = await this.drive.files.create({
                requestBody: {
                    name: fileName,
                    parents: [parentFolderId]
                },
                media: {
                    mimeType: mimeType,
                    body: stream
                },
                fields: 'id,name,size'
            });

            return {
                content: response.data,
                error: null
            };
        } catch (error) {
            console.error('Upload file error:', error);
            return {
                content: null,
                error: error.message
            };
        }
    }

    async deleteFile(fileId) {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            await this.drive.files.delete({
                fileId: fileId
            });

            return {
                content: { success: true },
                error: null
            };
        } catch (error) {
            console.error('Delete file error:', error);
            return {
                content: null,
                error: error.message
            };
        }
    }

    async downloadFile(fileId) {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            const response = await this.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });

            return {
                content: { downloadUrl: response.config.url },
                error: null
            };
        } catch (error) {
            console.error('Download file error:', error);
            return {
                content: null,
                error: error.message
            };
        }
    }

    // AI Assistant methods for chat
    async analyzeJuneDocuments() {
        try {
            const juneQuery = "name contains 'june' or name contains 'June'";
            const result = await this.searchFiles(juneQuery, 20);
            
            if (result.error) {
                return `Error searching for June documents: ${result.error}`;
            }

            const files = result.content;
            if (files.length === 0) {
                return "No documents containing 'June' found in your Google Drive.";
            }

            let response = `Found ${files.length} documents related to June:\n\n`;
            files.forEach((file, index) => {
                response += `${index + 1}. **${file.name}**\n`;
                response += `   - Type: ${this.getFileType(file.mimeType)}\n`;
                response += `   - Modified: ${new Date(file.modifiedTime).toLocaleDateString()}\n`;
                if (file.size) {
                    response += `   - Size: ${this.formatFileSize(file.size)}\n`;
                }
                response += `\n`;
            });

            return response;
        } catch (error) {
            return `Error analyzing June documents: ${error.message}`;
        }
    }

    getFileType(mimeType) {
        const types = {
            'application/vnd.google-apps.document': 'Google Doc',
            'application/vnd.google-apps.spreadsheet': 'Google Sheet',
            'application/vnd.google-apps.presentation': 'Google Slides',
            'application/vnd.google-apps.folder': 'Folder',
            'application/pdf': 'PDF',
            'image/': 'Image',
            'video/': 'Video',
            'audio/': 'Audio'
        };

        for (const [key, value] of Object.entries(types)) {
            if (mimeType.includes(key)) {
                return value;
            }
        }
        return 'File';
    }

    formatFileSize(bytes) {
        if (!bytes) return 'Unknown size';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Health check
    async checkConnection() {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }
            
            // Try to list root folder to test connection
            await this.drive.files.list({ pageSize: 1 });
            return true;
        } catch (error) {
            console.error('Drive connection check failed:', error);
            return false;
        }
    }
}

export default DirectGDriveService;
