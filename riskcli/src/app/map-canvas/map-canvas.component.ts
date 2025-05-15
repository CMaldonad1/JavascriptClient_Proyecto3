import { Component, ViewChild, ElementRef, AfterViewInit, Input, Output, EventEmitter, EnvironmentInjector } from '@angular/core';
import continentData from '../../../public/map.json';
import { LoginComponent } from '../login/login.component';
import { WebsocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';
import { GlobalService } from '../services/global.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'app-map-canvas',
  imports: [CommonModule],
  templateUrl: './map-canvas.component.html',
  styleUrl: './map-canvas.component.less'
})
export class MapCanvasComponent {
  constructor(
    public wsService: WebsocketService,
    public global: GlobalService,
    private router: Router
  ) {}
  private wsSubscription!: Subscription;
  @ViewChild('modal') modal!: ElementRef<HTMLParagraphElement>;
  @ViewChild('hitCanvas') hitCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('mapSvg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;
  @ViewChild('countrybox') countrybox!: ElementRef<HTMLCanvasElement>;
  messages: any[] = [];
  fase: string = "deploy";
  img = new Image();
  totalTime=180;
  min: number = 0;
  sec: number = 0;
  unblock: string="none";
  lastClickTime: number = 0;
  clickDelay: number = 300; // ms

  private ctxHit!: CanvasRenderingContext2D;
  countryInfo: any = continentData;

  ngOnInit() {
    this.img.src='img/shield.png';
    this.wsSubscription = this.wsService.canalPartida().subscribe(
      (message: any) => {
        if(message.response.fase){
          this.fase=message.response.fase;
          this.global.activePlayer=this.global.jugadors.find((e)=>{
            return e.id==message.response.active_player
          })!;
          this.activateSVG()
          switch(this.fase){
            case 'deploy':
              this.messageUpdate()
              this.colocarTropa(message.response.info.setup);
              break;
          }

        }else if(message.response.surrender){
          if(message.response.surrender==1){
            // this.hideModal();
            localStorage.removeItem('sala');
            this.router.navigate(['/lobby'])
          }else{
            alert("No pots abandonar la partida");
          }
        }
      }
    );
  }
  ngAfterViewInit(): void {
    this.ctxHit = this.hitCanvas.nativeElement.getContext('2d')!;
  }
  public surrender(){
    var sala=localStorage.getItem('sala')
    this.wsService.surrenderGame(this.global.user.token, Number(sala));
  }
  //busquem el jugador
  private findPlayer(id:number){
    return this.global.jugadors.findIndex(e=>{
      return e.id==id
    })!
  }
  private colocarTropa(setup:any){
    for(var i=0; i<setup.length; i++){
      var playerId=setup[i].player_id;
      var posPlayer=this.findPlayer(playerId);
      this.global.jugadors[posPlayer].tropas=0;
      if(setup[i].countries){
        setup[i].countries.forEach((e:any)=>{
          var troops= e.troops;
          var idCntry=this.findCountryJson(e.country);
          var country=this.countryInfo[idCntry]
          this.updateCountryJson(idCntry, playerId, troops);
          this.global.jugadors[posPlayer].tropas+=troops;
          this.pintarPais(country.country, this.global.jugadors[posPlayer].color);
          this.insertarNumeroTropas(country, troops);
        })
      }
    }
  }
  private messageUpdate(){
      switch(this.fase){
        case 'deploy':
          if(this.global.user.id==this.global.activePlayer.id){
            this.messages.push("- Has de colocar una tropa en un territori lliure");
          }else{
            var posPlayer=this.findPlayer(this.global.activePlayer.id);
            this.messages.push("- Esperant a que el jugador "+ this.global.jugadors[posPlayer].nom +" coloqui una tropa")
          }

          break;
      }
  }
  private updateCountryJson(id:string, player:number, troops:number){
      this.countryInfo[id].player=player;
      this.countryInfo[id].troops=troops;
  }
  private pintarPais(country:any, playerColor: any){
    const element = this.svgRef.nativeElement.querySelector<SVGElement>(`#${country}`);
    if(element){
      element.setAttribute('fill', playerColor);
    }
  }
  //insertem la informació de les tropes al country
  private insertarNumeroTropas(country:any, troops:number){
    const ctx = this.ctxHit;
    const imgctx= this.hitCanvas.nativeElement.getContext('2d');
    imgctx?.drawImage(this.img, country.x-10,country.y-12.5, 20, 25)

    ctx.fillStyle = 'white';
    ctx.font = 'bold 12.5px Times New Roman';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(troops.toString(), country.x, country.y);
  }
  // startCountdown() {
  //   this.updateTimeDisplay();

  //   this.intervalId = setInterval(() => {
  //     if (this.totalSeconds > 0) {
  //       this.totalSeconds--;
  //       this.updateTimeDisplay();
  //     } else {
  //       clearInterval(this.intervalId); // Detener cuando llegue a 0
  //     }
  //   }, 1000);
  // }
  // updateTimeDisplay() {
  //   this.minutes = Math.floor(this.totalSeconds / 60);
  //   this.seconds = this.totalSeconds % 60;
  // }

  //busquem la informació del country pel nom
  private findCountryJson(name: any){
    var country;
    country=this.countryInfo.findIndex((p:any)=> p.country === name);

    return country;
  }
  onMouseMove(event: MouseEvent): void {
    const element = event.target as SVGElement;
    const regionId = element.closest('[id]')?.id;
    if(regionId!="map"){
      var id=this.findCountryJson(regionId);
      if (id) {
        this.countrybox.nativeElement.textContent=this.countryInfo[id].name;
      }
    }
  }
  onMouseLeave(){
      this.countrybox.nativeElement.textContent="";
  }
  private activateSVG(){
    var aux="none";
    if(this.global.user.id==this.global.activePlayer.id){
      aux="auto";
    }
    this.unblock=aux;
  }
  selectCountry(event: MouseEvent): void {
    const now = Date.now();
    if (now - this.lastClickTime < this.clickDelay) {
      return; // Ignora el segundo click
    }
    this.lastClickTime = now;
    this.unblock="none";
    var element = event.target as SVGElement;
    var regionId = element.closest('[id]')?.id;
    if(regionId!="map" && regionId){
      var idCountry=this.findCountryJson(regionId);
      switch(this.fase){
        case 'deploy':
          var countryOwner=this.countryInfo[idCountry].player;
          if(countryOwner==this.global.activePlayer.id || countryOwner==""){
            this.wsService.placeTroop(this.global.user.token, this.global.sala.id ,regionId)
          }else{
            var idPlayer=this.findPlayer(countryOwner);
            this.messages.push('<b style="color: red;">- Aquest territory es propietat de '+this.global.jugadors[idPlayer].nom+'</b>');
            this.unblock="auto";
          }
          break;
      }
    }
  }
}
