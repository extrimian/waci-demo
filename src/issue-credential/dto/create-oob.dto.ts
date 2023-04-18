import { DID } from '@extrimian/agent';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WaciGoalCodes {
  Issuance = 'streamlined-vc',
  Presentation = 'streamlined-vp',
}

export interface OobInvitationBody {
  body: {
    goal_code: WaciGoalCodes.Issuance;
    accept: string[];
    [key: string]: any;
  };
}
export class CreateOobInvitationDto {
  @ApiProperty({
    type: WaciGoalCodes.Issuance,
    description: 'El goalCode WACI para la invitación',
    example: WaciGoalCodes.Issuance,
  })
  goalCode: WaciGoalCodes.Issuance;

  @ApiProperty({
    type: DID,
    description: 'El DID del issuer',
    example: 'did:quarkid:matic:example.com',
  })
  senderDid: DID;

  @ApiPropertyOptional({
    type: Object,
    description: 'El cuerpo de la invitación',
  })
  body: OobInvitationBody;
}
