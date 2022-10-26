import jwt from 'express-jwt'
import { ErrorResponseWithData } from '../api/utils/apiResponse.js';
const secret = process.env.JWT_SECRET;

const jwtCheck = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, secret, (err, user) => {
            if (err) {
                return ErrorResponseWithData(res, 'Unauthorized, Please login.', {}, 401);
            }
            req.user = user;
            next();
        });
    } else {
        return ErrorResponseWithData(res, 'UnAuthorized, Please login.', {}, 401);
    }
};

export default {
    jwtCheck
}