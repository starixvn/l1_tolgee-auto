import { ProjectLanguageCode, SyncProjects } from "../config";
import * as fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { getGlossary, postImportFiles, deleteImportFiles } from "./tolgee-request";
import * as ChatBot from "./chat-bot";

const tempFolder = "./temp";
const exportFolder = path.join(tempFolder, "data");
const exportFilePath = path.join(tempFolder, "data.zip");
const importFilePath = path.join(tempFolder, "importData.zip");

const downloadGlossaryFile = async () => {
    const zipFile = await getGlossary();

    !fs.existsSync(tempFolder) && fs.mkdirSync(tempFolder);
    fs.writeFileSync(exportFilePath, zipFile);
    const zip = new AdmZip(exportFilePath);
    zip.extractAllTo(exportFolder, true);
};

const getAllFiles = (folderPath) => {
    const files = [];

    function traverseFolder(currentPath) {
        const items = fs.readdirSync(currentPath);

        items.forEach((item) => {
            const itemPath = path.join(currentPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isFile()) {
                files.push(itemPath);
            } else if (stats.isDirectory()) {
                traverseFolder(itemPath);
            }
        });
    }

    traverseFolder(folderPath);

    return files;
};

const createImportFile = (projectId) => {
    const files = getAllFiles(exportFolder);

    files.forEach((file) => {
        if(ProjectLanguageCode[projectId][language])
        {
            const filePath = path.dirname(file);
            const language = path.basename(file).split(".")[0];
            const newFilePath = path.join(filePath, `${ProjectLanguageCode[projectId][language]}.json`);

            fs.renameSync(file, newFilePath);
        }
    });

    const zip = new AdmZip();
    zip.addLocalFolder(exportFolder);
    zip.writeZip(importFilePath);
};

const importTolgee = async (projectId) => {
    const fileStream = fs.createReadStream(importFilePath);

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

export const sync = async (projectId) => {
    try {
        clearTemp(tempFolder);
        await downloadGlossaryFile();
        createImportFile(projectId);
        const importResult = await importTolgee(projectId);

        importResult && ChatBot.postSyncSuccess(projectId);

        return importResult;
    } catch (err) {
        ChatBot.postSyncFailed(projectId, `Internal server error: ${err.message}`);
        console.log(err);
        deleteImportFiles(projectId);

        return false;
    }
};

export const syncAll = async () => {
    const projects = Object.values(SyncProjects);

    for (const projectId of projects) {
        await sync(projectId);
    }
};
