<template>
    <v-container>
        <v-card class="mx-auto pa-5 mb-6" max-width="600" outlined @dragenter.prevent.stop="onDragEnter"
            @dragover.prevent.stop="onDragOver" @dragleave.prevent.stop="onDragLeave" @drop.prevent.stop="onDrop"
            :class="{ 'drag-over-active': isDraggingOver && !receiptProcessedSuccessfully, 'disabled-drop-zone': receiptProcessedSuccessfully }">
            <v-card-title class="text-h5 font-weight-bold mb-4">
                Upload Expense Document
            </v-card-title>
            <v-card-text>
                <div v-if="isDraggingOver && !receiptProcessedSuccessfully" class="drop-indicator">
                    <v-icon size="48" color="primary">mdi-file-upload-outline</v-icon>
                    <p class="text-h6 primary--text mt-2">Drop file here</p>
                </div>
                <div v-if="receiptProcessedSuccessfully && !uploading" class="processed-indicator">
                    <v-icon size="48" color="success">mdi-check-circle-outline</v-icon>
                    <p class="text-h6 success--text mt-2">Receipt Processed. Analyze another below.</p>
                </div>


                <p class="mb-4" v-if="!receiptProcessedSuccessfully">
                    Select a file or drag and drop it here (e.g., receipt image, PDF report).
                </p>

                <v-file-input v-model="selectedFileValue" label="Select File" outlined dense show-size
                    accept="image/*,application/pdf,.csv,.xls,.xlsx,.doc,.docx" prepend-icon="mdi-paperclip"
                    @change="onFileInputChange" class="mb-4" :key="fileInputKey"
                    :disabled="receiptProcessedSuccessfully || uploading">
                    <template v-slot:selection="{ text }">
                        <v-chip small label color="primary">
                            {{ text }}
                        </v-chip>
                    </template>
                </v-file-input>

                <v-row v-if="filePreviewUrl && isImage && !receiptProcessedSuccessfully" class="mb-4">
                    <v-col cols="12">
                        <p class="font-weight-medium">Image Preview:</p>
                        <v-img :src="filePreviewUrl" max-height="300" contain class="rounded-lg border"
                            alt="File Preview"></v-img>
                    </v-col>
                </v-row>
                <v-row v-else-if="actualFileObject && !isImage && !receiptProcessedSuccessfully" class="mb-4">
                    <v-col cols="12">
                        <p class="font-weight-medium">Selected File:</p>
                        <v-chip color="blue-grey" dark>
                            <v-icon left>mdi-file-outline</v-icon>
                            {{ actualFileObject.name }} ({{ formatBytes(actualFileObject.size) }})
                        </v-chip>
                    </v-col>
                </v-row>

                <v-btn v-if="!receiptProcessedSuccessfully"
                    :disabled="!actualFileObject || uploading || (isImage && !isPreviewReady)" :loading="uploading"
                    color="success" large block @click="uploadFile" class="mt-4">
                    <v-icon left>mdi-receipt-text-scan-outline</v-icon>
                    Analyze Receipt <span v-if="isImage && !isPreviewReady" class="ml-2">(Processing preview...)</span>
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

                <v-btn v-if="receiptProcessedSuccessfully && !uploading" color="primary" large block
                    @click="resetForNewReceipt" class="mt-6">
                    <v-icon left>mdi-refresh</v-icon>
                    Analyze Another Receipt
                </v-btn>

            </v-card-text>
        </v-card>

        <v-card class="mx-auto pa-5" max-width="600" outlined v-if="uploadedFiles.length > 0">
            <v-card-title class="text-h6 font-weight-medium mb-3">
                Last Processed Document
            </v-card-title>
            <v-list dense>
                <v-list-item v-for="(file, index) in uploadedFiles" :key="index"
                    @click="file.isImage ? viewImage(file) : null" :class="{ 'clickable': file.isImage }" class="pa-2">
                        <v-icon v-if="file.isImage">mdi-image</v-icon>
                        <v-icon v-else>mdi-file-document-outline</v-icon>


                        <v-img v-if="file.isImage && file.url" :src="file.url" max-height="300px" contain
                            class="mb-2 rounded-lg"
                            style="border: 1px solid #e0e0e0; background-color: #f9f9f9; width: 100%;"
                            alt="Uploaded Preview"></v-img>
                        <v-list-item-title class="font-weight-medium mt-1"
                            :class="{ 'text-center': file.isImage && file.url }">
                            {{ file.name }}
                        </v-list-item-title>
                        <v-list-item-subtitle v-if="file.isImage" :class="{ 'text-center': file.isImage && file.url }">
                            Click list item or eye icon to view in dialog
                        </v-list-item-subtitle>
                        <v-list-item-subtitle v-else class="mt-1">
                            {{ formatBytes(file.size) }}
                        </v-list-item-subtitle>


                    <v-list-item-action class="align-self-start mt-3">
                        <v-btn icon @click.stop="viewImage(file)" v-if="file.isImage">
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
            selectedFileValue: null,
            actualFileObject: null,
            filePreviewUrl: null,
            isImage: false,
            isPreviewReady: true,
            uploading: false,
            uploadProgress: 0,
            uploadMessage: '',
            uploadStatus: 'info',
            fileInputKey: 0,
            uploadedFiles: [],
            showImageViewer: false,
            viewingImageUrl: '',
            viewingImageName: '',
            isDraggingOver: false,
            receiptProcessedSuccessfully: false,
        };
    },
    methods: {
        onFileInputChange(eventObject) {
            if (this.receiptProcessedSuccessfully) return;
            console.log('[DEBUG] onFileInputChange - Raw argument from v-file-input @change:', eventObject);

            let fileToProcess = null;
            if (eventObject && eventObject.target && eventObject.target.files && eventObject.target.files.length > 0) {
                fileToProcess = eventObject.target.files[0];
                console.log('[DEBUG] onFileInputChange - Extracted file from event.target.files[0]:', fileToProcess);
            } else if (eventObject instanceof File) {
                fileToProcess = eventObject;
                console.log('[DEBUG] onFileInputChange - Argument was already a File object:', fileToProcess);
            } else {
                console.log('[DEBUG] onFileInputChange - Could not extract a valid File object from the event.');
            }

            this.processFile(fileToProcess);
        },

        processFile(file) {
            if (this.receiptProcessedSuccessfully) return;

            console.log('[DEBUG] processFile - Received file for processing:', file);
            this.uploadMessage = '';
            this.uploadStatus = 'info';
            this.uploadProgress = 0;
            this.isPreviewReady = !file;

            if (!file || !(file instanceof File)) {
                this.actualFileObject = null;
                this.filePreviewUrl = null;
                this.isImage = false;
                console.log('[DEBUG] processFile - No valid file to process or file cleared.');
                return;
            }

            this.actualFileObject = file;
            if (this.selectedFileValue !== file) {
                this.selectedFileValue = file;
            }
            this.isImage = this.actualFileObject.type.startsWith('image/');
            console.log('[DEBUG] processFile - this.actualFileObject set:', this.actualFileObject);
            console.log('[DEBUG] processFile - this.isImage:', this.isImage);

            if (this.isImage) {
                this.isPreviewReady = false;
                console.log('[DEBUG] processFile - Image detected, isPreviewReady set to false.');
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.filePreviewUrl = e.target.result;
                    this.isPreviewReady = true;
                    console.log('[DEBUG] processFile - FileReader onload. this.filePreviewUrl (first 50 chars):', this.filePreviewUrl ? this.filePreviewUrl.substring(0, 50) + '...' : null, 'isPreviewReady:', this.isPreviewReady);
                };
                reader.onerror = (error) => {
                    console.error('[DEBUG] processFile - FileReader error:', error);
                    this.uploadMessage = "Error reading file for preview.";
                    this.uploadStatus = "error";
                    this.isPreviewReady = true;
                }
                reader.readAsDataURL(this.actualFileObject);
            } else {
                this.filePreviewUrl = null;
                this.isPreviewReady = true;
                console.log('[DEBUG] processFile - Non-image file. isPreviewReady:', this.isPreviewReady);
            }
        },

        onDragEnter() {
            if (this.receiptProcessedSuccessfully || this.uploading) return;
            console.log('[DEBUG] onDragEnter');
            this.isDraggingOver = true;
        },
        onDragOver() {
            if (this.receiptProcessedSuccessfully || this.uploading) return;
        },
        onDragLeave(event) {
            if (this.receiptProcessedSuccessfully || this.uploading) {
                this.isDraggingOver = false;
                return;
            }
            console.log('[DEBUG] onDragLeave');
            if (event.currentTarget && event.currentTarget.contains(event.relatedTarget)) {
                return;
            }
            this.isDraggingOver = false;
        },
        onDrop(event) {
            if (this.receiptProcessedSuccessfully || this.uploading) return;
            console.log('[DEBUG] onDrop');
            this.isDraggingOver = false;
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                console.log('[DEBUG] onDrop - Files dropped:', files);
                this.processFile(files[0]);
            } else {
                console.log('[DEBUG] onDrop - No files found in dataTransfer.');
            }
        },

        async uploadFile() {
            // --- Guard against multiple rapid invocations ---
            if (this.uploading) {
                console.warn('[DEBUG] uploadFile - Already uploading. Call ignored.');
                return;
            }
            // -------------------------------------------------

            console.log('[DEBUG] uploadFile - CALLED.');
            console.log('[DEBUG] uploadFile - Current this.actualFileObject:', this.actualFileObject ? { name: this.actualFileObject.name, size: this.actualFileObject.size, type: this.actualFileObject.type } : null);
            console.log('[DEBUG] uploadFile - Current this.isImage:', this.isImage);
            console.log('[DEBUG] uploadFile - Current this.isPreviewReady:', this.isPreviewReady);
            console.log('[DEBUG] uploadFile - Current this.filePreviewUrl (first 50 chars):', this.filePreviewUrl ? this.filePreviewUrl.substring(0, 50) + '...' : null);

            if (!this.actualFileObject || this.receiptProcessedSuccessfully) {
                this.uploadMessage = this.receiptProcessedSuccessfully ? 'Receipt already processed. Click "Analyze Another" to upload a new one.' : 'Please select a file first.';
                this.uploadStatus = 'warning';
                console.warn('[DEBUG] uploadFile - No file or receipt already processed. Returning.');
                return;
            }

            if (this.isImage && !this.isPreviewReady) {
                this.uploadMessage = 'Image preview is still processing. Please wait.';
                this.uploadStatus = 'warning';
                console.warn('[DEBUG] uploadFile - Image preview not ready. Returning.');
                return;
            }

            this.uploading = true; // Set uploading flag
            this.uploadProgress = 0;
            this.uploadMessage = '';

            const fileName = this.actualFileObject.name;
            const fileSize = this.actualFileObject.size;
            const fileType = this.actualFileObject.type;

            const fileToUpload = {
                name: fileName,
                size: fileSize,
                type: fileType,
                isImage: this.isImage,
                url: this.isImage ? this.filePreviewUrl : null
            };

            console.log('[DEBUG] uploadFile - fileToUpload object constructed:', JSON.stringify(fileToUpload));

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
                await new Promise(resolve => setTimeout(resolve, 1500));
                clearInterval(progressInterval);
                this.uploadProgress = 100;

                this.uploadMessage = `File "${fileToUpload.name}" processed. See details below.`; // Adjusted message
                this.uploadStatus = 'success';

                console.log('[DEBUG] uploadFile - Simulated success. Pushing to uploadedFiles:', JSON.stringify(fileToUpload));

                if (fileToUpload.isImage && !fileToUpload.url) {
                    console.error("[CRITICAL DEBUG] uploadFile - Image URL is null for an image file being pushed.", fileToUpload);
                }
                this.uploadedFiles = [fileToUpload]; // Replace, don't push, to ensure only one is shown

                this.receiptProcessedSuccessfully = true;
                console.log('[DEBUG] uploadFile - receiptProcessedSuccessfully set to true.');

                this.$emit('file-uploaded', { fileName: fileToUpload.name, fileSize: fileToUpload.size });

                // Clear selection state but keep uploading true until resetForNewReceipt or if an error occurs
                // This is because the "Analyze Another Receipt" button should appear, and progress bar might still be visible.
                this.actualFileObject = null;
                this.selectedFileValue = null;
                this.filePreviewUrl = null;
                this.isImage = false;
                this.isPreviewReady = true;
                // this.uploading = false; // Set to false by resetForNewReceipt or in catch block
                this.fileInputKey++;


            } catch (error) {
                clearInterval(progressInterval);
                this.uploadProgress = 0;
                console.error('[DEBUG] uploadFile - Error during simulated upload:', error);
                this.uploadMessage = `An error occurred during upload: ${error.message || 'Unknown error'}`;
                this.uploadStatus = 'error';
                this.uploading = false; // Ensure uploading is false on error
            }
            // Note: `this.uploading` will be set to false by `resetForNewReceipt` when the user chooses to analyze another,
            // or in the catch block if an error occurs.
        },

        resetForNewReceipt() {
            console.log('[DEBUG] resetForNewReceipt - CALLED.');
            this.selectedFileValue = null;
            this.actualFileObject = null;
            this.filePreviewUrl = null;
            this.isImage = false;
            this.isPreviewReady = true;
            this.uploading = false; // Explicitly set uploading to false
            this.uploadProgress = 0;
            this.uploadMessage = '';
            this.uploadStatus = 'info';
            this.uploadedFiles = [];
            this.receiptProcessedSuccessfully = false;
            this.fileInputKey++;
            console.log('[DEBUG] resetForNewReceipt - State fully reset.');
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
            console.log('[DEBUG] viewImage - CALLED with file:', JSON.stringify(file));
            if (file.isImage && file.url) {
                this.viewingImageUrl = file.url;
                this.viewingImageName = file.name;
                this.showImageViewer = true;
            } else {
                console.warn("[DEBUG] viewImage - Attempted to view non-image or image with no URL:", JSON.stringify(file));
                this.uploadMessage = `Cannot display preview for "${file.name}". URL is missing or it's not an image.`;
                this.uploadStatus = "warning";
            }
        },

        closeImageViewer() {
            console.log('[DEBUG] closeImageViewer - CALLED.');
            this.showImageViewer = false;
            this.viewingImageUrl = '';
            this.viewingImageName = '';
        }
    },
    watch: {
        selectedFileValue(newValue, oldValue) {
            console.log('[DEBUG] watch selectedFileValue - New:', newValue ? newValue.name : null, 'Old:', oldValue ? oldValue.name : null);
        }
    }
};
</script>

<style scoped>
.v-card {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    position: relative;
}

.v-progress-linear {
    border-radius: 8px;
}

.border {
    border: 1px solid #e0e0e0;
}

.clickable {
    cursor: pointer;
}

.clickable:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.drag-over-active {
    border: 2px dashed var(--v-primary-base, #1976D2);
    background-color: rgba(25, 118, 210, 0.05);
}

.drop-indicator,
.processed-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: 12px;
    text-align: center;
    padding: 16px;
}

.disabled-drop-zone {
    /* background-color: #f5f5f5; */
    /* opacity: 0.7; */
}
</style>