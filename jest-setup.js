if (process.env.TEST_ENV === 'unit') {
	window.fetch = global.fetch = require('jest-fetch-mock')
}

window.crypto = global.crypto = require('@trust/webcrypto')
require('dotenv').config('.env')
