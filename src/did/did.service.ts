import { Injectable } from '@nestjs/common';
import { CreateDidDto } from './dto/create-did.dto';
import { UpdateDidDto } from './dto/update-did.dto';

@Injectable()
export class DidService {
  create(createDidDto: CreateDidDto) {
    return 'This action adds a new did';
  }

  findAll() {
    return `This action returns all did`;
  }

  findOne(id: number) {
    return `This action returns a #${id} did`;
  }

  update(id: number, updateDidDto: UpdateDidDto) {
    return `This action updates a #${id} did`;
  }

  remove(id: number) {
    return `This action removes a #${id} did`;
  }
}
