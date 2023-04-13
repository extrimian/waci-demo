import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AgentType, CreateDidDto } from './dto/create-did.dto';
import { UpdateDidDto } from './dto/update-did.dto';
import {
  Agent,
  AgentModenaUniversalRegistry,
  AgentModenaUniversalResolver,
  DID,
  FileSystemAgentSecureStorage,
  FileSystemStorage,
  VerifiableCredential,
  WACICredentialOfferSucceded,
  WACIProtocol,
} from '@extrimian/agent';

@Injectable()
export class DidService {
  private readonly waciProtocolsByType: Map<AgentType, WACIProtocol>;
  constructor() {
    this.waciProtocolsByType = new Map<AgentType, WACIProtocol>([
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
        }),
      ],
    ]);
  }

  async create(createDidDto: CreateDidDto): Promise<DID> {
    const registry = new AgentModenaUniversalRegistry(
      'http://modena.gcba-extrimian.com:8080',
    );
    registry.setDefaultDIDMethod('did:quarkid:matic');

    const agent = new Agent({
      didDocumentRegistry: registry,
      didDocumentResolver: new AgentModenaUniversalResolver(
        'http://modena.gcba-extrimian.com:8080',
      ),
      vcProtocols: [this.waciProtocolsByType.get(createDidDto.agentType)],
      secureStorage: new FileSystemAgentSecureStorage({
        filepath: `storage/${createDidDto.agentType}_secure.json`,
      }),
      agentStorage: new FileSystemStorage({
        filepath: `storage/${createDidDto.agentType}.json`,
      }),
    });

    // Initialize the agent, loading and configuring internal classes
    agent.initialize();

    Logger.log('Waiting for agent to be ready', 'DidService');
    const wait = async () =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);
      });
    await wait();

    // Lauch creation operation
    Logger.log('Launching DID creation', 'DidService');
    let agentDid: DID;
    await agent.identity.createNewDID({
      dwnUrl: 'http://ssi.gcba-extrimian.com:1337/',
    });

    // Wait for DID creation
    Logger.log('Waiting for DID creation', 'DidService');
    agent.identity.didCreated.on(async (args) => {
      if (!args) {
        Logger.log('Error creating DID', 'DidService');
        throw new InternalServerErrorException('Error creating DID');
      }
      agentDid = args.did;
    });

    // Poll until all DIDs are created
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (agentDid) {
          clearInterval(interval);
          Logger.log(`DID created: ${agentDid.value}`, 'DidService');
          resolve(agentDid);
        }
      }, 1000);
    });
  }

  findAll() {
    return `This action returns all did`;
  }

  findOne(id: number) {
    return `This action returns a #${id} did`;
  }

  update(id: number, updateDidDto: UpdateDidDto) {
    return `This action updates a #${id} did`;
  }

  remove(id: number) {
    return `This action removes a #${id} did`;
  }
}
