import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  Agent,
  AgentModenaUniversalRegistry,
  AgentModenaUniversalResolver,
  DID,
} from '@extrimian/agent';
import { FileSystemStorage } from './utils/filesystem-storage';
import { FileSystemAgentSecureStorage } from './utils/filesystem-agent-secure-storage';
import {
  AgentType,
  AgentTypes,
  waciProtocolsByType,
} from './utils/agent-types';

@Injectable()
export class AgentService {
  // Creates an agent for each type and returns their DIDDocuments in a map
  async create() {
    const modenaUrl = 'http://modena.gcba-extrimian.com:8080';
    const didMethod = 'did:quarkid:matic';

    const agentsMap = new Map<AgentType, Agent>();
    Object.values(AgentTypes).forEach((agentType) => {
      const agent = new Agent({
        didDocumentRegistry: new AgentModenaUniversalRegistry(
          modenaUrl,
          didMethod,
        ),
        didDocumentResolver: new AgentModenaUniversalResolver(
          'http://modena.gcba-extrimian.com:8080',
        ),
        vcProtocols: [waciProtocolsByType.get(agentType)],
        secureStorage: new FileSystemAgentSecureStorage({
          filepath: `storage/${agentType}_secure.json`,
        }),
        agentStorage: new FileSystemStorage({
          filepath: `storage/${agentType}.json`,
        }),
        vcStorage: new FileSystemStorage({
          filepath: `storage/${agentType}_vc.json`,
        }),
      });
      agentsMap.set(agentType, agent);
    });

    // Initialize the agent, loading and configuring internal classes
    agentsMap.forEach((agent) => {
      agent.initialize();
    });

    Logger.log('Waiting for agents to be ready', 'AgentService');
    const wait = async () =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);
      });
    await wait();

    // Lauch creation operation
    Logger.log('Launching DID creation', 'AgentService');
    agentsMap.forEach(async (agent) => {
      await agent.identity.createNewDID({
        dwnUrl: 'http://ssi.gcba-extrimian.com:1337/',
      });
    });

    // Listen for DID creation
    const didMap = new Map<AgentType, DID>();
    Logger.log('Waiting for DID creation', 'AgentService');
    agentsMap.forEach((agent, type) => {
      agent.identity.didCreated.on(async (args) => {
        if (!args) {
          Logger.log('Error creating DID', 'AgentService');
          throw new InternalServerErrorException('Error creating DID');
        }
        didMap.set(type, args.did);
      });
    });

    // Poll until all DIDs are created
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (didMap.size === Object.values(AgentTypes).length) {
          clearInterval(interval);
          Logger.log('All DIDs created', 'AgentService');
        }
      }, 1000);
    });

    // Resolve DID Documents
    Logger.log('Resolving DID Documents', 'AgentService');
    const didDocumentMap = new Map<AgentType, any>();
    didMap.forEach(async (did, type) => {
      const didDocument = await agentsMap.get(type).resolver.resolve(did);
      didDocumentMap.set(type, didDocument);
    });

    return didDocumentMap;
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
