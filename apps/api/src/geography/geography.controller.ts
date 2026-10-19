import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { GeographyService } from './geography.service.js';

@ApiTags('places')
@Controller('places')
export class GeographyController {
  constructor(private readonly geography: GeographyService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search globally addressable places' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'locale', required: false, type: String })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  search(
    @Query('q') query: string,
    @Query('locale') locale?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.geography.searchPlaces(query, locale ?? 'en', cursor);
  }

  @Get(':placeId')
  @ApiOperation({ summary: 'Get a localized place summary' })
  getPlace(
    @Param('placeId') placeId: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.geography.getPlace(placeId, acceptLanguage?.split(',')[0] ?? 'en');
  }
}
