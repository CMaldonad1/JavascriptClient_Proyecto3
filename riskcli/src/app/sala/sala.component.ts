import { Component, Input, Output, EventEmitter,ElementRef,ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GlobalService } from '../services/global.service';
import { User } from '../../class/user/user';
import { Sala } from '../../class/sala/sala';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sala',
  imports: [CommonModule],
  templateUrl: './sala.component.html',
  styleUrl: './sala.component.less'
})
export class SalaComponent {
  constructor(
    public wsService: WebsocketService,
    public global: GlobalService,
    private router: Router
  ) {}
  private wsSubscription!: Subscription;

  colorchoices: any[]=["#fa0000d9","#00b200d9","#0000ffd9","#fa6400d9","#c800ffd9","#645000d9"];

  ngOnInit() {
    this.wsSubscription = this.wsService.canalSala().subscribe(
      (message: any) => {
        console.info(message);
        if(message.response.players && message.response.sala){
          this.carregarSala(message.response.sala);
          this.infoJugadors(message.response.players);
        }else if(message.response.players){
          this.infoJugadors(message.response.players);
        }else if(message.response.desconectat){
          this.desconectaJugador(message.response.desconectat.idJug);
        }else if(message.response.start=='1'){
          this.global.partida=true;
          this.router.navigate(['/game'])
        }else if(message.response.left){
          localStorage.removeItem('sala');
          this.router.navigate(['/lobby'])
        }
      }
    );
    var sala= localStorage.getItem('sala')
    if(sala){
      this.wsService.entrarSala(Number(sala));
    }else{
      this.router.navigate(['/lobby']);
    }
  }
  sendMessage(message:any) {
    this.wsService.sendMsg(message);
  }
  private carregarSala(sala:any){
    this.global.sala=new Sala(
      sala.id,
      sala.date,
      sala.nom,
      sala.max_players,
      sala.admin_id)
  }
  private infoJugadors(players: any){
    this.carregarJugadors(players);
    this.global.sala.connected=players.length
  }
  private carregarJugadors(players:any){
    this.global.jugadors.length=0
    for(var i=0; i< players.length;i++){
      this.afegirJugador(players[i], i);
    }
  }
  private afegirJugador(jugador:any, i:number){
    this.global.jugadors.push(new User(jugador.nom, jugador.id, "",this.colorchoices[i]))
  }

  iniciarPartida(){
    this.wsService.startGame();
  }

  public desconectaJugador(id: number){
    this.global.jugadors=this.global.jugadors.filter((e)=>{
      return e.id!=id;
    })
  }
  tornarLobby(){
    this.global.jugadors=[];
    this.wsService.tornarLobby()
  }

  ngOnDestroy() {
    this.wsSubscription.unsubscribe();
  }
}
