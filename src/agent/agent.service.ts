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
import * as fs from 'fs';
import { glob } from 'glob';
import { agent } from 'supertest';

type InitializeAgentsParams = {
  modenaUrl: string;
  didMethod: string;
  storagePath: string;
  agentTypes?: AgentType[];
};

type AgentInfo = {
  agentType: AgentType;
  agent: Agent;
  did?: DID;
};

type DidDocumentByType = {
  agentType: AgentType;
  didDocument: any;
};

async function initializeAgents(
  params: InitializeAgentsParams,
): Promise<AgentInfo[]> {
  // Create all agents by default
  const agentTypes = params.agentTypes || Object.values(AgentTypes);

  const agents: Agent[] = [];

  const initializationPromises = agentTypes.map(async (agentType) => {
    const agent = new Agent({
      didDocumentRegistry: new AgentModenaUniversalRegistry(
        params.modenaUrl,
        params.didMethod,
      ),
      didDocumentResolver: new AgentModenaUniversalResolver(params.modenaUrl),
      vcProtocols: [waciProtocolsByType.get(agentType)],
      secureStorage: new FileSystemAgentSecureStorage({
        filepath: `${params.storagePath}/${agentType}_secure.json`,
      }),
      agentStorage: new FileSystemStorage({
        filepath: `${params.storagePath}/${agentType}.json`,
      }),
      vcStorage: new FileSystemStorage({
        filepath: `${params.storagePath}/${agentType}_vc.json`,
      }),
    });
    agents.push(agent);
    // Initialize the agent, loading and configuring internal classes
    return agent.initialize();
  });

  await Promise.all(initializationPromises);

  const agentInfoArray = agents.map((agent, index) => {
    return {
      agentType: agentTypes[index],
      agent,
    };
  });

  return agentInfoArray;
}

async function resolveAgents(
  agentInfoArray: AgentInfo[],
  dwnUrl: string,
): Promise<DidDocumentByType[]> {
  agentInfoArray.forEach((agentInfo) => {
    if (!agentInfo.agent.identity.initialized) {
      throw new InternalServerErrorException('Agent not initialized');
    }
  });

  // Separate the agents between those that already have a DID and those that don't
  const registeredAgents: AgentInfo[] = [];
  const unregisteredAgents: AgentInfo[] = [];
  agentInfoArray.filter((agentInfo) => {
    const did = agentInfo.agent.identity.getOperationalDID();
    if (!did) {
      unregisteredAgents.push(agentInfo);
    } else {
      registeredAgents.push({ ...agentInfo, did: did });
      Logger.debug(
        `Agent ${agentInfo.agentType} already has a DID`,
        'AgentService',
      );
    }
  });

  // Launch creation operation
  const didCreationPromises = unregisteredAgents.map((agentInfo) => {
    Logger.log(`Creating DID for agent ${agentInfo.agentType}`, 'AgentService');
    return agentInfo.agent.identity.createNewDID({
      dwnUrl: dwnUrl,
    });
  });

  // Create an array of Promises that resolves when each listener receives an event
  const didCreationListeners = unregisteredAgents.map((agentInfo) => {
    return new Promise((resolve, reject) => {
      agentInfo.agent.identity.didCreated.on((args) => {
        if (!args) {
          Logger.log('Error creating DID', 'AgentService');
          reject(new InternalServerErrorException('Error creating DID'));
        }
        Logger.log(
          `Listened for DID created for agent ${agentInfo.agentType}: ${args.did.value}`,
          'AgentService',
        );
        resolve(args.did);
      });
    });
  });

  // Wait for all Promises to resolve
  Logger.log('Waiting for DID creation', 'AgentService');
  const didArray = (await Promise.all(didCreationListeners)) as DID[];

  // Join newly registered agents with the ones that already had a DID
  Logger.log(`Joining registered agents: ${didArray.length}`, 'AgentService');
  didArray.forEach((did, index) => {
    Logger.log(
      `DID created for agent ${unregisteredAgents[index].agentType}`,
      'AgentService',
    );
    registeredAgents.push({ ...unregisteredAgents[index], did: did });
  });

  Logger.debug(`Registered agents: ${registeredAgents.length}`, 'AgentService');
  registeredAgents.forEach((agentInfo) => {
    Logger.log(
      `Agent ${agentInfo.agentType} has a DID: ${agentInfo.did.value}`,
      'AgentService',
    );
  });

  // Resolve DID Documents
  Logger.log('Launching DID resolution', 'AgentService');
  const promises = registeredAgents.map((agentInfo) => {
    return agentInfo.agent.resolver.resolve(agentInfo.did);
  });

  // Wait for DID resolution
  Logger.log('Waiting for DID resolution', 'AgentService');
  const didDocuments = await Promise.all(promises);
  const didDocumentsByType = didDocuments.map((didDocument, index) => {
    Logger.log(
      `DID Document resolved for agent ${registeredAgents[index].agentType}`,
      'AgentService',
    );
    return {
      agentType: registeredAgents[index].agentType,
      didDocument: didDocument,
    };
  });

  return didDocumentsByType;
}

@Injectable()
export class AgentService {
  modenaUrl = 'http://modena.gcba-extrimian.com:8080';
  didMethod = 'did:quarkid:matic';
  dwnUrl = 'http://ssi.gcba-extrimian.com:1337/';
  storagePath = 'storage';
  // Creates an agent for each type and returns their DIDDocuments in a map
  async create(agentTypes: AgentType[]) {
    const params: InitializeAgentsParams = {
      modenaUrl: this.modenaUrl,
      didMethod: this.didMethod,
      storagePath: this.storagePath,
      agentTypes: agentTypes,
    };

    const agentInfoArray = await initializeAgents(params);
    Logger.log('Agents initialized', 'AgentService');
    const resolvedAgents = await resolveAgents(agentInfoArray, this.dwnUrl);

    return resolvedAgents;
  }

  // Returns all DIDs
  async findAll() {
    return await this.findByType(Object.values(AgentTypes));
  }

  async findByType(agentTypes: AgentType[]) {
    // Initializes agents for all the types
    const params: InitializeAgentsParams = {
      modenaUrl: this.modenaUrl,
      didMethod: this.didMethod,
      storagePath: this.storagePath,
      agentTypes: agentTypes,
    };
    const agentsMap = await initializeAgents(params);

    // Creates DIDs for all the types, some may already have a DID and are skipped
    const resolvedAgents = await resolveAgents(agentsMap, this.dwnUrl);

    return resolvedAgents;
  }

  async remove(type: AgentType) {
    const files = await glob(`${this.storagePath}/${type}*`);
    files.forEach((file) => {
      try {
        fs.unlinkSync(file);
        Logger.log(`${file} deleted successfully`, 'AgentService');
      } catch (err) {
        Logger.error(`Error deleting ${file}: ${err}`, 'AgentService');
      }
    });
  }
}
