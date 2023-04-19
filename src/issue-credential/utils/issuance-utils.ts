export enum IssuanceMessageTypes {
  OobInvitation = 'https://didcomm.org/out-of-band/2.0/invitation',
  ProposeCredential = 'https://didcomm.org/issue-credential/3.0/propose-credential',
  OfferCredential = 'https://didcomm.org/issue-credential/3.0/offer-credential',
  RequestCredential = 'https://didcomm.org/issue-credential/3.0/request-credential',
  IssueCredential = 'https://didcomm.org/issue-credential/3.0/issue-credential',
  Ack = 'https://didcomm.org/issue-credential/3.0/ack',
  ProblemReport = 'https://didcomm.org/report-problem/2.0/problem-report',
}
