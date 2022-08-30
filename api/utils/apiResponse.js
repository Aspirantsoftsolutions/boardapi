/**
 * @function successResponse
 * @description Function that returns response with success message
 * @param {Object} res - Express Framework Response Object
 * @param {String} msg - Message
 */
function successResponse(res, msg) {
	let data = {
		status: 1,
		responseCode: 200,
		message: msg
	};
	return res.status(200).json(data);
}

/**
 * @function successResponseWithData
 * @description Function that returns response with success message with data
 * @param {Object} res - Express Framework Response Object
 * @param {Object} data - Data Object
 * @param {String} msg - Message
 */
function successResponseWithData(res, msg, data) {
	let resData = {
		status: 1,
		responseCode: 200,
		message: msg,
		data: data
	};
	return res.status(200).json(resData);
};

/**
 * @function internalServiceError
 * @description Function that returns response with internal server error message
 * @param {*} res 
 * @param {*} msg 
 * @returns 
 */
function internalServerError(res, msg) {
	let data = {
		status: 0,
		responseCode: 500,
		message: msg
	};
	return res.status(500).json(data);
}

/**
 * @function ErrorResponse
 * @description Function that returns response with Error message
 * @param {Object} res - Express Framework Response Object
 * @param {String} msg - Message
 */
function ErrorResponse(res, msg) {
	var data = {
		status: 0,
		responseCode: 400,
		message: msg,
	};
	return res.status(400).json(data);
};

/**
 * @function ErrorResponseWithData
 * @description Function that returns response with error message with data
 * @param {Object} res - Express Framework Response Object
 * @param {Object} data - Data Object
 * @param {String} msg - Message
 */
function ErrorResponseWithData(res, msg, data, responseCode = 400) {
	var data = {
		status: 0,
		responseCode,
		message: msg,
		data: data
	};
	return res.status(400).json(data);
};

/**
 * @function notFoundResponse
 * @description Function that returns response with url not found 
 * @param {Object} res - Express Framework Response Object
 * @param {String} msg - Message
 */
function notFoundResponse(res, msg) {
	var data = {
		status: 0,
		responseCode: 404,
		message: msg,
	};
	return res.status(404).json(data);
};

/**
 * @function validationErrorWithData
 * @description Function that returns response with validation error message
 * @param {Object} res - Express Framework Response Object
 * @param {Object} data - Data Object
 * @param {String} msg - Message
 */
function validationErrorWithData(res, msg, data) {
	var resData = {
		status: 0,
		responseCode: 400,
		message: msg,
		data: data
	};
	return res.status(400).json(resData);
};

/**
 * @function validationError
 * @description Function that returns response with validation error 
 * @param {Object} res - Express Framework Response Object
 * @param {String} msg - Message
 */
function validationError(res, msg) {
	var resData = {
		status: 0,
		responseCode: 400,
		message: msg,
	};
	return res.status(400).json(resData);
};

/**
 * @function unauthorizedResponse
 * @description Function that returns response by checking autorization 
 * @param {Object} res - Express Framework Response Object
 * @param {String} msg - Message
 */
function unauthorizedResponse(res, msg) {
	var data = {
		status: 0,
		responseCode: 401,
		message: msg,
	};
	return res.status(401).json(data);
};

/**
 * @function unprocessable
 * @description Function that returns response with unprocess message
 * @param {Object} res - Express Framework Response Object
 * @param {String} msg - Message
 */
function unprocessable(res, msg) {
	var data = {
		status: 0,
		responseCode: 422,
		message: msg,
	};
	return res.status(422).json(data);
};

export {
	successResponse,
	successResponseWithData,
	ErrorResponse,
	ErrorResponseWithData,
	notFoundResponse,
	validationErrorWithData,
	validationError,
	unauthorizedResponse,
	unprocessable
}