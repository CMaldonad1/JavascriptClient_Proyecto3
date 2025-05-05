import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GlobalService } from '../services/global.service';
import { User } from '../../class/user/user';
import { Sala } from '../../class/sala/sala';

@Component({
  selector: 'app-sala',
  imports: [CommonModule],
  templateUrl: './sala.component.html',
  styleUrl: './sala.component.less'
})
export class SalaComponent {
  constructor(
    public wsService: WebsocketService,
    public global: GlobalService
   ) {}
  private wsSubscription!: Subscription;
  jugadors: User[] = [];
  @Output() tornar = new EventEmitter<string>();
  colorchoices: any[]=["#ff0000","#00ff00","#0000ff","#ffff00","#fc7b03","#f403fc"];
  colorSelected: string[]=[];

  ngOnInit() {
    this.wsSubscription = this.wsService.canalSala().subscribe(
      (message: any) => {
        if(message.response.sala_id){
          this.global.sala.id=message.response.sala_id;
          this.afegirJugador(this.global.user);
        }else if(message.response.players ){ //si conectem a sala
          this.carregarSala(message.response.sala);
          this.carregarJugadors(message.response.players);
          this.afegirJugador(this.global.user);
        }else if(message.response.conectat){
          this.carregarJugadors(message.response.conectat)
        }else if(message.response.desconectat){
          this.desconectaJugador(message.response.desconectat.idJug)
        }
      }
    );
  }
  sendMessage(message:any) {
    this.wsService.sendMsg(message);
  }
  private carregarSala(sala:any){
    this.global.sala=new Sala(sala.id,
      sala.date,
      sala.nom,
      sala.max_players,
      sala.admin_id,
      sala.connected)
  }
  private carregarJugadors(players:any){
    for(var i=0; i< players.length;i++){
      this.afegirJugador(players[i]);
    }
  }
  private afegirJugador(jugador:any){
    var auxColor=this.colorchoices.shift();
    this.jugadors.push(new User(jugador.id, jugador.nom, auxColor))
    this.colorSelected.push(auxColor);
  }
  public desconectaJugador(id: number){
    this.jugadors=this.jugadors.filter((e)=>{
      return e.id!=id;
    })
  }
  tornarLobby(){
    this.jugadors=[];
    this.colorchoices.push(this.colorSelected);
    this.colorSelected=[];
    this.sendMessage(
      {
        action:'desconecta',
        token: this.global.token
      }
    );
    this.tornar.emit();
  }

  ngOnDestroy() {
    this.wsSubscription.unsubscribe();
  }
}
