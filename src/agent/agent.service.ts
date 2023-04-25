import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
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
import { DWNDebugTransport } from './utils/debug-transport';

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

@Injectable()
export class AgentService {
  modenaUrl = 'http://modena.gcba-extrimian.com:8080';
  didMethod = 'did:quarkid:matic';
  dwnUrl = 'http://ssi.gcba-extrimian.com:1337/';
  storagePath = 'storage';

  private async isAgentPresent(type: AgentType) {
    const files = await glob(`${this.storagePath}/${type}*`);
    Logger.debug(`Agent ${type} present: ${files}`, 'AgentService');
    return files.length > 0;
  }

  // Creates an agent for each type and returns their DIDDocuments in a map
  async create(agentTypes: AgentType[]) {
    const agentInfoArray = await this.initializeAgents(agentTypes);

    const resolvedAgents = await this.resolveAgents(agentInfoArray);

    return resolvedAgents;
  }

  // Returns the DIDDocument for each agent type
  async findAll() {
    Logger.debug("Finding all agents' DID Documents", 'AgentService');
    const presentAgentPromises = Object.values(AgentTypes).map((agentType) =>
      this.isAgentPresent(agentType),
    );

    const presentAgentTypes = (await Promise.all(presentAgentPromises)).reduce(
      (acc, present, index) => {
        if (present) {
          acc.push(Object.values(AgentTypes)[index]);
        }
        return acc;
      },
      [] as AgentType[],
    );

    // Initializes agents for all the present types
    const agentsMap = await this.initializeAgents(presentAgentTypes);

    const resolvedAgents = await this.resolveAgents(agentsMap);

    return resolvedAgents;
  }

  // Returns the DIDDocument for the given agent type
  async findByType(agentType: AgentType) {
    if (!(await this.isAgentPresent(agentType))) {
      throw new NotFoundException(`Agent ${agentType} not found`);
    }

    const agentsMap = await this.initializeAgents([agentType]);

    const resolvedAgents = await this.resolveAgents(agentsMap);

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

  // Core methods
  async removeAll() {
    const removalPromises = Object.values(AgentTypes).map((type) =>
      this.remove(type),
    );
    await Promise.all(removalPromises);
  }

  async initializeAgents(agentTypes?: AgentType[]): Promise<AgentInfo[]> {
    // Create all agents by default
    agentTypes = agentTypes || Object.values(AgentTypes);
    Logger.debug(`Initializing agents: ${agentTypes.join(', ')}`);

    const agents: Agent[] = [];

    const initializationPromises = agentTypes.map(async (agentType) => {
      // Create the custom transport layer
      const dwnDebugTransport = new DWNDebugTransport();

      const agent = new Agent({
        didDocumentRegistry: new AgentModenaUniversalRegistry(
          this.modenaUrl,
          this.didMethod,
        ),
        didDocumentResolver: new AgentModenaUniversalResolver(this.modenaUrl),
        vcProtocols: [waciProtocolsByType.get(agentType)],
        secureStorage: new FileSystemAgentSecureStorage({
          filepath: `${this.storagePath}/${agentType}_secure.json`,
        }),
        agentStorage: new FileSystemStorage({
          filepath: `${this.storagePath}/${agentType}.json`,
        }),
        vcStorage: new FileSystemStorage({
          filepath: `${this.storagePath}/${agentType}_vc.json`,
        }),
        supportedTransports: [dwnDebugTransport],
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

    const registeredAgents = await this.registerAgents(agentInfoArray);

    return registeredAgents;
  }

  async registerAgents(agentInfoArray: AgentInfo[]): Promise<AgentInfo[]> {
    agentInfoArray.forEach((agentInfo) => {
      if (!agentInfo.agent.identity.initialized) {
        throw new InternalServerErrorException('Agent not initialized');
      }
    });

    // Separate the agents between those that already have a DID and those that don't
    const registeredAgents: AgentInfo[] = [];
    const unregisteredAgents: AgentInfo[] = [];
    agentInfoArray.filter((agentInfo) => {
      const agentDid = agentInfo.agent.identity.getOperationalDID();
      if (!agentDid) {
        unregisteredAgents.push(agentInfo);
      } else {
        registeredAgents.push({ ...agentInfo, did: agentDid });
        Logger.debug(
          `Agent ${agentInfo.agentType} already has a DID: ${agentDid.value}`,
          'AgentService',
        );
      }
    });

    // Launch creation operation
    const didCreationPromises = unregisteredAgents.map((agentInfo) => {
      Logger.debug(
        `Creating DID for agent ${agentInfo.agentType}`,
        'AgentService',
      );
      return agentInfo.agent.identity.createNewDID({
        dwnUrl: this.dwnUrl,
      });
    });

    // Create an array of Promises that resolves when each listener receives an event
    const didCreationListeners = unregisteredAgents.map((agentInfo) => {
      return new Promise((resolve, reject) => {
        agentInfo.agent.identity.didCreated.on((args) => {
          if (!args) {
            Logger.error('Error creating DID', 'AgentService');
            reject(new InternalServerErrorException('Error creating DID'));
          }
          Logger.debug(
            `Listened for DID created for agent ${agentInfo.agentType}: ${args.did.value}`,
            'AgentService',
          );
          resolve(args.did);
        });
      });
    });

    // Wait for all Promises to resolve
    // DID creation aparently needs not be awaited, but the listeners do
    // await Promise.all(didCreationPromises);
    try {
      const didArray = (await Promise.all(didCreationListeners)) as DID[];
      // Join newly registered agents with the ones that already had a DID
      didArray.forEach((agentDid, index) => {
        registeredAgents.push({ ...unregisteredAgents[index], did: agentDid });
      });
    } catch (err) {
      Logger.error(`Error creating DID: ${err}`, 'AgentService');
      throw new InternalServerErrorException('Error creating DID');
    }

    return registeredAgents;
  }

  async resolveAgents(
    agentInfoArray: AgentInfo[],
  ): Promise<DidDocumentByType[]> {
    // Only resolve agents that have a DID
    const registeredAgents = agentInfoArray.filter(
      (agentInfo) => agentInfo.agent.identity.initialized && agentInfo.did,
    );
    // Resolve DID Documents
    const promises = registeredAgents.map((agentInfo) => {
      return agentInfo.agent.resolver.resolve(agentInfo.did);
    });

    // Wait for DID resolution
    const didDocuments = await Promise.all(promises);
    const didDocumentsByType = didDocuments.map((didDocument, index) => {
      return {
        agentType: registeredAgents[index].agentType,
        didDocument: didDocument,
      } as DidDocumentByType;
    });
    return didDocumentsByType;
  }
}
