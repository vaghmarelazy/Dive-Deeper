import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URL,
})

redisClient.on("error", (err) => {
    console.error("Redis client error: ", err);
});
await redisClient.connect().then(() => {
    console.log("redis connection established")
});

export default redisClient;