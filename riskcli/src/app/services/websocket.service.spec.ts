import { Injectable } from '@angular/core';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$: WebSocketSubject<any>;

  private readonly SERVER ='ws://10.200.1.4:8080';

  constructor() {
    this.socket$ = webSocket(this.SERVER);
  }


  public sendMsg(message: any) {
    this.socket$.next(message);
  }

  public getMsg(): Observable<any> {
    return this.socket$.asObservable();
  }

  public close() {
    this.socket$.complete();
  }
}
