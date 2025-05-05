import { Injectable } from '@angular/core';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  //My server
  private readonly SERVER ='ws://localhost:8765';
  //JA Server
  // private readonly SERVER ='ws://10.200.1.4:8080';

  private socket$: WebSocketSubject<any> = webSocket(this.SERVER);
  private readonly reconInter = 5000; //5seg per reconectar

  private canalLogin$ = new Subject<any>();
  private canalLobby$ = new Subject<any>();
  private canalSala$ = new Subject<any>();

  constructor() {
    this.socket$.subscribe(msg => {
      console.info(msg);
      if ( msg.response['token'] || msg.status== 419 ) this.canalLogin$.next(msg);
      if ( msg.response['salas'] ) this.canalLobby$.next(msg);
      if ( msg.response['sala'] || msg.response['sala_id'] ) this.canalSala$.next(msg);
    });
  }

  public sendMsg(message: any) {
    this.socket$.next(message);
  }

  public canalLogin(): Observable<any> {
    return this.canalLogin$.asObservable();
  }

  public canalLobby(): Observable<any> {
    return this.canalLobby$.asObservable();
  }

  public canalSala(): Observable<any> {
    return this.canalSala$.asObservable();
  }

  public getMsg(): Observable<any> {
    return this.socket$.asObservable();
  }

  public close() {
    this.socket$.complete();
    console.info("Desconectado!")
  }
}
