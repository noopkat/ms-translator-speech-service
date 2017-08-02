const debug = require('debug')('translationService');
const request = require('request');
const wsClient = require('websocket').client;

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
  request.post(postRequest, function(error, response, body) {
    return callback(error, body);
  }); 
};

translatorService.prototype._connectToWebsocket = function(accessToken, callback) {
  // create new client
  const ws = new wsClient();
      
  // event for connection failure
  ws.on('connectFailed', function (error) {
    debug('connection to translation endpoint failed:', error);

    return callback(error);
  });
              
  // event for connection success
  ws.on('connect', function (connection) {
    debug('connection to translation endpoint succeeded');

    this.connection = connection;

    // return the successful socket connection for use 
    return callback(null, connection);	
  });
 
  debug('connecting to translation endpoint');
    
  // connect to the service
  ws.connect(this.speechTranslateUrl, null, null, { 'Authorization': `Bearer ${accessToken}` });
};

translatorService.prototype.start = function(callback) {
  const _this = this;
  if (this.subscriptionKey === undefined) {
    const error = new Error('Missing subscriptionKey option - please find your key via the Azure portal.');
    return callback(error);
  };

  this._requestAccessToken(function(error, accessToken) {
    if (error) return callback(error);
    debug('acquired access token for translation endpoint');

    _this._connectToWebsocket(accessToken, callback); 
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
