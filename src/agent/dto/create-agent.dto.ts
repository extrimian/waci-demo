import { ApiProperty } from '@nestjs/swagger';

export type AgentType = 'issuer' | 'holder' | 'verifier';
export enum AgentTypes {
  issuer = 'issuer',
  holder = 'holder',
  verifier = 'verifier',
}
export class CreateAgentDto {
  @ApiProperty({
    type: String,
    description: 'Puede ser issuer, holder o verifier.',
    enum: AgentTypes,
    example: 'issuer',
  })
  agentType: AgentType;
}
