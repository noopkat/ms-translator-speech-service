'use strict';
const debug = require('debug')('translationService');
const request = require('request');
const wsClient = require('websocket').client;
const uuid = require('uuid/v4');
const sendFile = require('./lib/send-file');
const sendStream = require('./lib/send-stream');

const translatorService = function init(options) {
  const defaultOptions = {
    apiVersion: '1.0',
    fromLanguage: 'en',
    toLanguage: 'en',
    features: {},
    profanityAction: 'Marked',
    profanityMarker: 'Asterisk',
    voice: '',
    format: '',
    clientTraceId: uuid()
  };

  Object.assign(this, defaultOptions, options);
  
  const featureStrings = Object.keys(this.features).filter((key) => {
    return !!this.features[key];
  });

  const featureQueryString = featureStrings.length ? `&features=${featureStrings.join(',').toLowerCase()}` : '';
  const voiceQueryString = this.voice.length ? `&voice=${this.voice}` : '';
  const formatQueryString = this.format.length? `&format=${this.format}` : '';
  
  const speechTranslateShortUrl = 'wss://dev.microsofttranslator.com/speech/translate';
  this.speechTranslateUrl = `${speechTranslateShortUrl}?api-version=${this.apiVersion}&from=${this.fromLanguage}&to=${this.toLanguage}${featureQueryString}&ProfanityMarker=${this.profanityMarker}&ProfanityAction=${this.profanityAction}${voiceQueryString}${formatQueryString}`;
  
  this.issueTokenUrl = 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken';
};

translatorService.prototype._requestAccessToken = function(callback) {
  const postRequest = {
    url: this.issueTokenUrl,
    headers: {
     'Ocp-Apim-Subscription-Key': this.subscriptionKey 
    }
  };
 
  debug('requesting access token for translation endpoint');
   
  // request token
  request.post(postRequest, (error, response, body) => {
    return callback(error, body);
  }); 
};

translatorService.prototype._connectToWebsocket = function(accessToken, callback) {
  // create new client
  const ws = new wsClient();
      
  // event for connection failure
  ws.once('connectFailed', (error) => {
    debug('connection to translation endpoint failed:', error);

    return callback(error);
  });
              
  // event for connection success
  ws.once('connect', (connection) => {
    debug('connection to translation endpoint succeeded');

    this.connection = connection;
    
    this.connection.sendFile = sendFile;
    this.connection.sendStream = sendStream;

    // return the successful socket connection for use 
    return callback(null, connection);	
  });
 
  debug('connecting to translation endpoint');
   
   const wsheaders = {
     'X-ClientTraceId': this.clientTraceId,
     'Authorization': `Bearer ${accessToken}`
   };
  // connect to the service
  ws.connect(this.speechTranslateUrl, null, null, wsheaders);
};

translatorService.prototype.start = function(callback) {
  if (this.subscriptionKey === undefined) {
    const error = new Error('Missing subscriptionKey option - please find your key via the Azure portal.');
    return callback(error);
  };

  this._requestAccessToken((error, accessToken) => {
    if (error) return callback(error);
    debug('acquired access token for translation endpoint');

    this._connectToWebsocket(accessToken, callback); 
  });
};

translatorService.prototype.stop = function(callback) {
  if (!this.connection) return callback(null);
  this.connection.once('close', callback);
  this.connection.close();
  debug('closed translation endpoint connection');
};

// WIP
translatorService.supportedLanguages = function() {
  return '';
};

module.exports = translatorService;
