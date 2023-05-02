import { ApiProperty } from '@nestjs/swagger';
import { AgentType, AgentTypes } from '../utils/agent-types';

export class CreateByTypeDto {
  @ApiProperty({
    type: Array<AgentType>,
    description: 'El tipo de agente',
    examples: ['["holder"]', '["issuer"]', '["verifier"]'],
    example: '["issuer", "holder", "verifier"]',
  })
  types: AgentTypes[];
}
