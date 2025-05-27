import { Component, OnInit, OnDestroy, Input, ViewChild  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../services/websocket.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MapCanvasComponent } from '../map-canvas/map-canvas.component';
import { SalasComponent } from "../salas/salas.component";
import { GlobalService } from '../services/global.service';
import { Router } from '@angular/router';
import { User } from '../../class/user/user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MapCanvasComponent, ReactiveFormsModule, SalasComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.less'
})
export class LoginComponent implements OnInit, OnDestroy{
  constructor(
    public wsService: WebsocketService,
    public global: GlobalService,
    private router: Router
  ) {}
  private wsSubscription!: Subscription;

  error="";
  messages: any[] = [];
  ctry='';

  //creació del login form
  logForm: FormGroup = new FormGroup({
    user: new FormControl("",[Validators.required]),
    pswd: new FormControl("",[Validators.required])
  });

  userlogin(){
    var formValue=this.logForm.value;
    this.global.user.nom=formValue.user
    this.wsService.login(formValue.user, formValue.pswd)
  }

  ngOnInit() {
    this.wsSubscription = this.wsService.canalLogin().subscribe(
      (message: any) => {
        if(message.status==200 && message.response['token']){
          this.error="";
          this.global.user.token=message.response['token'];
          this.global.user.id=message.response['id'];
          // this.global.user.wins=message.response['user'].wins;
          // this.global.user.games=message.response['user'].games;
          localStorage.setItem('user', JSON.stringify(this.global.user.toJSON()));
          this.goToLobby()
        }else{
          this.error="Usuari i/o contrasenya incorrecta";
        }
      }
    );
    var userSession = localStorage.getItem('user')
    if(userSession){
      const user = JSON.parse(userSession);
      this.global.user = User.fromJSON(user);
      this.goToLobby()
    }
  }
  private goToLobby(){
    this.router.navigate(['/lobby'])
  }

  ngOnDestroy() {
    this.wsSubscription.unsubscribe();
  }

}
