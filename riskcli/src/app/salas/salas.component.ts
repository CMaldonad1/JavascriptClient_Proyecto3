import { Component, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';
import { GlobalService } from '../services/global.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Sala } from '../../class/sala/sala';
import { User } from '../../class/user/user';
import { Router } from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'app-salas',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './salas.component.html',
  styleUrl: './salas.component.less'
})
export class SalasComponent {
  constructor(
    public wsService: WebsocketService,
    public global: GlobalService,
    private router: Router
  ) {}
  private wsSubscription!: Subscription;
  messages: any[] = [];
  salas: Sala[] = [];
  sliderValue: number=2;

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
        console.info(message);
        if(message.response.sala_id && !localStorage.getItem('sala')){
          this.entrarSala(message.response.sala_id)
        }else if(message.response.salas){
          message.response.salas.forEach((sala:any)=> {
            this.salas.push(new Sala(sala.id,sala.date,sala.nom,sala.max_players,-99,sala.connected))
          });
          this.messages.push(message);
        }
      }
    );
    var sala= localStorage.getItem('sala')
    if(sala){
      this.redirectSala();
    }else{
      this.requestRooms();
    }
  }

  requestRooms(){
    this.salas=[];
    this.wsService.requestRooms();
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

    this.wsService.crearSala(nom, max_players);

  }
  updateJugs(event:any){
    var valor = event.target.value;
    this.sliderValue=valor;
    this.numjugs.nativeElement.textContent=valor;
  }
  entrarSala(id:number){
    localStorage.setItem('sala', id.toString());
    this.wsService.entrarSala(id);
    this.redirectSala();
  }
  private redirectSala(){
    this.router.navigate(['/sala'])
  }
  desactivarSala(){
    this.salas=[];
    this.global.sala = new Sala();
    this.requestRooms();
  }
  desconectar(){
    localStorage.removeItem('user');
    this.global.user=new User();
    this.router.navigate([''])
  }
  ngOnDestroy() {
    this.wsSubscription.unsubscribe();
  }
}
