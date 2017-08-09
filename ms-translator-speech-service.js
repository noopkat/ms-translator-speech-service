const debug = require('debug')('translationService');
const fs = require('fs');
const path = require('path');
const request = require('request');
const wsClient = require('websocket').client;
const streamBuffers = require('stream-buffers');

const translatorService = function init(options) {
  this.apiVersion = options.apiVersion || '1.0';
  this.subscriptionKey = options.subscriptionKey;
  this.fromLanguage = options.fromLanguage || 'en';
  this.toLanguage = options.toLanguage || 'en';
  this.features = options.features || {};
  
  const featureStrings = Object.keys(this.features).filter((key) => {
    return !!this.features[key];
  });

  const featureQueryString = featureStrings.length ? `&features=${featureStrings.join(',')}` : '';
  
  const speechTranslateShortUrl = 'wss://dev.microsofttranslator.com/speech/translate';
  this.speechTranslateUrl = `${speechTranslateShortUrl}?api-version=${this.apiVersion}&from=${this.fromLanguage}&to=${this.toLanguage}${featureQueryString}`;
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
  ws = new wsClient();
      
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

    // return the successful socket connection for use 
    return callback(null, connection);	
  });
 
  debug('connecting to translation endpoint');
    
  // connect to the service
  ws.connect(this.speechTranslateUrl, null, null, { 'Authorization': `Bearer ${accessToken}` });
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

const sendFile = function(filepath, callback) {
  let absoluteFilepath;

  fs.access(filepath, (error) => {
    if (error) return callback(new Error(`could not find file ${filepath}`));

    absoluteFilepath = path.resolve(filepath);

    const options = {
      frequency: 100, 
      chunkSize: 32000 
    };

    const audioStream = new streamBuffers.ReadableStreamBuffer(options);
    
    audioStream.put(fs.readFileSync(absoluteFilepath));
    
    // add some silences at the end to tell the service that it is the end of the sentence
    audioStream.put(new Buffer(160000));
    audioStream.stop();

    audioStream.on('data', (data) => this.sendBytes(data));
    audioStream.on('end', () => {if (callback) return callback()});
  });
};

// WIP
translatorService.supportedLanguages = function() {
  return '';
};

module.exports = translatorService;
