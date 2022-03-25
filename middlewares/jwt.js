import jwt from 'express-jwt'
const secret = process.env.JWT_SECRET;

const authenticate = jwt({
	secret: secret
});

export default {
	authenticate
}