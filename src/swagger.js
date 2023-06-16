const swaggerAutogen = require('swagger-autogen')()

const outputFile = 'src/swagger_output.json'
const endpointsFiles = ['src/server.js']

swaggerAutogen(outputFile, endpointsFiles)
