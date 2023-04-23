const cacheFunction = (functionCall, cacheDuration) => {
    let cachedResult;
    let lastUpdated;

    return async () => {
        const now = Date.now();
        if (!cachedResult || now - lastUpdated > cacheDuration) {
            cachedResult = await functionCall;
            lastUpdated = now;
        }

        return cachedResult;
    }
}

module.exports = { cacheFunction }