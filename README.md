# Cognitive Services Speech to Text Service
NodeJS service wrapper for Microsoft Translator Speech API

`npm install cogserv-speechtotext-service`

This service wrapper supports the speech to text functionality of the Microsoft Translator API.

## Installation

1. Install [NodeJS](http://nodejs.org) on your computer
2. Create a new directory for your code project if you haven't already
2. Open a terminal and run `npm install cogserv-speechtotext-service` from your project directory

## Usage

You'll first need to [create a Microsoft Translator Speech API key](https://www.microsoft.com/en-us/translator/getstarted.aspx). You can do this while logged in to the Azure Portal.

The following code will get you up and running with the essentials:

```js
const translationService = require('cogserv-speechtotext-service');

const options = {
  subscriptionKey: '<your api key>',
  toLanguage: 'en',
  fromLanguage: 'en',
  features: {
    partial: false,
    timinginfo: true
  }
};

const translator = new translationService(options);
translator.start((error, service) => {
  if (!error) {
    console.log('translator service started.');
  }
});

```

See the [API section](#api-reference) of these docs for details on configuration and methods.

## Example

The following audio stream example is based on the [Microsoft Translator NodeJS Example](https://github.com/MicrosoftTranslator/NodeJs-Example) source on Github. Thanks to the contributors :smile:

**Scenario: translating an existing audio speech file.** Remember to check the [Translation API docs](http://docs.microsofttranslator.com/speech-translate.html) for details on the audio data format needed.

```js
// credit for stream code: https://github.com/MicrosoftTranslator/NodeJs-Example

const translationService = require('cogserv-speechtotext-service');
const streamBuffers = require('stream-buffers');
const fs = require('fs');

// create audio file stream for sending to Translator API
const createAudioStream = (filename) => {
  // stream will output 32000 sized chunks every 100 milliseconds
  const options = {
    frequency: 100, 
    chunkSize: 32000 
  };

  const audioStreamBuffer = new streamBuffers.ReadableStreamBuffer(options);
  
  // read the file and put it into the buffer
  audioStreamBuffer.put(fs.readFileSync(filename));
	
  // If the audio file is too short after the speaker has finished,
  // add some silences at the end to tell the service that it is the end of the sentence
  // 32 bytes / ms, so 320000 = 10 seconds of silence
  audioStreamBuffer.put(new Buffer(320000));
  audioStreamBuffer.stop();

  return audioStreamBuffer;
};

// set up and connect to Translator API
const options = {
  subscriptionKey: '<your api key>',
  toLanguage: 'en',
  fromLanguage: 'en'
};

const translator = new translationService(options);
translator.start((error, service) => {
  if (error) return console.error(error);

  service.on('message', (message) => {
    const translation = JSON.parse(message.utf8Data);
    console.log(translation);
  }

  const audioStream = createAudioStream('/path/to/audio.wav');
  audioStream.on('data', (data) => service.sendBytes(data));
  audioStream.on('end', () => translator.stop());
});

```


## API Reference

### TranslatorService(options)

+ `options` _Object_
+ **Returns** `TranslatorService`

Creates a new instance of `TranslatorService`.

```js
const translator = new translationService(options);
```

Available options are below:

| name                      | type      | description                                                                                              | default | required |
|---------------------------|-----------|----------------------------------------------------------------------------------------------------------|---------|----------|
| `subscriptionKey`         | `String`  | your Translator API key                                                                                  | n/a     | yes      |
| `fromLang`                | `String`  | the language you want to translate from. See supported languages in the [official Microsoft Translator API docs](https://www.microsoft.com/en-us/translator/languages.aspx).                                                                  | `'en'`  | no       |
| `toLang`                  | `String`  | the language you want to translate to. See supported languages in the [official Microsoft Translator API docs](https://www.microsoft.com/en-us/translator/languages.aspx).                                                                    | `'en'`  | no       |
| `features`                | `Object`  | additional features needed from the API                                                                  | `{}`    | no       |
| `partial`    | `Boolean` | defined under the `features` option. Returns partial translation results in additional to final results. | `false` | no       |
| `timinginfo` | `Boolean` | defined under the `features` option. Returns timing info in translation results.                         | `false` | no       |


### translator.start(callback)

+ `callback` _Function_

Connects to the Speech API websocket on your behalf and returns the websocket instance once connected. Callback follows the errorback pattern.

```js
translator.start((error, service) => {
  if (!error) console.log('translator service started.');
});
```

### translator.stop(callback)

+ `callback` _Function_

Disconnects from the established websocket connection to the Speech API. Callback follows the errorback pattern.

```js
translator.stop((error) => {
  if (!error) console.log('translator service stopped.');
});
```

### service.sendBytes(buffer)

+ `buffer` _Buffer_

Sends an audio payload to the Speech API websocket connection. Audio payload is a native NodeJS Buffer.

See the 'Sending Audio' section of the [Translation API docs](http://docs.microsofttranslator.com/speech-translate.html) for details on the data format needed.

```js
service.sendBytes(myAudioBufferChunk);
```

### service.on('message', callback)

+ `callback` _Function_

Event listener for incoming translation message payloads from the Speech API. Message payload is a JSON object.


```js
service.on('message', (message) => {
  console.log(message);
});

/*
 Example message payload:

 {"type": "utf8", "utf8Data": '{"type":"final","id":"0","recognition":"Hello world","translation":"Hello world"}'}

*/

```

### service.on('close', callback)

+ `callback` _Function_

Event listener for Speech API websocket connection closures.


```js
service.on('close', () => {
  console.log('Speech API connection closed');
});


```

### service.on('error', callback)

+ `callback` _Function_

Event listener for incoming Speech API websocket connection errors. 


```js
service.on('error', (error) => {
  console.log(error);
});


```

