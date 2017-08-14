'use strict';
// dotenv is a convenient way to load env variables from a local .env file
require('dotenv').config();
const path = require('path');
const translationService = require('../ms-translator-speech-service');

// set up and connect to Translator API
const options = {
  subscriptionKey: process.env.TRANSLATION_KEY,
  toLanguage: 'fr',
  fromLanguage: 'en'
};

// create new translator service instance
const translator = new translationService(options);

// audio file to translate
const audioFile = path.join(__dirname, '..', 'test', 'sample', 'sample01.wav');

// start service
translator.start((error, service) => {
  if (error) return console.error(error);

  // listen for incoming translation results
  service.on('message', (message) => {
    const translation = JSON.parse(message.utf8Data);
    console.log(translation);
    translator.stop(_ => console.log('translator stopped.'));
  });

  // send audio file content to translator service
  service.sendFile(audioFile, (error) => {
    if (error) console.log(error);
  });
});
