'use strict';
const test = require('tape');
const translationService = require('../ms-translator-speech-service');

test('[ms-translator-speech-service] defaults are set correctly', function (t) {
  t.plan(9);

  const translator = new translationService();

  t.equal(translator.toLanguage, 'en', 'toLanguage');
  t.equal(translator.fromLanguage, 'en', 'fromLanguage');
  t.equal(typeof translator.features, 'object', 'features is an object');
  t.equal(Object.keys(translator.features).length, 0, 'features is empty');
  t.equal(translator.profanityAction, 'Marked', 'profanityAction');
  t.equal(translator.profanityMarker, 'Asterisk', 'profanityMarker');
  t.equal(typeof translator.clientTraceId, 'string', 'clientTraceId is a string');
  t.equal(translator.format, '', 'format');
  t.equal(translator.voice, '', 'voice');
});

test('[ms-translator-speech-service] translation url construction', function (t) {
  t.plan(1);

  const options = {
    subscriptionKey: 'abc1234',
    toLanguage: 'fr',
    fromLanguage: 'fr',
    features: {
      timinginfo: true,
      partial: true
    },
    profanityMarker: 'Tag',
    profanityAction: 'Marked'
  };

  const translator = new translationService(options);
  const url = 'wss://dev.microsofttranslator.com/speech/translate?api-version=1.0&from=fr&to=fr&features=timinginfo,partial&ProfanityMarker=Tag&ProfanityAction=Marked&voice=&format=';

  t.equal(translator.speechTranslateUrl, url, 'url is constructed correctly');
});

