import * as dotenv from 'dotenv';
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  didMethod: process.env.DID_METHOD || 'did:cadena:matic',
  dwnUrl: process.env.DWN_URL || 'https://demo.extrimian.com/dwn/',
  modenaUrl:
    process.env.MODENA_URL || 'https://demo.extrimian.com/sidetree-proxy/',
  storagePath: 'storage',
};

export default config;
