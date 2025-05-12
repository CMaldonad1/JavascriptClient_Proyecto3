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
  private canalPartida$ = new Subject<any>();

  constructor() {
    this.socket$.subscribe(msg => {
      console.info(msg);
      if ( msg.response['token'] || msg.status== 419 ) this.canalLogin$.next(msg);
      if ( msg.response['salas'] || msg.response['sala_id']) this.canalLobby$.next(msg);
      if ( msg.response['sala']  || msg.response['players'] || msg.response['start'] || msg.response['left']) this.canalSala$.next(msg);
      if ( msg.response['deployment'] || msg.response['countries'] || msg.response['surrender'])  this.canalPartida$.next(msg);
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

  public canalPartida(): Observable<any> {
    return this.canalPartida$.asObservable();
  }

  public getMsg(): Observable<any> {
    return this.socket$.asObservable();
  }
  public login(user:string, pswd:string){
    this.sendMsg({
      action: 'login',
      login: {
        user:user,
        password:pswd
      }
    })
  }
  public requestRooms(token:string){
    this.sendMsg({
        action: 'lobby',
        token: token
      })
  }
  public tornarLobby(token:string, salaid: number){
    this.sendMsg({
        action:'leave_sala',
        token: token,
        info:{
          sala: salaid
        }
      });
  }
  public entrarSala(token:string, id: Number){
    this.sendMsg({
      action:'join',
      token: token,
      info:{
        sala:id
      }
    });
  }
  public crearSala(token:string, nom: string, max_players:any){
    this.sendMsg({
      action:'create',
      token: token,
      info:{
        nom: nom,
        max_players: max_players
      }
    });
  }
  public startGame(token:string){
    this.sendMsg({
        action:'iniciar_partida',
        token: token
      });
  }
  public surrenderGame(token:string, id:Number){
    this.sendMsg({
      action:'surrender',
      token: token,
      info:{
        sala:id
      }
    });
  }
  public close() {
    this.socket$.complete();
    console.info("Desconectado!")
  }
}
