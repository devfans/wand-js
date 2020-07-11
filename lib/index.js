'use strict'

const asset = require('./asset')
const audio = require('./audio')
const image = require('./image')
const input = require('./input')
const popout = require('./popout')
const progress = require('./progress')

module.exports = {
  ...asset,
  ...audio,
  ...image,
  ...input,
  ...popout,
  ...progress
}
