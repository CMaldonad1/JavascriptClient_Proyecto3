import { Injectable } from '@angular/core';
import { Sala } from '../../class/sala/sala';
import { User } from '../../class/user/user';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  user: User= new User();
  sala: Sala = new Sala();
  partida: boolean=false;
  jugadors: User[] = [];
  activePlayer: User = new User();

  constructor(){
    const userData = localStorage.getItem('user');
    this.user = userData ? User.fromJSON(JSON.parse(userData)) : new User();
  }

}
