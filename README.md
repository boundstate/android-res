# android-res

## Usage

```js
var androidRes = require('android-res');

var options = {
  sourceSize: 'xxxhdpi', // optional (default is 'xxxhdpi')
  dest: 'platforms/android/res/',
  destSizes: ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi'] // optional
};

androidRes('ic_notify.png', options)
  .catch(function(err) {
    console.error(err);
  })
  .progress(function (data) {
    console.log(data);
  })
  .then(function() {
    console.log('');
  });
```

## Requirements

- GraphicsMagick

## License

MIT