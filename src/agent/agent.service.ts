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

type InitializeAgentsParams = {
  modenaUrl: string;
  didMethod: string;
  storagePath: string;
  agentTypes?: AgentType[];
};

async function initializeAgents(
  params: InitializeAgentsParams,
): Promise<Map<AgentType, Agent>> {
  // Create all agents by default
  const agentTypes = params.agentTypes || Object.values(AgentTypes);

  const agentsMap = new Map<AgentType, Agent>();
  agentTypes.forEach((agentType) => {
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

  return agentsMap;
}

async function createDids(
  agentsMap: Map<AgentType, Agent>,
  dwnUrl: string,
): Promise<Map<AgentType, DID>> {
  agentsMap.forEach((agent) => {
    if (!agent.identity.initialized) {
      throw new InternalServerErrorException('Agent not initialized');
    }
  });

  // Remove the agents who already have a DID and add them to a list of resolved agents, to be appended later
  const resolvedAgentsMap = new Map<AgentType, Agent>();
  agentsMap.forEach((agent, type) => {
    if (agent.identity.getOperationalDID()) {
      agentsMap.delete(type);
      resolvedAgentsMap.set(type, agent);
      Logger.log(`Agent ${type} already has a DID`, 'AgentService');
    }
  });

  // Lauch creation operation
  Logger.log('Launching DID creation', 'AgentService');
  agentsMap.forEach((agent) => {
    agent.identity.createNewDID({
      dwnUrl: dwnUrl,
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
      Logger.log(
        'Polling DID creation: ' +
          (agentsMap.size - didMap.size) +
          ' remaining',
        'AgentService',
      );
      if (didMap.size === agentsMap.size) {
        clearInterval(interval);
        Logger.log('All DIDs created', 'AgentService');
        resolve(0);
      }
    }, 1000);
  });

  // Add the resolved agents to the didMap and return them to the agentsMap
  resolvedAgentsMap.forEach((agent, type) => {
    didMap.set(type, agent.identity.getOperationalDID());
    agentsMap.set(type, agent);
  });

  return didMap;
}

async function getDidDocuments(
  didMap: Map<AgentType, DID>,
  agentsMap: Map<AgentType, Agent>,
) {
  Object.values(AgentTypes).forEach((agentType) => {
    if (!agentsMap.get(agentType).identity.initialized) {
      throw new InternalServerErrorException('Agent not initialized');
    }
    if (!didMap.has(agentType)) {
      throw new InternalServerErrorException('DID not created');
    }
  });

  if (didMap.size !== agentsMap.size) {
    throw new InternalServerErrorException('DIDs and agents do not match');
  }

  // Resolve DID Documents
  const promises = [];
  didMap.forEach((did, type) => {
    promises.push({
      agentType: type,
      didDocument: agentsMap.get(type).resolver.resolve(did),
    });
  });
  const didDocuments = await Promise.all(promises.map((p) => p.didDocument));

  const res = [];
  didDocuments.forEach((didDocument, index) => {
    res.push({
      agentType: promises[index].agentType,
      didDocument: didDocument,
    });
  });
  return res;

  // Resolve DID Docments
  // const didDocuments = [];
  // didMap.forEach(async (did, type) => {
  //   const didDocument = await agentsMap.get(type).resolver.resolve(did);
  //   didDocuments.push({ agentType: type, didDocument: didDocument });
  // });
  // await new Promise((resolve) => {
  //   const interval = setInterval(() => {
  //     Logger.log(
  //       'Polling DID resolution: ' +
  //         (agentsMap.size - didDocuments.length) +
  //         ' remaining',
  //       'AgentService',
  //     );
  //     if (didDocuments.length === agentsMap.size) {
  //       clearInterval(interval);
  //       Logger.log('All DID Documents resolved', 'AgentService');
  //       resolve(0);
  //     }
  //   }, 100);
  // });
  // return didDocuments;
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

    const agentsMap = await initializeAgents(params);

    const didMap = await createDids(agentsMap, this.dwnUrl);

    const didDocumentMap = await getDidDocuments(didMap, agentsMap);

    return didDocumentMap;
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
    const didMap = await createDids(agentsMap, this.dwnUrl);

    const didDocumentMap = await getDidDocuments(didMap, agentsMap);

    return didDocumentMap;
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
