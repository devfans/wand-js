'use strict'

const asset = require('./asset')
const audio = require('./audio')
const image = require('./image')
const input = require('./input')

module.exports = {
  ...asset,
  ...audio,
  ...image,
  ...input
}
