import { AgentTypes } from 'src/agent/utils/agent-types';
import * as fs from 'fs';

export enum WaciMessageTypes {
  OobInvitation = 'https://didcomm.org/out-of-band/2.0/invitation',
  ProposeCredential = 'https://didcomm.org/issue-credential/3.0/propose-credential',
  OfferCredential = 'https://didcomm.org/issue-credential/3.0/offer-credential',
  RequestCredential = 'https://didcomm.org/issue-credential/3.0/request-credential',
  IssueCredential = 'https://didcomm.org/issue-credential/3.0/issue-credential',
  Ack = 'https://didcomm.org/issue-credential/3.0/ack',
  ProblemReport = 'https://didcomm.org/report-problem/2.0/problem-report',
}

export enum WaciGoalCodes {
  Issuance = 'streamlined-vc',
  Presentation = 'streamlined-vp',
}

export const enum WACIMessageResponseType {
  CreateThread,
  ReplyThread,
}

export function getDidByType(type: AgentTypes) {
  const json = JSON.stringify(fs.readFileSync(`storage/${type}.json`));
  const operationalDid = JSON.parse(json).operationalDid;
  return operationalDid;
}
