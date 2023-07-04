import axios from "axios";

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

const postSyncFailed = async (projectId, message) => {
    post(`Sync Glossary project ${projectId} FAILED - ${message}`);
};

const postSyncSuccess = async (projectId) => {
    post(`Sync Glossary project ${projectId} SUCCESS !`);
};

export { post, postSyncFailed, postSyncSuccess };
