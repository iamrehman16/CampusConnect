import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  Req,
  Query,
} from '@nestjs/common';
import * as express from 'express';
import { ResourceService } from './resource.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceByContributorDto } from './dto/update-resource.dto';
import { Public } from '../auth/decorators/public.decorator';
import { ParseMongoIdPipe } from '../../common/pipes/is-mongo-id.pipe';
import { Role } from '../auth/decorators/role.decorator';
import { Roles } from '../user/enums/user-role.enum';
import { ResourceQueryDto } from './dto/resource-query.dto';
import { CurrentUser } from '../auth/types/current-user';
import { ApprovalStatus } from './enums/approval-status.enum';
import { RequestUploadSignatureDto } from './dto/request-upload-signature.dto';

@Controller('resources')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  // Contributor requests a signature before uploading directly to Cloudinary
  @Role(Roles.ADMIN, Roles.CONTRIBUTOR)
  @Post('upload-signature')
  requestUploadSignature(
    @Body() dto: RequestUploadSignatureDto,
    @Req() req: { user: CurrentUser },
  ) {
    return this.resourceService.generateUploadSignature(
      dto.mimetype,
      req.user.id,
    );
  }

  // Both roles submit resource metadata + Cloudinary upload result
  // No Multer — no file touches this server
  @Role(Roles.ADMIN, Roles.CONTRIBUTOR)
  @Post()
  create(@Body() dto: CreateResourceDto, @Req() req: { user: CurrentUser }) {
    return this.resourceService.create(dto, req.user.id);
  }

  @Public()
  @Get()
  findAll(@Query() query: ResourceQueryDto) {
    query.status = ApprovalStatus.APPROVED;
    return this.resourceService.findAll(query);
  }

  @Get('my')
  @Role(Roles.CONTRIBUTOR, Roles.ADMIN)
  getMyResources(
    @Query() query: ResourceQueryDto,
    @Req() req: { user: CurrentUser },
  ) {
    query.uploadedBy = req.user.id;
    return this.resourceService.findAll(query);
  }

  @Role(Roles.ADMIN, Roles.CONTRIBUTOR, Roles.STUDENT)
  @Get('user/:id')
  getResourcesByUser(
    @Query() query: ResourceQueryDto,
    @Param('id') id: string,
    @Req() req: { user: CurrentUser },
  ) {
    query.uploadedBy = id;
    // Pending/rejected uploads (and rejection reasons) are visible only to
    // their uploader and admins; everyone else sees approved ones, same as
    // the public list. `status` used to pass straight through.
    const canSeeUnapproved =
      req.user.id === id || req.user.role === Roles.ADMIN;
    if (!canSeeUnapproved) query.status = ApprovalStatus.APPROVED;
    return this.resourceService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseMongoIdPipe) id: string) {
    return this.resourceService.findOne(id);
  }

  @Public()
  @Get(':id/download')
  async download(
    @Param('id', ParseMongoIdPipe) id: string,
    @Res() res: express.Response,
  ) {
    const url = await this.resourceService.getDownloadUrl(id);
    return res.json({ url }); // was missing res.json — bare return won't send with @Res()
  }

  @Patch(':id')
  @Role(Roles.CONTRIBUTOR, Roles.ADMIN)
  update(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() dto: UpdateResourceByContributorDto,
    @Req() req: { user: CurrentUser },
  ) {
    const isAdmin = req.user.role === Roles.ADMIN;
    return this.resourceService.update(id, dto, req.user.id, isAdmin);
  }

  @Delete(':id')
  @Role(Roles.CONTRIBUTOR, Roles.ADMIN)
  remove(
    @Param('id', ParseMongoIdPipe) id: string,
    @Req() req: { user: CurrentUser },
  ) {
    const isAdmin = req.user.role === Roles.ADMIN;
    return this.resourceService.remove(id, req.user.id, isAdmin);
  }
}
