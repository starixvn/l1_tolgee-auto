import axios from "axios";
import { BaseProjectId, Tolgee } from "../config";
import FormData from "form-data";
import * as ChatBot from "./chat-bot";

const tolgeeHeader = {
    "x-api-key": "tgpat_4drnmmhfr37a55l6t22iqb106s6g05t2o7qjmi5qfbabaadg3pr",
};

const getGlossary = async () => {
    const response = await axios.get(`${Tolgee.url}v2/projects/${BaseProjectId}/export`, {
        headers: tolgeeHeader,
        responseType: "arraybuffer",
        params: {
            filterTag: "Glossary",
        },
    });

    return response.data;
};

const postImportFiles = async (projectId, fileStream) => {
    const formData = new FormData();
    formData.append("files", fileStream);

    const importResponse = await axios.post(`${Tolgee.url}v2/projects/${projectId}/import`, formData, {
        headers: { ...tolgeeHeader, "Content-Type": "multipart/form-data" },
    });

    if (importResponse.data.errors.length) {
        ChatBot.postSyncFailed(projectId, importResponse.data.errors);

        return false;
    }

    const applyResponse = await axios.put(
        `${Tolgee.url}v2/projects/${projectId}/import/apply`,
        {},
        {
            headers: tolgeeHeader,
            params: { forceMode: "OVERRIDE" },
        }
    );

    return applyResponse.status === 200;
};

const deleteImportFiles = async (projectId) => {
    await axios.delete(`${Tolgee.url}v2/projects/${projectId}/import`, {
        headers: tolgeeHeader,
    });
};

export { getGlossary, postImportFiles, deleteImportFiles };
