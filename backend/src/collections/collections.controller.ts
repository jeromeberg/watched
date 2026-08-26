import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import {
  AddCollectionItemDto,
  CollectionsQueryDto,
  CreateCollectionDto,
  UpdateCollectionDto,
} from './dto/collection.dto';
import { CollectionsService } from './collections.service';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(req.user.id, dto.name, dto.description);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query() query: CollectionsQueryDto) {
    return this.collectionsService.findAll(req.user.id, query.titleId);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.collectionsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collectionsService.update(req.user.id, id, dto.name, dto.description);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.collectionsService.remove(req.user.id, id);
  }

  @Post(':id/items')
  addItem(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddCollectionItemDto,
  ) {
    return this.collectionsService.addItem(req.user.id, id, dto.titleId);
  }

  @Delete(':id/items/:titleId')
  removeItem(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('titleId', ParseIntPipe) titleId: number,
  ) {
    return this.collectionsService.removeItem(req.user.id, id, titleId);
  }
}
