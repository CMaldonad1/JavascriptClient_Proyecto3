import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SalasComponent } from './salas/salas.component';
import { SalaComponent } from './sala/sala.component';
import { MapCanvasComponent } from './map-canvas/map-canvas.component';
import { AuthGuard} from './guard/auth.guard'
import { DicesComponent } from './dices/dices.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'lobby', component: SalasComponent, canActivate: [AuthGuard] },
  { path: 'sala', component: SalaComponent, canActivate: [AuthGuard] },
  { path: 'game', component: MapCanvasComponent, canActivate: [AuthGuard] },
  { path: 'dices', component: DicesComponent}
];
