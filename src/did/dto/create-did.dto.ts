import { ApiProperty } from '@nestjs/swagger';

export type AgentType = 'issuer' | 'holder' | 'verifier';
export const AgentTypes: AgentType[] = ['issuer', 'holder', 'verifier'];
export class CreateDidDto {
  @ApiProperty({
    type: String,
    description: 'Puede ser issuer, holder o verifier',
  })
  agentType: AgentType;
}
