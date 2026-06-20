import cookie from "cookie"
import jwt from 'jsonwebtoken';
export const verifySocketToken = async (socket, next) => {
    try {
        const cookieHeader = cookie.parse(
            socket.handshake.headers.cookie || ""
        );
        let token = cookieHeader.accessToken

        if (token) {
            // 1. Convert the base64 secret into a raw Buffer
            const secretBuffer = Buffer.from(process.env.JWT_SECRET, 'base64');

            // 1. Verify JWT Signature
            const decoded = jwt.verify(token, secretBuffer);
            socket.user = decoded;
            next();
        }
        else {
            throw new Error("Authorization cookie not found.")
        }

    } catch (err) {
        console.error('Socket Auth Error:', err.message);
        next(new Error('Authentication error: Invalid token'));
    }
};

