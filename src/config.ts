import * as dotenv from 'dotenv';
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  didMethod: process.env.DID_METHOD || 'did:quarkid:matic',
  dwnUrl: process.env.DWN_URL || 'https://demo.extrimian.com/dwn/',
  modenaUrl: process.env.MODENA_URL || 'http://modena.gcba-extrimian.com:8080',
  storagePath: process.env.STORAGE_PATH || 'storage',
};

export default config;
