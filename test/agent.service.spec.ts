import { Test } from '@nestjs/testing';
import { IssuanceService } from '../src/issuance/issuance.service';
import { AgentService } from '../src/agent/agent.service';
import {
  IssuanceMessageTypes,
  PresentationMessageTypes,
} from '../src/agent/utils/waci-types';

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

const issuanceExchanges = {
  unfinishedExchanges: [
    {
      thid: 'bf2797d2-a424-43cb-a24a-fe7a261a475e',
      pthid: '9244386b-0c73-4913-8d88-35b215cdc560',
      issuerDid:
        'did:cadena:matic:EiC95hlWxiM2SHRlNBNo8Is7PPSZPRs-Yy5-d-mFCoKdUw',
      holderDid:
        'did:cadena:matic:EiDHj66grunJ5zRTKZGN_yM6T1PlWnBqVdY5Wi08Juq_rg',
    },
  ],
  finishedExchanges: [
    {
      thid: 'bf2797d2-a424-43cb-a24a-fe7a261a475e',
      pthid: '9244386b-0c73-4913-8d88-35b215cdc560',
      issuerDid:
        'did:cadena:matic:EiC95hlWxiM2SHRlNBNo8Is7PPSZPRs-Yy5-d-mFCoKdUw',
      holderDid:
        'did:cadena:matic:EiDHj66grunJ5zRTKZGN_yM6T1PlWnBqVdY5Wi08Juq_rg',
    },
  ],
};

const verificationExchanges = {
  unfinishedExchanges: [
    {
      thid: 'bbdc9e28-5b3e-4e53-800f-930ce16ec660',
      pthid: '50fdca7a-f0e1-4c73-8e01-6a8fc3603905',
      verifierDid:
        'did:cadena:matic:EiCRz-J72te32N8TtTINwutetlP2qV9pfbEQCwAmosNlBg',
      holderDid:
        'did:cadena:matic:EiDHj66grunJ5zRTKZGN_yM6T1PlWnBqVdY5Wi08Juq_rg',
    },
  ],
  finishedExchanges: [
    {
      thid: 'b9fd3b63-e25e-455f-8825-8f890a926453',
      pthid: '50fdca7a-f0e1-4c73-8e01-6a8fc3603905',
      verifierDid:
        'did:cadena:matic:EiCRz-J72te32N8TtTINwutetlP2qV9pfbEQCwAmosNlBg',
      holderDid:
        'did:cadena:matic:EiDHj66grunJ5zRTKZGN_yM6T1PlWnBqVdY5Wi08Juq_rg',
    },
  ],
};

describe('AgentService', () => {
  let agentService: AgentService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [IssuanceService, AgentService],
    }).compile();

    agentService = moduleRef.get<AgentService>(AgentService);
  });

  describe('findMessageByType', () => {
    it('should return undefined if no message is found', async () => {
      const message = await agentService.findMessageByType(
        IssuanceMessageTypes.ProposeCredential,
        'yeet',
      );

      expect(message).toBeUndefined();
    });

    it('should return a issuance proposal message', async () => {
      const exchange = issuanceExchanges.unfinishedExchanges[0];

      const message = await agentService.findMessageByType(
        IssuanceMessageTypes.ProposeCredential,
        exchange.pthid,
      );

      expect(message).toBeDefined();
      expect(message).toHaveProperty('pthid', exchange.pthid);
      expect(message).toHaveProperty(
        'type',
        IssuanceMessageTypes.ProposeCredential,
      );
      expect(message).toHaveProperty('from', exchange.holderDid);
      expect(message).toHaveProperty('to', [exchange.issuerDid]);
    });

    it('should return a offer message', async () => {
      const exchange = issuanceExchanges.finishedExchanges[0];

      const message = await agentService.findMessageByType(
        IssuanceMessageTypes.OfferCredential,
        exchange.thid,
      );

      expect(message).toBeDefined();
      expect(message).toHaveProperty('thid', exchange.thid);
      expect(message).toHaveProperty(
        'type',
        IssuanceMessageTypes.OfferCredential,
      );
      expect(message).toHaveProperty('from', exchange.issuerDid);
      expect(message).toHaveProperty('to', [exchange.holderDid]);
    });

    it('should return a presentation proposal message', async () => {
      const exchange = verificationExchanges.finishedExchanges[0];

      const message = await agentService.findMessageByType(
        PresentationMessageTypes.ProposePresentation,
        exchange.pthid,
      );

      expect(message).toBeDefined();
      expect(message).toHaveProperty('id', exchange.thid);
      expect(message).toHaveProperty(
        'type',
        PresentationMessageTypes.ProposePresentation,
      );
      expect(message).toHaveProperty('from', exchange.holderDid);
      expect(message).toHaveProperty('to', [exchange.verifierDid]);
    });
  });
});
