import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;

export function authenticateToken(res, req, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token missing '});
    }

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        req.user = decoded;
        next();
    });
}
