'use strict';
const fs = require('fs');
const path = require('path');
const streamBuffers = require('stream-buffers');

module.exports = function(filepath, callback) {
  let absoluteFilepath;

  fs.access(filepath, (error) => {
    if (error) {
      return callback ? callback(new Error(`could not find file ${filepath}`)) : null;
    }

    absoluteFilepath = path.resolve(filepath);

    const options = {
      frequency: 100, 
      chunkSize: 32000 
    };

    const audioStream = new streamBuffers.ReadableStreamBuffer(options);

    fs.readFile(absoluteFilepath, (error, file) => {
      audioStream.put(file);

      // add some silences at the end to tell the service that it is the end of the sentence
      audioStream.put(new Buffer(160000));
      audioStream.stop();

      audioStream.on('data', (data) => this.sendBytes(data));
      audioStream.on('end', () => {if (callback) return callback()});
    });
  });
};

