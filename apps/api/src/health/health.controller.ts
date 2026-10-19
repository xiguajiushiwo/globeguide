import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check API availability' })
  @ApiOkResponse({
    schema: {
      example: { status: 'ok', version: '0.1.0', requestId: 'request-id' },
    },
  })
  getHealth(): { status: 'ok'; version: string; requestId: string } {
    return {
      status: 'ok',
      version: '0.1.0',
      requestId: 'response-header',
    };
  }
}
