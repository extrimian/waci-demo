import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentType, AgentTypes, CreateAgentDto } from './dto/create-agent.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Agent Management')
@Controller('agent')
export class AgentController {
  constructor(private readonly didService: AgentService) {}

  @Post()
  @ApiBadRequestResponse({ description: 'El tipo de agente es inválido' })
  @ApiInternalServerErrorResponse({
    description: 'Ocurrió un error inesperado creando el DID',
  })
  @ApiCreatedResponse({ description: 'El DID fue creado exitosamente' })
  async create(@Body() createDidDto: CreateAgentDto) {
    if (createDidDto.agentType && !AgentTypes[createDidDto.agentType])
      throw new BadRequestException(
        `El tipo de agente ${
          createDidDto.agentType
        } es inválido. Usar alguno de los siguientes: ${Object.values(
          AgentTypes,
        ).join(', ')}`,
      );
    try {
      const agentDid = await this.didService.create(createDidDto);
      return { did: agentDid };
    } catch (error) {
      throw new InternalServerErrorException(
        'Ocurrió un error inseperado creando el DID',
        error,
      );
    }
  }

  @Get()
  findAll() {
    return this.didService.findAll();
  }

  @Get(':type')
  findOne(@Param('type') type: AgentType) {
    if (!AgentTypes[type])
      throw new BadRequestException(
        `El tipo de agente ${type} es inválido. Usar alguno de los siguientes: ${Object.values(
          AgentTypes,
        ).join(', ')}`,
      );

    return this.didService.findOne(type);
  }

  @Delete(':type')
  remove(@Param('type') type: AgentType) {
    if (!AgentTypes[type])
      throw new BadRequestException(
        `El tipo de agente ${type} es inválido. Usar alguno de los siguientes: ${Object.values(
          AgentTypes,
        ).join(', ')}`,
      );
    return this.didService.remove(type);
  }
}
