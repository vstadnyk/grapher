/* eslint-disable */

require('babel-core/register')
require('babel-polyfill')

new (require('./server').default)().start()