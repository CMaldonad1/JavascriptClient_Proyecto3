import { Injectable } from '@angular/core';
import { Sala } from '../../class/sala/sala';
import { User } from '../../class/user/user';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  login: boolean=false;
  token: string= '';
  user: User= new User();
  sala: Sala = new Sala();

  constructor() { }
}
