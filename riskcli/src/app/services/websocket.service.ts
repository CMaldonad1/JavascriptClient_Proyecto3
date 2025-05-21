import { Injectable } from '@angular/core';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { Observable, Subject } from 'rxjs';
import { GlobalService } from '../services/global.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  //My server
  private readonly SERVER ='ws://localhost:8765';
  //JA Server
  // private readonly SERVER ='ws://localhost:8080';
  // private readonly SERVER ='ws://10.200.1.4:8080';

  private socket$: WebSocketSubject<any> = webSocket(this.SERVER);
  private readonly reconInter = 5000; //5seg per reconectar

  private canalLogin$ = new Subject<any>();
  private canalLobby$ = new Subject<any>();
  private canalSala$ = new Subject<any>();
  private canalPartida$ = new Subject<any>();

  constructor(public global: GlobalService) {
    this.socket$.subscribe(msg => {
      if ( msg.response['token'] || msg.status== 419 ) this.canalLogin$.next(msg);
      if ( msg.response['salas'] || msg.response['sala_id']) this.canalLobby$.next(msg);
      if ( msg.response['sala']  || msg.response['players'] || msg.response['start'] || msg.response['left']) this.canalSala$.next(msg);
      if ( msg.response['fase'] || msg.response['countries'] || msg.response['surrender'])  this.canalPartida$.next(msg);
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
  public requestRooms(){
    this.sendMsg({
        action: 'lobby',
        token: this.global.user.token
      })
  }
  public tornarLobby(){
    this.sendMsg({
        action:'leave_sala',
        token: this.global.user.token,
        info:{
          sala: this.global.sala.id
        }
      });
  }
  public entrarSala(id: Number){
    this.sendMsg({
      action:'join',
      token: this.global.user.token,
      info:{
        sala:id
      }
    });
  }
  public crearSala(nom: string, max_players:any){
    this.sendMsg({
      action:'create',
      token: this.global.user.token,
      info:{
        nom: nom,
        max_players: max_players
      }
    });
  }
  public startGame(){
    this.sendMsg({
        action:'start_match',
        token: this.global.user.token,
        info:{
          sala:this.global.sala.id,
        }
      });
  }
  public surrenderGame(){
    this.sendMsg({
      action:'surrender',
      token: this.global.user.token,
      info:{
        sala:this.global.sala.id
      }
    });
  }
  public placeTroop(cntry:string){
    this.sendMsg({
      action:'deploy',
      token: this.global.user.token,
      info:{
        sala: this.global.sala.id,
        country:cntry
      }
    })
  }
  public deployCombat(countries:any){
    this.sendMsg({
      action:'deploy_combat',
      token: this.global.user.token,
      info:{
        sala: this.global.sala.id,
        deploy:countries
      }
    })
  }
  public invadeCountry(attacker:string, troops:number, defensor:string){
    this.sendMsg({
      action:'invade',
      token: this.global.user.token,
      info:{
        sala: this.global.sala.id,
        attacker:attacker,
        troops:troops,
        defensor:defensor
      }
    })
  }
  public reinforce(from:string, to:string, troops:number){
    this.sendMsg({
      action:'reinforce',
      token: this.global.user.token,
      info:{
        sala:this.global.sala.id,
        from:from,
        to:to,
        troops:troops
      }
    })
  }
  public endPhase(){
    this.sendMsg({
      action:'next_phase',
      token: this.global.user.token,
      info:{
        sala: this.global.sala.id,
      }
    })
  }
  public test(){
    this.sendMsg({
      action:'test',
    })
  }
  public close() {
    this.socket$.complete();
    console.info("Desconectado!")
  }
}
