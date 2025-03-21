const timeout = require('connect-timeout');

const timeoutMiddleware = (timeoutDuration = '30s') => {
    return [
        timeout(timeoutDuration),
        (req, res, next) => {
            if (!req.timedout) next();
        }
    ];
};

module.exports = timeoutMiddleware; 