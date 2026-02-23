import NodeCache from "node-cache";

const messageCache = new NodeCache({
  stdTTL: 600, // 10 minutes
});

export default messageCache;