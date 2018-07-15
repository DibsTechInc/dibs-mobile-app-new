/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const beautify = require('json-beautify');
const path = require('path');
const { compose } = require('redux');

const APP_ROOT = path.resolve(__dirname, '..');

const toString = buff => buff.toString();
const toBuffer = str => new Buffer(str);

/**
 * @param {string} jsonPath path to the json to beautify
 * @returns {undefined}
 */
function beautifyJson(jsonPath) {
  return compose(
    fs.writeFileSync.bind(fs, APP_ROOT + jsonPath),
    toBuffer,
    json => beautify(json, null, 2, 80),
    JSON.parse,
    toString,
    fs.readFileSync
  )(APP_ROOT + jsonPath);
}

(function beautifyJsons() {
  return ['/config.json', '/app.json'].forEach(beautifyJson);
}());
