import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DidService } from './did.service';
import { AgentTypes, CreateDidDto } from './dto/create-did.dto';
import { UpdateDidDto } from './dto/update-did.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('DID Management')
@Controller('did')
export class DidController {
  constructor(private readonly didService: DidService) {}

  @Post()
  @ApiBadRequestResponse({ description: 'El tipo de agente es inválido' })
  @ApiInternalServerErrorResponse({
    description: 'Ocurrió un error inesperado creando el DID',
  })
  @ApiCreatedResponse({ description: 'El DID fue creado exitosamente' })
  async create(@Body() createDidDto: CreateDidDto) {
    if (!AgentTypes.includes(createDidDto.agentType))
      throw new BadRequestException(
        `El tipo de agente ${
          createDidDto.agentType
        } es inválido. Usar alguno de los siguientes: ${AgentTypes.join(', ')}`,
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.didService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDidDto: UpdateDidDto) {
    return this.didService.update(+id, updateDidDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.didService.remove(+id);
  }
}
