import { Test } from '@nestjs/testing';
import { IssuanceService } from '../src/issuance/issuance.service';
import { AgentService } from '../src/agent/agent.service';
import { WaciMessageTypes } from '../src/issuance/utils/issuance-utils';

// Mock dotenv and config modules
jest.mock('dotenv');
jest.mock('../src/config', () => ({
  default: {
    port: 3000,
    didMethod: 'did:quarkid:matic',
    dwnUrl:
      'https://dwm--4uw2lpp.bravegrass-b137de87.westus2.azurecontainerapps.io/',
    modenaUrl: 'http://modena.gcba-extrimian.com:8080',
    storagePath: 'test/storage',
  },
}));

const testData = {
  unfinishedExchanges: [
    {
      thid: 'a51e1136-c5a4-4466-bb03-61c5780dfbad',
      pthid: '630fd041-46a7-481f-8785-83357dba3089',
      issuerDid:
        'did:quarkid:matic:EiBsCrU1ZyltuCY1DpEkEcF_AwSNG4AEPgqgfgoizfvBTA',
      holderDid:
        'did:quarkid:matic:EiBRGOKA_fSzq1UF-9eJDOi0tG_LlnoNBO7y9_Iec_p8Kw',
    },
    {
      thid: 'd1085e03-478a-480b-9d4b-48b3ee8a6d4f',
      pthid: '630fd041-46a7-481f-8785-83357dba3089',
      issuerDid:
        'did:quarkid:matic:EiBsCrU1ZyltuCY1DpEkEcF_AwSNG4AEPgqgfgoizfvBTA',
      holderDid:
        'did:quarkid:matic:EiBRGOKA_fSzq1UF-9eJDOi0tG_LlnoNBO7y9_Iec_p8Kw',
    },
  ],
  finishedExchanges: [
    {
      thid: '64393e71-dd13-4a1b-a361-f61c1786318d',
      pthid: '630fd041-46a7-481f-8785-83357dba3089',
      issuerDid:
        'did:quarkid:matic:EiBsCrU1ZyltuCY1DpEkEcF_AwSNG4AEPgqgfgoizfvBTA',
      holderDid:
        'did:quarkid:matic:EiBRGOKA_fSzq1UF-9eJDOi0tG_LlnoNBO7y9_Iec_p8Kw',
    },
    {
      thid: 'b1b43818-0da6-4a73-b6ab-a39488b1da78',
      pthid: '630fd041-46a7-481f-8785-83357dba3089',
      issuerDid:
        'did:quarkid:matic:EiBsCrU1ZyltuCY1DpEkEcF_AwSNG4AEPgqgfgoizfvBTA',
      holderDid:
        'did:quarkid:matic:EiBRGOKA_fSzq1UF-9eJDOi0tG_LlnoNBO7y9_Iec_p8Kw',
    },
    {
      thid: '48629ceb-bc27-496d-9953-6e11c926ac12',
      pthid: '630fd041-46a7-481f-8785-83357dba3089',
      issuerDid:
        'did:quarkid:matic:EiBRGOKA_fSzq1UF-9eJDOi0tG_LlnoNBO7y9_Iec_p8Kw',
      holderDid:
        'did:quarkid:matic:EiBsCrU1ZyltuCY1DpEkEcF_AwSNG4AEPgqgfgoizfvBTA',
    },
    {
      thid: '88556b77-38fe-4a9c-a900-8ce4383db15e',
      pthid: '630fd041-46a7-481f-8785-83357dba3089',
      issuerDid:
        'did:quarkid:matic:EiBsCrU1ZyltuCY1DpEkEcF_AwSNG4AEPgqgfgoizfvBTA',
      holderDid:
        'did:quarkid:matic:EiBRGOKA_fSzq1UF-9eJDOi0tG_LlnoNBO7y9_Iec_p8Kw',
    },
  ],
};

describe('IssuanceService', () => {
  let issuanceService: IssuanceService;
  let agentService: AgentService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [IssuanceService, AgentService],
    }).compile();

    issuanceService = moduleRef.get<IssuanceService>(IssuanceService);
    agentService = moduleRef.get<AgentService>(AgentService);
  });

  describe('findMessageByType', () => {
    it('should return undefined if no message is found', async () => {
      const message = await issuanceService.findMessageByType(
        WaciMessageTypes.ProposeCredential,
        'yeet',
      );

      expect(message).toBeUndefined();
    });

    it('should return a proposal message', async () => {
      const exchange = testData.unfinishedExchanges[0];

      const message = await issuanceService.findMessageByType(
        WaciMessageTypes.ProposeCredential,
        exchange.pthid,
      );

      expect(message).toBeDefined();
      expect(message).toHaveProperty('pthid', exchange.pthid);
      expect(message).toHaveProperty(
        'type',
        WaciMessageTypes.ProposeCredential,
      );
      expect(message).toHaveProperty('from', exchange.holderDid);
      expect(message).toHaveProperty('to', [exchange.issuerDid]);
    });

    it('should return a offer message', async () => {
      const exchange = testData.finishedExchanges[0];

      const message = await issuanceService.findMessageByType(
        WaciMessageTypes.OfferCredential,
        exchange.thid,
      );

      expect(message).toBeDefined();
      expect(message).toHaveProperty('thid', exchange.thid);
      expect(message).toHaveProperty('type', WaciMessageTypes.OfferCredential);
      expect(message).toHaveProperty('from', exchange.issuerDid);
      expect(message).toHaveProperty('to', [exchange.holderDid]);
    });
  });
});
