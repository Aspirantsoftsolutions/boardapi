import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const AdminSchema = mongoose.Schema({
	fullName: String,
	email: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	role: {
		type: String,
		required: true
	}
});

AdminSchema.pre('save', async (next) => {
	const user = this;
	if (user.isModified('password')) {
		user.password = await bcrypt.hash(user.password, 8)
	}
	next()
})

AdminSchema.methods.generateAuthToken = async () => {
	const user = this
	const token = jwt.sign({
		_id: user._id
	}, process.env.JWT_SECRET)
	return token;
}

AdminSchema.statics.findByCredentials = async (email, password) => {
	const user = await Admin.findOne({
		email
	})
	if (!user) {
		throw ({
			message: "User account doesn't exist for given email",
			code: 'email'
		})
	}
	const isPasswordMatch = await bcrypt.compare(password, user.password)
	if (!isPasswordMatch) {
		throw ({
			message: 'Wrong Password',
			code: 'password'
		})
	}
	return user
}
export default mongoose.model('Admin', AdminSchema);