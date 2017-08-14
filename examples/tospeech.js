'use strict';
// dotenv is a convenient way to load env variables from a local .env file
require('dotenv').config();
const stream = require('stream');
const path = require('path');
const fs = require('fs');
const Speaker = require('speaker');
const translationService = require('../ms-translator-speech-service');

// create new Speaker instance with the correct audio settings
// see docs for how to install: npmjs.com/package/speaker
const speaker = new Speaker({
  channels: 1,    
  bitDepth: 16,    
  sampleRate: 16000 
});

// set up and connect to Translator API
const options = {
  subscriptionKey: process.env.TRANSLATION_KEY,
  toLanguage: 'en',
  fromLanguage: 'en',
  features: {
    textToSpeech: true
  },
  voice: 'en-AU-Catherine',
  format: 'audio/wav'
};

// create new translator service instance
const translator = new translationService(options);

// start service
translator.start((error, service) => {
  if (error) return console.error(error);

  // listen for incoming translation results
  service.on('message', (message) => {
    const translation = message;

    // play / save translation if it's audio
    if (translation.type === 'binary') {
      playTranslation(translation.binaryData);
      saveTranslation(translation.binaryData);
    } else {
      console.log(JSON.parse(translation.utf8Data));
    }
  });

  // send audio file content to translator service
  service.sendFile('test/sample/sample01.wav', (error) => {
    if (error) console.log(error);
  });
});

// pipes the returned translation audio into the Speaker instance so it plays the sound on your computer!
const playTranslation = (binary) => {
  const rs = new stream.Readable();
  rs.push(binary);
  rs.push(null);
  rs.pipe(speaker);
};

// saves the returned translation audio into a file on disk
const saveTranslation = (binary) => {
  const rs = new stream.Readable();
  rs.push(binary);
  rs.push(null);
  const file = fs.createWriteStream(path.join(__dirname, 'translation.wav'));
  rs.pipe(file);
};

