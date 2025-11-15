import {Injectable} from '@angular/core';
import {environment} from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiBaseUrlService {
  private baseUrl: string | undefined = undefined;

  public getApiBaseUrl(): string {
    if (!this.baseUrl) {
      console.log("window.location.hostname=" + window.location.hostname);
      if (window.location.hostname.startsWith('relay-')) {
        console.log("evaluate token window.location.pathname=" + window.location.pathname);
        const match = window.location.pathname.match(/^\/([^\/]+)\//);
        if (match) {
          const token = match[1].trim();
          console.log("token=", token);
          this.baseUrl = `/${token}${environment.apiBaseUrl}`;
        } else {
          this.baseUrl = environment.apiBaseUrl;
        }
      } else if (window.location.hostname.startsWith('asustor')) {
        console.log("as environment.apiBaseUrl=", environment.apiBaseUrl);
        this.baseUrl = environment.apiBaseUrl.replace('www/', '');
        console.log("as this.baseUrl=", this.baseUrl);
      } else {
        console.log("else");
        this.baseUrl = environment.apiBaseUrl;
      }
    }
    console.log("this.baseUrl=", this.baseUrl);
    return this.baseUrl;
  }
}

