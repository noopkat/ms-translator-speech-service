module.exports = function(inputStream, callback) {
  inputStream.on('data', (data) => {
    console.log(data, this.sendBytes);
    this.sendBytes(data);
  })
  inputStream.on('end', () => {
    if (callback) return callback();
  });
};
