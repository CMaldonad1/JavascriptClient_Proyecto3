import { Component, OnInit, OnDestroy, Input, ViewChild  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../services/websocket.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MapCanvasComponent } from '../map-canvas/map-canvas.component';
import { SalasComponent } from "../salas/salas.component";

export const GLOBALS = {
  token: ''
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MapCanvasComponent, ReactiveFormsModule, SalasComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.less'
})
export class LoginComponent implements OnInit, OnDestroy{
  login=false;
  token="";
  username="";
  messages: any[] = [];
  ctry='';
  //creació del login form
  logForm: FormGroup = new FormGroup({
    user: new FormControl("",[Validators.required]),
    pswd: new FormControl("",[Validators.required])
  });

  constructor(public wsService: WebsocketService ) {}
  private wsSubscription!: Subscription; //la exclamación sirve para decirle que será inicializado

  userlogin(){
    const formValue=this.logForm.value;
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
        console.info(message);
        if(message.status==200 && message.response['token']=='xx'){
          this.login=true;
          this.token=message.response['token'];
          GLOBALS.token=this.token;
          this.username=message.response['user'];
        }
        this.messages.push(message);
      }
    );
  }

  sendMessage(message:any) {
    this.wsService.sendMsg(message);
  }

  ngOnDestroy() {
    this.wsSubscription.unsubscribe();
    this.wsService.close();
    console.info("Desconectado!")
    this.login=false;
  }
}
