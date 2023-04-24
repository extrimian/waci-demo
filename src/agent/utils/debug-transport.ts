import {
  DWNClient,
  SendMessageParams,
  ThreadMethod,
} from '@extrimian/dwn-client';
import { Agent, IAgentResolver } from '@extrimian/agent';
import {
  ITransport,
  MessageArrivedEventArg,
  TransportSendRequest,
} from '@extrimian/agent/src/models/transports/transport';
import { DWNMessage, MessageStorage } from '@extrimian/dwn-client';
import { DIDDocument, DIDDocumentUtils } from '@extrimian/did-core';
import { DID } from '@extrimian/agent';
import { Logger } from '@nestjs/common';

export class DWNDebugTransport implements ITransport {
  private readonly onMessageArrived = new LiteEvent<MessageArrivedEventArg>();
  public get messageArrived(): ILiteEvent<MessageArrivedEventArg> {
    return this.onMessageArrived.expose();
  }

  dwnClientMap: Map<string, DWNClient> = new Map();
  agent: Agent;
  private resolver: IAgentResolver;

  dwnPollMilliseconds: number;

  constructor(params?: { dwnPollMilliseconds: number }) {
    this.dwnPollMilliseconds = params?.dwnPollMilliseconds || 10000;
  }

  public async transportSupportedByTarget(params: {
    targetDID: DID;
  }): Promise<boolean> {
    const targetDidDocument = await this.resolver.resolve(params.targetDID);
    const dwnUrl = await DIDDocumentUtils.getServiceUrl(
      targetDidDocument,
      'DecentralizedWebNode',
      'nodes',
    )[0];

    return dwnUrl != null;
  }

  async processNewDID(did: DID) {
    if (this.dwnClientMap.get(did.value)) return;

    const didDocument = await this.resolver.resolve(did);
    let dwnClient: DWNClient;

    try {
      const dwnEndpoint = this.getServiceUrl(
        didDocument,
        'DecentralizedWebNode',
        'nodes',
      );

      if (!dwnEndpoint) return;

      dwnClient = new DWNClient({
        did: did.value,
        storage: inMemoryMessageStorage,
        inboxURL: dwnEndpoint[0],
      });
    } catch (ex) {
      console.error(
        'An error occurred while polling for the DWN: DIDDocument has not a DWN service defined or it is not correct',
      );
      return;
    }

    this.dwnClientMap.set(did.value, dwnClient);

    dwnClient.addSubscriber(async (messages: DWNMessage[]) => {
      messages.forEach((message) => {
        //Los mensajes de DIDComm en el DWN vienen con caracteres extraños y no permiten JSON.parsear el string si no se remueven esos caracteres.

        let messageManagerCompatible = false;
        if (message.data.message) {
          message.data = JSON.parse(message.data.message);
          messageManagerCompatible = true;
        }

        if (
          typeof message.data === 'string' &&
          message.data.indexOf('{') != 0 &&
          message.data.indexOf('"header":{"alg":"ECDH-1PU') > -1
        ) {
          message.data = message.data.substring(
            message.data.indexOf('{'),
            message.data.lastIndexOf('}') + 1,
          );
        }

        this.onMessageArrived.trigger({
          from: null,
          // from: messages[0].data?.message?.from,
          data: message.data,
          context: { ...message, messageManagerCompatible },
        });
      });
    });
    this.pollDwn(dwnClient);
  }

  public async initialize(params: any) {
    this.agent = params.agent;
    this.resolver = this.agent.resolver;

    const dids = this.agent.identity.getDIDs();

    for (const did of dids) {
      this.processNewDID(DID.from(did));
    }

    this.agent.identity.didCreated.on((args) => {
      this.processNewDID(args.did);
    });
  }

  public async send(params: TransportSendRequest): Promise<void> {
    const targetDidDocument = await this.resolver.resolve(params.to);
    const dwnUrl = await DIDDocumentUtils.getServiceUrl(
      targetDidDocument,
      'DecentralizedWebNode',
      'nodes',
    )[0];

    const msgParams: SendMessageParams = {
      targetDID: params.to.value,
      targetInboxURL: dwnUrl,
      message: {
        data: params.context?.messageManagerCompatible
          ? { message: JSON.stringify(params.data) }
          : params.data,
        descriptor: {
          method: undefined,
          dateCreated: new Date(),
          dataFormat: 'application/json',
        },
      },
    };

    if (!params.context?.descriptor?.method) {
      msgParams.message.descriptor.method = ThreadMethod.Create;
    } else {
      msgParams.message.descriptor.method = ThreadMethod.Reply;

      msgParams.message.descriptor.root =
        params.context.descriptor.root || params.context.descriptor.objectId;
      msgParams.message.descriptor.parent = params.context.descriptor.objectId;
    }

    Logger.log(`Sending message to DWN: ${msgParams}`, 'DWNDebugTransport');

    await this.dwnClientMap
      .get(this.agent.identity.getOperationalDID().value)
      .sendMessage(msgParams)
      .catch(console.error);
  }

  pollDwn(dwnClient: DWNClient) {
    setInterval(async () => {
      await dwnClient.pullNewMessages();
    }, this.dwnPollMilliseconds);

    dwnClient.pullNewMessages();
  }

  getServiceUrl(
    didDocument: DIDDocument,
    serviceType: string,
    serviceEndpointMapKey?: string,
  ): string[] {
    try {
      const service = didDocument.service?.find(
        (service) => service.type === serviceType,
      );

      if (!service) return null;

      if (typeof service.serviceEndpoint === 'object')
        return service.serviceEndpoint[serviceEndpointMapKey];
      return [service.serviceEndpoint];
    } catch (error) {
      console.error(error);
      throw Error(`Error finding ${serviceType} service in DID Document`);
    }
  }
}

const messagesStorage: DWNMessage[] = [];
let lastPullDate: Date;

export const inMemoryMessageStorage: MessageStorage = {
  async getMessages(): Promise<DWNMessage[]> {
    return messagesStorage;
  },
  async getLastPullDate(): Promise<Date> {
    return lastPullDate;
  },
  async updateLastPullDate(date: Date): Promise<void> {
    lastPullDate = date;
  },
  async saveMessages(messages: DWNMessage[]): Promise<void> {
    messagesStorage.push(...messages);
  },
};

export interface ILiteEvent<T> {
  on(handler: { (data?: T): void }): void;
  off(handler: { (data?: T): void }): void;
}

export class LiteEvent<T> implements ILiteEvent<T> {
  private handlers: { (data?: T): void }[] = [];

  public on(handler: { (data?: T): void }): void {
    this.handlers.push(handler);
  }

  public off(handler: { (data?: T): void }): void {
    this.handlers = this.handlers.filter((h) => h !== handler);
  }

  public trigger(data?: T) {
    this.handlers.slice(0).forEach((h) => h(data));
  }

  public expose(): ILiteEvent<T> {
    return this;
  }
}
