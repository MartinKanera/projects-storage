import { resolve } from 'path';
import { Module } from '@nuxt/types';
import firebase from 'firebase/app';

type Options = {
  config: any;
};

const firebaseModule: Module = function (moduleOptions) {
  const options: Options = { ...this.options.firebase, ...moduleOptions };

  this.addTemplate({
    src: resolve(__dirname, '../templates/firebase.sw.js'),
    filename: '../static/firebase.sw.js',
    options: {
      firebaseVersion: firebase.SDK_VERSION,
      config: options.config,
      ignorePaths: ['/__webpack_hmr', '/_loading'],
    },
  });
};

export default firebaseModule;
