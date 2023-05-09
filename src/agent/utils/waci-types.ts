export enum IssuanceMessageTypes {
  OobInvitation = 'https://didcomm.org/out-of-band/2.0/invitation',
  ProposeCredential = 'https://didcomm.org/issue-credential/3.0/propose-credential',
  OfferCredential = 'https://didcomm.org/issue-credential/3.0/offer-credential',
  RequestCredential = 'https://didcomm.org/issue-credential/3.0/request-credential',
  IssueCredential = 'https://didcomm.org/issue-credential/3.0/issue-credential',
  Ack = 'https://didcomm.org/issue-credential/3.0/ack',
  ProblemReport = 'https://didcomm.org/report-problem/2.0/problem-report',
}

export enum PresentationMessageTypes {
  Invitation = 'https://didcomm.org/out-of-band/2.0/invitation',
  ProposePresentation = 'https://didcomm.org/present-proof/3.0/propose-presentation',
  RequestPresentation = 'https://didcomm.org/present-proof/3.0/request-presentation',
  PresentProof = 'https://didcomm.org/present-proof/3.0/presentation',
  Ack = 'https://didcomm.org/present-proof/3.0/ack',
}

export type WaciMessageType = IssuanceMessageTypes | PresentationMessageTypes;

export enum WaciGoalCodes {
  Presentation = 'streamlined-vp',
  Issuance = 'streamlined-vc',
}
