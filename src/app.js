import Fastify from "fastify";
import { syncAll, sync } from "./handlers/sync-glossary";
import * as cron from "node-cron";

const fastify = Fastify({
    logger: true,
    ignoreDuplicateSlashes: true,
    requestTimeout: 60,
});

fastify.get("/", async (_request, reply) => {
    reply.code(200).send("Hello, I'm Tolgee Auto");
});

fastify.put("/sync-glossary", async (request, reply) => {
    syncAll();

    reply.code(200).send({ sync: true });
});

fastify.put("/sync-project", async (request, reply) => {
    const { projectId } = request.query;
    sync(projectId);

    reply.code(200).send({ sync: true });
});

const registerHourlyJob = () => {
    cron.schedule("0 0 8,13,17 * * *", syncAll);
};

const start = async () => {
    try {
        await fastify.listen({ port: 5000, host: "0.0.0.0" });

        console.log(`Tolgee Auto started at ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`);
        registerHourlyJob();
    } catch (err) {
        fastify.log.error(err);
        console.log(err);
        process.exit(1);
    }
};

start();
