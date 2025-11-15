import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';

import {routes} from './app.routes';
import {SonosService} from './sonos.service';
import {SonosServiceMock} from './sonos.service.mock';
import {environment} from '../environments/environment';
import {QueueService} from './queue.service';
import {QueueServiceMock} from './queue.service.mock';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: SonosService,
      useClass: environment.useMockSonosService ? SonosServiceMock : SonosService
    },
    {
      provide: QueueService,
      useClass: environment.useMockSonosService ? QueueServiceMock : QueueService
    }
  ]
};
