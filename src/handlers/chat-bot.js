import axios from "axios";
import { SyncProjects } from "../config";

const ChatBotConfig = {
    url: "https://bot.nexdev.net/skynex/api/messages/",
    token: "0A40aOc7CtpzjbBSJu8KNWQRoXyjRvf9",
    requestTimeout: 5000,
    conversationId: -1001882086504,
};

const post = async (message) => {
    try {
        const { url, token, conversationId, requestTimeout } = ChatBotConfig;

        await axios.post(
            `${url}forwardwithtoken?token=${token}&conversationId=${conversationId}&message=${message}`,
            {},
            {
                timeout: requestTimeout,
            }
        );
    } catch (ex) {
        console.log(JSON.stringify(ex));
    }
};

const getProjectName = (projectId) => Object.entries(SyncProjects).find(([key, val]) => val === projectId)?.[0];

const postSyncFailed = async (projectId, message) => {
    post(`${encodeURIComponent("⛔")} FAILED ${encodeURIComponent("⛔")} Sync Glossary project ${getProjectName(projectId)} - ${message}`);
};

const postSyncSuccess = async (projectId) => {
    post(`${encodeURIComponent("✅")} SUCCESS ${encodeURIComponent("✅")} Sync Glossary project ${getProjectName(projectId)} !`);
};

export { post, postSyncFailed, postSyncSuccess };
