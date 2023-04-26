import * as dotenv from 'dotenv';
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  didMethod: process.env.DID_METHOD || 'did:quarkid:matic',
  dwnUrl:
    process.env.DWN_URL ||
    'https://dwm--4uw2lpp.bravegrass-b137de87.westus2.azurecontainerapps.io/',
  modenaUrl: process.env.MODENA_URL || 'http://modena.gcba-extrimian.com:8080',
  storagePath: process.env.STORAGE_PATH || 'storage',
};

export default config;
