import { Component, OnInit, OnDestroy, Input, ViewChild  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../services/websocket.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MapCanvasComponent } from '../map-canvas/map-canvas.component';
import { SalasComponent } from "../salas/salas.component";
import { GlobalService } from '../services/global.service';
import { Router } from '@angular/router';

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
    var message = { action: 'login',
                    login: {
                      user:formValue.user,
                      password  :formValue.pswd
                    }
                  };
    this.sendMessage(message);
  }

  getCountry(ctry: any){
    // this.ctry=ctry.country+" - "+ctry.name;
    var message = { action: 'invade',
      data: {
        cntry:ctry.country
      }
    };
    this.sendMessage(message);
  }

  ngOnInit() {
    this.wsSubscription = this.wsService.canalLogin().subscribe(
      (message: any) => {
        if(message.status==200 && message.response['token']){
          this.error="";
          this.global.login=true;
          this.global.token=message.response['token'];
          this.global.user.id=message.response['id'];
          this.router.navigate(['/lobby'])
        }else{
          this.error="Usuari i/o contrasenya incorrecta";
        }
      }
    );
  }
  test(){
    this.router.navigate(['/lobby'])
  }
  sendMessage(message:any) {
    this.wsService.sendMsg(message);
  }

  ngOnDestroy() {
    this.wsSubscription.unsubscribe();
  }

  desconectar(){
    this.global.login=false;
  }
}
