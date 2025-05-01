import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';
import { GLOBALS } from '../login/login.component';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-salas',
  imports: [CommonModule],
  templateUrl: './salas.component.html',
  styleUrl: './salas.component.less'
})
export class SalasComponent {
  constructor(public wsService: WebsocketService ) {}
  private wsSubscription!: Subscription;
  messages: any[] = [];
  @Input() token='';
  //creació del formulario de creación de Sala
  formSala: FormGroup = new FormGroup({
    name: new FormControl("",[Validators.required]),
    max_players: new FormControl(2, [Validators.min(2), Validators.max(6)])
  });

  ngOnInit() {
    this.wsSubscription = this.wsService.canalLobby().subscribe(
      (message: any) => {
        console.info(message);
        this.messages.push(message);
      }
    );
    this.requestRooms();
  }
  requestRooms(){
    this.sendMessage(
      {
        action: 'lobby',
        token: GLOBALS.token
      }
    )
  }
  sendMessage(message:any) {
    this.wsService.sendMsg(message);
  }
  ngOnDestroy() {
    this.wsSubscription.unsubscribe();
    this.wsService.close();
    console.info("Desconectado!")
  }
}
