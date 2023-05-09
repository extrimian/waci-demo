import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Agent,
  AgentModenaUniversalRegistry,
  AgentModenaUniversalResolver,
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
import { DWNDebugTransport } from './utils/debug-transport';
import config from '../config';
import {
  IssuanceMessageTypes,
  PresentationMessageTypes,
  WaciMessageType,
} from './utils/waci-types';

export type AgentInfo = {
  agentType: AgentType;
  agent: Agent;
};

export type DidDocumentByType = {
  agentType: AgentType;
  didDocument: any;
};

@Injectable()
export class AgentService {
  modenaUrl = config.modenaUrl;
  didMethod = config.didMethod;
  dwnUrl = config.dwnUrl;
  storagePath = config.storagePath;

  async isAgentPresent(type: AgentType) {
    const files = await glob(`${this.storagePath}/${type}*`);
    Logger.debug(`Agent ${type} present`, 'AgentService');
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
    const agentInfoArray = await this.initializeAgents(presentAgentTypes);

    const resolvedAgents = await this.resolveAgents(agentInfoArray);

    return resolvedAgents;
  }

  // Returns the DIDDocument for the given agent type
  async findByType(agentType: AgentType) {
    if (!(await this.isAgentPresent(agentType))) {
      throw new NotFoundException(`Agent ${agentType} not found`);
    }

    const agentInfoArray = await this.initializeAgents([agentType]);

    const resolvedAgents = await this.resolveAgents(agentInfoArray);

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
    agentInfoArray.forEach((agentInfo) => {
      const agentDid = agentInfo.agent.identity.getOperationalDID();
      if (!agentDid) {
        unregisteredAgents.push(agentInfo);
      } else {
        registeredAgents.push(agentInfo);
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
            `DID published for ${agentInfo.agentType}: ${args.did.value}`,
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
      await Promise.all(didCreationListeners);

      // Join newly registered agents with the ones that already had a DID
      unregisteredAgents.forEach((agentInfo) => {
        registeredAgents.push(agentInfo);
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
      (agentInfo) =>
        agentInfo.agent.identity.initialized &&
        agentInfo.agent.identity.getOperationalDID(),
    );
    // Resolve DID Documents
    const promises = registeredAgents.map((agentInfo) => {
      return agentInfo.agent.resolver.resolve(
        agentInfo.agent.identity.getOperationalDID(),
      );
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

  // Verifies that the agents are initialized and that their DIDs match the ones in the request
  async verifyInitialization(
    agentData: { agentType: AgentTypes; expectedDid?: string }[],
  ): Promise<AgentInfo[]> {
    enum TranslatedAgentTypes {
      issuer = 'emisor',
      holder = 'receptor',
      verifier = 'verificador',
    }

    agentData.forEach((data) => {
      if (!this.isAgentPresent(data.agentType)) {
        Logger.error(`${data.agentType} agent not initialized`, 'AgentService');
        throw new NotFoundException(
          `El agente ${
            TranslatedAgentTypes[data.agentType]
          } no fue inicializado`,
        );
      }
    });

    const agentTypes = agentData.map((data) => data.agentType);
    const agentInfoArray = await this.initializeAgents(agentTypes);

    // Check that the DIDs match the ones in the request, if given
    agentInfoArray.forEach((agentInfo, index) => {
      if (
        agentData[index].expectedDid &&
        agentInfo.agent.identity.getOperationalDID().value !==
          agentData[index].expectedDid
      ) {
        Logger.error(
          `${agentInfo.agentType} agent DID does not match the one in the request`,
          'AgentService',
        );
        throw new BadRequestException(
          `El DID del agente ${
            TranslatedAgentTypes[agentData[index].agentType]
          } no coincide con el dado`,
        );
      }
    });

    return agentInfoArray;
  }
  async findMessageByType(
    messageType: WaciMessageType,
    threadId: string,
  ): Promise<any> {
    // Get the message thread from the correct agent's WACI storage
    const waciStorage = await this.getWaciStorage(messageType, threadId);

    // Propose credential is a special case, because the threadId is the id of the invitation, stored as thid
    if (
      messageType === IssuanceMessageTypes.ProposeCredential ||
      messageType === PresentationMessageTypes.ProposePresentation
    ) {
      // If I'm looking for a proposal, I need to find the proposal with the same pthid as the threadId (the id of the invitation)
      // The same pthid can lead to many proposals, so I want the last one
      const lastThread = Object.values(waciStorage).pop() as any[];
      const result = lastThread
        .filter(
          (message: any) =>
            message.type === IssuanceMessageTypes.ProposeCredential &&
            message.pthid === threadId,
        )
        .pop();

      return result;
    }

    // ThreadId is the id of the proposal
    const result = waciStorage[threadId]?.find(
      (message) => message.type === messageType,
    );

    return result;
  }

  private async getWaciStorage(
    messageType: WaciMessageType,
    threadId: string,
  ): Promise<any> {
    const agentType = this.getAgentType(messageType);
    const filePath = `${this.storagePath}/${agentType}-waci-storage.json`;
    try {
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent) as JSON;
    } catch (err) {
      // handle file reading or parsing errors
      Logger.error(
        `Error searching for message in ${agentType}'s storage, thread ${threadId}: ${err}`,
        'IssueCredentialService',
      );

      throw new InternalServerErrorException(
        'Hubo un error buscando el mensaje en el almacenamiento interno',
      );
    }
  }

  private getAgentType(messageType: WaciMessageType) {
    switch (messageType) {
      // Issuance flow
      case IssuanceMessageTypes.ProposeCredential:
        return AgentTypes.issuer;
      case IssuanceMessageTypes.OfferCredential:
        return AgentTypes.issuer;
      case IssuanceMessageTypes.RequestCredential:
        return AgentTypes.issuer;
      case IssuanceMessageTypes.IssueCredential:
        return AgentTypes.issuer;
      case IssuanceMessageTypes.Ack:
        return AgentTypes.holder;

      // Presentation flow
      case PresentationMessageTypes.ProposePresentation:
        return AgentTypes.verifier;
      case PresentationMessageTypes.RequestPresentation:
        return AgentTypes.verifier;
      case PresentationMessageTypes.PresentProof:
        return AgentTypes.holder;
      case PresentationMessageTypes.Ack:
        return AgentTypes.verifier; //TODO: Check this with a complete verification exchange

      default:
        throw new Error(
          `Cannot decide agent type for message type ${messageType}`,
        );
    }
  }
}
