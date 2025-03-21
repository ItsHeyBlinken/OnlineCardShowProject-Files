// Simple in-memory cache implementation
const cache = new Map();

const memoryCache = {
    async get(key) {
        const item = cache.get(key);
        if (!item) return null;
        
        // Check if item has expired
        if (item.expiry && item.expiry < Date.now()) {
            cache.delete(key);
            return null;
        }
        
        return item.value;
    },

    async set(key, value, expirySeconds = 3600) {
        cache.set(key, {
            value,
            expiry: Date.now() + (expirySeconds * 1000)
        });
    },

    async del(key) {
        cache.delete(key);
    }
};

module.exports = memoryCache; 