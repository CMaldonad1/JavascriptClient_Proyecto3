import { Component, Input, EventEmitter,ElementRef, Output,ViewChild, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';
import { GlobalService } from '../services/global.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SalaComponent } from "../sala/sala.component";
import { Sala } from '../../class/sala/sala';

declare var bootstrap: any;

@Component({
  selector: 'app-salas',
  imports: [CommonModule, SalaComponent, ReactiveFormsModule],
  templateUrl: './salas.component.html',
  styleUrl: './salas.component.less'
})
export class SalasComponent {
  constructor(
    public wsService: WebsocketService,
    public global: GlobalService
  ) {}
  private wsSubscription!: Subscription;
  messages: any[] = [];
  salas: Sala[] = [];
  sliderValue: number=2;

  @Output() logoff= new EventEmitter<boolean>();
  @Input() username!: string;
  @ViewChild('jugs') numjugs!: ElementRef<HTMLParagraphElement>;
  @ViewChild('modal') modal!: ElementRef<HTMLParagraphElement>;
  //creació del formulario de creación de Sala
  formSala: FormGroup = new FormGroup({
    name: new FormControl("",[Validators.required]),
    max_players: new FormControl(2, [Validators.min(2), Validators.max(6)])
  });

  ngOnInit() {
    this.wsSubscription = this.wsService.canalLobby().subscribe(
      (message: any) => {
        if(message.response.sala_id){
          this.entrarSala(message.response.sala_id)
        }else if(message.response.salas){
          message.response.salas.forEach((sala:any)=> {
            this.salas.push(new Sala(sala.id,sala.date,sala.nom,sala.max_players,-99,sala.connected))
          });
          this.messages.push(message);
        }
      }
    );
    this.requestRooms();
  }
  sendMessage(message:any) {
    this.wsService.sendMsg(message);
  }
  requestRooms(){
    this.salas=[];
    this.sendMessage(
      {
        action: 'lobby',
        token: this.global.token
      }
    )
  }
  private hideModal(){
    document.body.classList.remove('modal-open');
    var modalElement = this.modal.nativeElement;
    var modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modalInstance.hide();
  }
  crearSala(){
    this.hideModal();
    var formValue=this.formSala.value;
    var nom=formValue.name;
    var max_players = formValue.max_players;

    this.global.sala.nom=nom;
    this.global.sala.connected=1;
    this.global.sala.max_players=max_players;
    this.global.sala.admin_id=this.global.user.id;
    this.sendMessage(
      {
        action:'create',
        token: this.global.token,
        info:{
          nom: nom,
          max_players: max_players
        }
      }
    );
    this.global.sala.id=0;
  }
  updateJugs(event:any){
    var valor = event.target.value;
    this.sliderValue=valor;
    this.numjugs.nativeElement.textContent=valor;
  }
  entrarSala(id:number){
    this.global.sala.id=id;
    this.sendMessage(
      {
        action:'join',
        token: this.global.token,
        info:{
          sala:this.global.sala.id
        }
      }
    );
  }
  desactivarSala(){
    this.salas=[];
    this.global.sala = new Sala();
    this.requestRooms();
  }
  desconectar(){
    this.logoff.emit(false);
  }
  ngOnDestroy() {
    this.wsSubscription.unsubscribe();
  }
}
