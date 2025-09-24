import AdmZip from "adm-zip";
import * as fs from "fs";
import path from "path";
import { ProjectLanguageCode, SyncProjects } from "../config";
import * as ChatBot from "./chat-bot";
import { deleteImportFiles, getGlossary, postImportFiles } from "./tolgee-request";

const tempFolder = "./temp";
const exportFolder = path.join(tempFolder, "data");
const exportFilePath = path.join(tempFolder, "data.zip");
const BATCH_SIZE = 5;

const getImportFilePath = (batchNumber) => {
    return path.join(tempFolder, `importData_${batchNumber}.zip`);
};

const downloadGlossaryFile = async () => {
    const zipFile = await getGlossary();

    !fs.existsSync(tempFolder) && fs.mkdirSync(tempFolder);
    fs.writeFileSync(exportFilePath, zipFile);
    const zip = new AdmZip(exportFilePath);
    zip.extractAllTo(exportFolder, true);
};

const getExportItems = (folderPath) => {
    const items = fs.readdirSync(folderPath);
    const result = {
        files: [],
        folders: [],
    };

    items.forEach((item) => {
        const itemPath = path.join(folderPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
            result.folders.push(itemPath);
        } else if (stats.isFile() && item.endsWith(".json")) {
            result.files.push(itemPath);
        }
    });

    return result;
};

const splitIntoBatches = (folders, batchSize = BATCH_SIZE) => {
    const batches = [];
    for (let i = 0; i < folders.length; i += batchSize) {
        batches.push(folders.slice(i, i + batchSize));
    }
    return batches;
};

const createImportFileForBatch = (projectId, items, batchNumber, isFilesBatch = false) => {
    // Create a temporary directory for this batch
    const batchFolder = path.join(tempFolder, `batch_${batchNumber}`);
    !fs.existsSync(batchFolder) && fs.mkdirSync(batchFolder);

    if (isFilesBatch) {
        // Handle individual files
        items.forEach((filePath) => {
            const fileName = path.basename(filePath);
            const language = fileName.split(".")[0];

            if (ProjectLanguageCode[projectId][language]) {
                const newFileName = `${ProjectLanguageCode[projectId][language]}.json`;
                const targetPath = path.join(batchFolder, newFileName);
                fs.copyFileSync(filePath, targetPath);
            }
        });
    } else {
        // Handle folders
        items.forEach((folderPath) => {
            const folderName = path.basename(folderPath);
            const targetFolder = path.join(batchFolder, folderName);

            // Create target folder
            !fs.existsSync(targetFolder) && fs.mkdirSync(targetFolder);

            // Copy and rename files from source folder
            const files = fs.readdirSync(folderPath);
            files.forEach((file) => {
                const sourcePath = path.join(folderPath, file);
                const language = path.basename(file).split(".")[0];

                if (ProjectLanguageCode[projectId][language]) {
                    const newFileName = `${ProjectLanguageCode[projectId][language]}.json`;
                    const targetPath = path.join(targetFolder, newFileName);
                    fs.copyFileSync(sourcePath, targetPath);
                }
            });
        });
    }

    // Create zip for this batch with batch number in filename
    const zip = new AdmZip();
    zip.addLocalFolder(batchFolder);
    zip.writeZip(getImportFilePath(batchNumber));

    // Clean up batch folder
    clearTemp(batchFolder);
};

const importTolgee = async (projectId, batchNumber) => {
    const importPath = getImportFilePath(batchNumber);
    const fileStream = fs.createReadStream(importPath);
    return await postImportFiles(projectId, fileStream);
};

const clearTemp = (folderPath) => {
    function deleteFolderRecursive(folderPath) {
        if (fs.existsSync(folderPath)) {
            fs.readdirSync(folderPath).forEach((file) => {
                const curPath = path.join(folderPath, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    deleteFolderRecursive(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });

            fs.rmdirSync(folderPath);
        }
    }

    deleteFolderRecursive(folderPath);
};

const cleanupImportFiles = () => {
    // Clean up all import files in temp folder
    if (fs.existsSync(tempFolder)) {
        const files = fs.readdirSync(tempFolder);
        files.forEach((file) => {
            if (file.startsWith("importData_") && file.endsWith(".zip")) {
                fs.unlinkSync(path.join(tempFolder, file));
            }
        });
    }
};

export const sync = async (projectId) => {
    try {
        clearTemp(tempFolder);

        // Download and extract the glossary
        await downloadGlossaryFile();

        // Get all items from export folder
        const { files, folders } = getExportItems(exportFolder);
        const batches = splitIntoBatches(folders);

        let successCount = 0;
        let currentBatch = 1;
        const totalBatches = files.length > 0 ? batches.length + 1 : batches.length;

        // Process individual files as first batch if any exist
        if (files.length > 0) {
            try {
                createImportFileForBatch(projectId, files, currentBatch, true);
                const importResult = await importTolgee(projectId, currentBatch);

                if (importResult) {
                    successCount++;
                }
            } catch (err) {
                console.log(`Batch ${currentBatch} error:`, err);
            }
            currentBatch++;
        }

        // Process folder batches
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const batchNumber = currentBatch + i;

            try {
                createImportFileForBatch(projectId, batch, batchNumber);
                const importResult = await importTolgee(projectId, batchNumber);

                if (importResult) {
                    successCount++;
                }
            } catch (err) {
                ChatBot.postSyncFailed(projectId, `Failed to process batch ${batchNumber}/${totalBatches}: ${err.message}`);
                console.log(`Batch ${batchNumber} error:`, err);
                // Continue with next batch even if this one failed
            }
        }

        // Final status report
        if (successCount === totalBatches) {
            ChatBot.postSyncSuccess(projectId);
        } else {
            ChatBot.postSyncFailed(projectId, `Completed with ${successCount}/${totalBatches} batches successful`);
        }

        return successCount > 0;
    } catch (err) {
        ChatBot.postSyncFailed(projectId, `Internal server error: ${err.message}`);
        console.log(err);
        deleteImportFiles(projectId);

        return false;
    } finally {
        // Clean up all import files and temp folder at the end
        cleanupImportFiles();
        clearTemp(tempFolder);
    }
};

export const syncAll = async () => {
    const projects = Object.values(SyncProjects);

    for (const projectId of projects) {
        await sync(projectId);
    }
};
