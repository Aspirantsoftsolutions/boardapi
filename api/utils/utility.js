/**
 * Create Random number
 * @param {*} length 
 */
const randomNumber = function (length) {
	var text = "";
	var possible = "123456789";
	for (var i = 0; i < length; i++) {
		var sup = Math.floor(Math.random() * possible.length);
		text += i > 0 && sup == i ? "0" : possible.charAt(sup);
	}
	return Number(text);
};

/**
 * Create Random String
 * @param {*} length 
 */
const getRandomString = async function (length) {
	var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	var result = '';
	for (var i = 0; i < length; i++) {
		result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
	}
	return result;
}

/**
 * Get current date and time 
 * @param {*} timestamp 
 */
const getDateTimeString = (timestamp) => {
	console.log(timestamp);
	const date = new Date(timestamp);
	console.log(date.toDateString() + " " + date.getTime())
	return date.toISOString().slice(0, 10) + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
}

export default {
	randomNumber,
	getRandomString,
	getDateTimeString
}