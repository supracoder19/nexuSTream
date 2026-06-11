const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
require("dotenv").config()
const redis = new Redis(process.env.REDIS_URL);

const verifySocketToken = async (socket, next) => {
    try {
        const cookieHeader = socket.handshake.headers.cookie;
        let token = ""
        let rToken = ""

        if (cookieHeader) {
            // 1. Find where "Authorization=Bearer " starts
            const prefix = "Authorization=Bearer";
            const rprefix = "refreshToken";
            const startIndex = cookieHeader.indexOf(prefix);
            const rstartIndex = cookieHeader.indexOf(prefix);

            if (startIndex !== -1 && rstartIndex !== -1) {
                // 2. Cut everything before the token
                const tokenStart = startIndex + prefix.length;
                const rtokenStart = rstartIndex + rprefix.length;
                token = cookieHeader.substring(tokenStart);
                rToken = cookieHeader.substring(rtokenStart);

                // 3. If there are trailing cookies, cut them off at the first semicolon
                let endIndex = token.indexOf(";");
                if (endIndex !== -1) {
                    token = token.substring(0, endIndex);
                }
                endIndex = rToken.indexOf(";");
                if (endIndex !== -1) {
                    rToken = rtoken.substring(0, endIndex);
                }

                // console.log("Extracted Token:", token.trim());
            } else {
                console.log("Authorization cookie not found.");
            }
        } else {
            console.log("No cookies found in the handshake headers.");
        }
        // 1. Convert the base64 secret into a raw Buffer
        const secretBuffer = Buffer.from(process.env.JWT_SECRET, 'base64');

        // 1. Verify JWT Signature
        const decoded = jwt.verify(token, secretBuffer);
        

        // 2. Check Shared Redis (The "Source of Truth")
        // We assume Spring Boot saves sessions as "session:{userId}"
        const sessionExists = await redis.get(`${decoded.sub}`);
        if (!sessionExists===rToken) {
            return next(new Error('Session expired or logged out'));
        }


        // Attach user info to socket for handlers to use
        socket.user = decoded;
        next();
    } catch (err) {
        console.error('Socket Auth Error:', err.message);
        next(new Error('Authentication error: Invalid token'));
    }
};

module.exports = verifySocketToken;