import {
  VerifiableCredential,
  WACICredentialOfferSucceded,
  WACIProtocol,
} from '@extrimian/agent';
import { FileSystemStorage } from './filesystem-storage';

export type AgentType = 'issuer' | 'holder' | 'verifier';
export enum AgentTypes {
  issuer = 'issuer',
  holder = 'holder',
  verifier = 'verifier',
}
export const waciProtocolsByType = new Map<AgentType, WACIProtocol>([
  [
    'issuer',
    new WACIProtocol({
      issuer: {
        issueCredentials: async (
          waciInvitationId: string,
          holderId: string,
        ) => {
          return new WACICredentialOfferSucceded({
            credentials: [
              {
                credential: {
                  '@context': [
                    'https://www.w3.org/2018/credentials/v1',
                    'https://www.w3.org/2018/credentials/examples/v1',
                    'https://w3id.org/security/bbs/v1',
                  ],
                  id: 'http://example.edu/credentials/58473',
                  type: ['VerifiableCredential', 'AlumniCredential'],
                  issuer:
                    'did:quarkid:starknet:EiCIBfgaePl4ESOOD-00GU8EAJSgwse1JDDIHYRz4aOtww',
                  issuanceDate: new Date(),
                  credentialSubject: {
                    id: holderId,
                    givenName: 'John',
                    familyName: 'Doe',
                  },
                },
                outputDescriptor: {
                  id: 'alumni_credential_output',
                  schema:
                    'https://schema.org/EducationalOccupationalCredential',
                  display: {
                    title: {
                      path: ['$.name', '$.vc.name'],
                      fallback: 'Alumni Credential',
                    },
                    subtitle: {
                      path: ['$.class', '$.vc.class'],
                      fallback: 'Alumni',
                    },
                    description: {
                      text: 'Credencial que permite validar que es alumno del establecimiento',
                    },
                  },
                  styles: {
                    background: {
                      color: '#ff0000',
                    },
                    thumbnail: {
                      uri: 'https://dol.wa.com/logo.png',
                      alt: 'Universidad Nacional',
                    },
                    hero: {
                      uri: 'https://dol.wa.com/alumnos.png',
                      alt: 'Alumnos de la universidad',
                    },
                    text: {
                      color: '#d4d400',
                    },
                  },
                },
              },
            ],
            issuer: {
              name: 'Universidad Nacional',
              styles: {
                thumbnail: {
                  uri: 'https://dol.wa.com/logo.png',
                  alt: 'Universidad Nacional',
                },
                hero: {
                  uri: 'https://dol.wa.com/alumnos.png',
                  alt: 'Alumnos de la universidad',
                },
                background: {
                  color: '#ff0000',
                },
                text: {
                  color: '#d4d400',
                },
              },
            },
            options: {
              challenge: '508adef4-b8e0-4edf-a53d-a260371c1423',
              domain: '9rf25a28rs96',
            },
          });
        },
      },
      storage: new FileSystemStorage({
        filepath: 'storage/issuer-waci-storage.json',
      }),
    }),
  ],
  [
    'holder',
    new WACIProtocol({
      holder: {
        selectVcToPresent: async (vcs: VerifiableCredential[]) => {
          return vcs;
        },
      },
      storage: new FileSystemStorage({
        filepath: 'storage/holder-waci-storage.json',
      }),
    }),
  ],
  [
    'verifier',
    new WACIProtocol({
      verifier: {
        presentationDefinition: async (invitationId: string) => {
          return {
            frame: {
              '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://www.w3.org/2018/credentials/examples/v1',
                'https://w3id.org/security/bbs/v1',
              ],
              type: ['VerifiableCredential', 'AlumniCredential'],
              credentialSubject: {
                '@explicit': true,
                type: ['AlumniCredential'],
                givenName: {},
                familyName: {},
              },
            },
            inputDescriptors: [
              {
                id: 'Alumni Credential',
                name: 'AlumniCredential',
                constraints: {
                  fields: [
                    {
                      path: ['$.credentialSubject.givenName'],
                      filter: {
                        type: 'string',
                      },
                    },
                    {
                      path: ['$.credentialSubject.familyName'],
                      filter: {
                        type: 'string',
                      },
                    },
                  ],
                },
              },
            ],
          };
        },
      },
      storage: new FileSystemStorage({
        filepath: 'storage/verifier-waci-storage.json',
      }),
    }),
  ],
]);
