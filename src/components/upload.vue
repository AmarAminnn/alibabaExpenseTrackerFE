<template>
    <v-container>
        <v-card class="mx-auto pa-5 mb-6" max-width="600" outlined>
            <v-card-title class="text-h5 font-weight-bold mb-4">
                Upload Expense Document
            </v-card-title>
            <v-card-text>
                <p class="mb-4">
                    Select a file (e.g., receipt image, PDF report) to upload for your expense.
                </p>

                <v-file-input v-model="selectedFile" label="Select File" outlined dense show-size
                    accept="image/*,application/pdf,.csv,.xls,.xlsx,.doc,.docx" prepend-icon="mdi-paperclip"
                    @change="handleFileChange" class="mb-4" :key="fileInputKey">
                    <template v-slot:selection="{ text }">
                        <v-chip small label color="primary">
                            {{ text }}
                        </v-chip>
                    </template>
                </v-file-input>

                <v-row v-if="filePreviewUrl && isImage" class="mb-4">
                    <v-col cols="12">
                        <p class="font-weight-medium">Image Preview:</p>
                        <v-img :src="filePreviewUrl" max-height="300" contain class="rounded-lg border"
                            alt="File Preview"></v-img>
                    </v-col>
                </v-row>
                <v-row v-else-if="selectedFile && !isImage" class="mb-4">
                    <v-col cols="12">
                        <p class="font-weight-medium">Selected File:</p>
                        <v-chip color="blue-grey" dark>
                            <v-icon left>mdi-file-outline</v-icon>
                            {{ selectedFile.name }} ({{ formatBytes(selectedFile.size) }})
                        </v-chip>
                    </v-col>
                </v-row>

                <v-btn :disabled="!selectedFile || uploading || (isImage && !isPreviewReady)" :loading="uploading"
                    color="success" large block @click="uploadFile" class="mt-4">
                    <v-icon left>mdi-upload</v-icon>
                    Upload <span v-if="isImage && !isPreviewReady" class="ml-2">(Processing preview...)</span>
                </v-btn>

                <v-progress-linear v-if="uploading" v-model="uploadProgress" color="primary" height="20" reactive
                    class="mt-4">
                    <template v-slot:default="{ value }">
                        <strong>{{ Math.ceil(value) }}%</strong>
                    </template>
                </v-progress-linear>

                <v-alert v-if="uploadMessage" :type="uploadStatus" dense text class="mt-4">
                    {{ uploadMessage }}
                </v-alert>
            </v-card-text>
        </v-card>

        <v-card class="mx-auto pa-5" max-width="600" outlined v-if="uploadedFiles.length > 0">
            <v-card-title class="text-h6 font-weight-medium mb-3">
                Uploaded Documents
            </v-card-title>
            <v-list dense>
                <v-list-item v-for="(file, index) in uploadedFiles" :key="index"
                    @click="file.isImage ? viewImage(file) : null" :class="{ 'clickable': file.isImage }">
                    <v-list-item-icon>
                        <v-icon v-if="file.isImage">mdi-image</v-icon>
                        <v-icon v-else>mdi-file-document-outline</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                        <v-list-item-title>{{ file.name }}</v-list-item-title>
                        <v-list-item-subtitle v-if="file.isImage">Click to view</v-list-item-subtitle>
                    </v-list-item-content>
                    <v-list-item-action v-if="file.isImage">
                        <v-btn icon @click.stop="viewImage(file)">
                            <v-icon color="grey lighten-1">mdi-eye</v-icon>
                        </v-btn>
                    </v-list-item-action>
                </v-list-item>
            </v-list>
        </v-card>

        <v-dialog v-model="showImageViewer" max-width="800px" persistent>
            <v-card>
                <v-card-title>
                    <span class="text-h5">{{ viewingImageName }}</span>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="closeImageViewer">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                <v-card-text class="pa-4 d-flex justify-center align-center" style="min-height: 300px;">
                    <v-img :src="viewingImageUrl" contain max-height="70vh" alt="Image Preview"
                        class="rounded-lg"></v-img>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="closeImageViewer">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-container>
</template>

<script>
export default {
    name: 'ExpenseUpload',
    data() {
        return {
            selectedFile: null,
            filePreviewUrl: null,
            isImage: false,
            isPreviewReady: true, // New flag: True if preview is loaded or not an image
            uploading: false,
            uploadProgress: 0,
            uploadMessage: '',
            uploadStatus: 'info',
            fileInputKey: 0,

            uploadedFiles: [],

            showImageViewer: false,
            viewingImageUrl: '',
            viewingImageName: '',
        };
    },
    methods: {
        handleFileChange(file) {
            this.uploadMessage = '';
            this.uploadStatus = 'info';
            this.uploadProgress = 0;
            // Reset preview readiness state
            this.isPreviewReady = !file; // If no file, it's "ready" (nothing to process)

            if (!file) {
                this.selectedFile = null;
                this.filePreviewUrl = null;
                this.isImage = false;
                return;
            }

            this.selectedFile = file;
            this.isImage = file.type.startsWith('image/');

            if (this.isImage) {
                this.isPreviewReady = false; // Mark preview as not ready for images initially
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.filePreviewUrl = e.target.result;
                    this.isPreviewReady = true; // Mark preview as ready once FileReader is done
                };
                reader.onerror = () => {
                    console.error("FileReader error.");
                    this.uploadMessage = "Error reading file for preview.";
                    this.uploadStatus = "error";
                    this.isPreviewReady = true; // Allow proceeding or re-selecting even on error
                }
                reader.readAsDataURL(file);
            } else {
                this.filePreviewUrl = null;
                this.isPreviewReady = true; // Non-images don't need async preview, so they are "ready"
            }
        },

        async uploadFile() {
            if (!this.selectedFile) {
                this.uploadMessage = 'Please select a file first.';
                this.uploadStatus = 'warning';
                return;
            }

            // This check is now more robust due to the button's disabled state
            if (this.isImage && !this.isPreviewReady) {
                this.uploadMessage = 'Image preview is still processing. Please wait.';
                this.uploadStatus = 'warning';
                return;
            }

            this.uploading = true;
            this.uploadProgress = 0;
            this.uploadMessage = '';

            const fileToUpload = {
                name: this.selectedFile.name,
                size: this.selectedFile.size,
                type: this.selectedFile.type,
                isImage: this.isImage,
                url: this.isImage ? this.filePreviewUrl : null // This should now be correctly populated
            };

            let progress = 0;
            const progressInterval = setInterval(() => {
                if (progress < 100) {
                    progress += 10;
                    this.uploadProgress = progress;
                } else {
                    clearInterval(progressInterval);
                }
            }, 200);

            try {
                await new Promise(resolve => setTimeout(resolve, 1500)); // Reduced simulation time
                clearInterval(progressInterval);
                this.uploadProgress = 100;

                this.uploadMessage = `File "${fileToUpload.name}" processed (simulated).`;
                this.uploadStatus = 'success';
                console.log('Uploaded file details:', fileToUpload); // Check this log

                // Crucial check: Ensure URL is present for images
                if (fileToUpload.isImage && !fileToUpload.url) {
                    console.error("CRITICAL: Image URL is null even after preview logic. This shouldn't happen.", fileToUpload);
                    // Fallback or error handling if needed
                }
                this.uploadedFiles.push(fileToUpload);

                this.$emit('file-uploaded', { fileName: fileToUpload.name, fileSize: fileToUpload.size });
                this.resetSelection();

            } catch (error) {
                clearInterval(progressInterval);
                this.uploadProgress = 0;
                console.error('Upload error:', error);
                this.uploadMessage = `An error occurred during upload: ${error.message || 'Unknown error'}`;
                this.uploadStatus = 'error';
                this.uploading = false;
            }
        },

        resetSelection() {
            setTimeout(() => {
                this.selectedFile = null;
                this.filePreviewUrl = null;
                this.isImage = false;
                this.isPreviewReady = true; // Reset readiness
                this.uploadProgress = 0;
                this.uploading = false;
                this.fileInputKey++;
                // Clear success message after a bit longer
                setTimeout(() => { this.uploadMessage = ''; }, 2000);
            }, 1000);
        },

        formatBytes(bytes, decimals = 2) {
            if (!bytes || bytes === 0) return '0 Bytes';
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        },

        viewImage(file) {
            if (file.isImage && file.url) {
                this.viewingImageUrl = file.url;
                this.viewingImageName = file.name;
                this.showImageViewer = true;
            } else {
                console.warn("Attempted to view non-image or image with no URL:", file);
                // Optionally, show a message to the user
                this.uploadMessage = `Cannot display preview for "${file.name}". URL is missing.`;
                this.uploadStatus = "warning";
            }
        },

        closeImageViewer() {
            this.showImageViewer = false;
            this.viewingImageUrl = '';
            this.viewingImageName = '';
        }
    },
    watch: {
        selectedFile(newFile, oldFile) {
            // If the file is cleared programmatically or by user, handleFileChange will be triggered.
            // This watcher is mostly for observing changes if needed for other logic.
            if (!newFile && oldFile) {
                // Ensure isPreviewReady is reset if file is cleared.
                // handleFileChange already does this, but this is a safeguard.
                this.isPreviewReady = true;
            }
        }
    }
};
</script>

<style scoped>
.v-card {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.v-progress-linear {
    border-radius: 8px;
}

.border {
    border: 1px solid #e0e0e0;
    /* Vuetify's grey lighten-2 */
}

.clickable {
    cursor: pointer;
}

.clickable:hover {
    background-color: rgba(0, 0, 0, 0.05);
    /* Slight hover effect */
}
</style>