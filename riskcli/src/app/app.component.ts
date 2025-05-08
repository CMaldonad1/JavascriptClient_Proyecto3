import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginComponent } from '../app/login/login.component';
import { MapCanvasComponent } from '../app/map-canvas/map-canvas.component';
import { SalasComponent } from "./salas/salas.component";
import { SalaComponent } from './sala/sala.component';

@Component({ //@<name> --> es un decorador. Aplica la lógica descrita a la función
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoginComponent, MapCanvasComponent, SalasComponent], //aqui se meterán todos los componentes que necesitemos
  templateUrl: './app.component.html', //lo que vamos a renderizar
  styleUrl: './app.component.less' //lo mismo que en los estilos, puede ser externo o no
})
export class AppComponent {
  title = 'Projecte 3 - Risk';
}
