import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { GlobalService } from '../services/global.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private global: GlobalService,
    private router: Router
  ) {}

  canActivate(): boolean {
    var userSession = localStorage.getItem('user')
    if (userSession) {
      return true;
    } else {
      this.router.navigate(['']);
      return false;
    }
  }
}
