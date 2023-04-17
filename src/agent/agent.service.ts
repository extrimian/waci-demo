import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AgentType, CreateAgentDto } from './dto/create-agent.dto';
import {
  Agent,
  AgentModenaUniversalRegistry,
  AgentModenaUniversalResolver,
  DID,
  VerifiableCredential,
  WACICredentialOfferSucceded,
  WACIProtocol,
} from '@extrimian/agent';
import { FileSystemStorage } from './utils/filesystem-storage';
import { FileSystemAgentSecureStorage } from './utils/filesystem-agent-secure-storage';

@Injectable()
export class AgentService {
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
  }

  async create(createDidDto: CreateAgentDto): Promise<DID> {
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
      vcStorage: new FileSystemStorage({
        filepath: `storage/${createDidDto.agentType}_vc.json`,
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

  findOne(type: AgentType) {
    return `This action returns a #${type} did`;
  }

  update(type: AgentType) {
    return `This action updates a #${type} did`;
  }

  remove(type: AgentType) {
    return `This action removes a #${type} did`;
  }
}
