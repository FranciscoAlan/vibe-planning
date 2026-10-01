import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthModule } from './health/health.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { DirectoryModule } from './modules/directory/directory.module.js';
import { BookingModule } from './modules/booking/booking.module.js';
import { FinanceModule } from './modules/finance/finance.module.js';
import { SearchModule } from './modules/search/search.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { TenantMiddleware } from './common/middleware/tenant.middleware.js';

@Module({
  imports: [
    HealthModule,
    IdentityModule,
    DirectoryModule,
    BookingModule,
    FinanceModule,
    SearchModule,
    ChatModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
