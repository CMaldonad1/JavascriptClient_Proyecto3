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
  fase: string = "attack";
  img = new Image();
  totalTime=0;
  min: number = 0;
  sec: number = 0;
  unblock: string="none";
  lastClickTime: number = 0;
  clickDelay: number = 600; // ms
  attacker:any = "";
  defender:string = "";
  activateDices:boolean=false;

  private ctxHit!: CanvasRenderingContext2D;
  countryInfo: any = continentData;

  ngOnInit() {
    this.img.src='img/shield.png';
    this.wsSubscription = this.wsService.canalPartida().subscribe(
      (message: any) => {
        if(message.response.fase){
          // this.fase=message.response.fase;
          this.global.activePlayer=this.global.jugadors.find((e)=>{
            return e.id==message.response.active_player
          })!;
          this.activateSVG()
          // switch(this.fase){
          //   case 'deploy':
          this.messageUpdate()
          this.colocarTropa(message.response.info.setup);
            //   break;
            // case 'attack':

          // }
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
          this.pintarPais(country.country, this.global.jugadors[posPlayer]);
          this.insertarNumeroTropas(country, troops);
        })
      }
    }
  }
  private messageUpdate(){
      var ownTurn=this.global.user.id==this.global.activePlayer.id;
      var posPlayer=this.findPlayer(this.global.activePlayer.id);
      switch(this.fase){
        case 'deploy':
          if(ownTurn){
            this.messages.push("- Has de colocar una tropa en un territori lliure");
          }else{
            this.messages.push("- Fase de deploy de "+ this.global.jugadors[posPlayer].nom )
          }
          break;
        case 'attack':
          if(ownTurn){
            this.messages.push("- Estas en la teva fase d'atac. Ara pots intentar conquistar altres territoris")
          }else{
             this.messages.push("- Fase d'atack de "+ this.global.jugadors[posPlayer].nom )
          }
      }
  }
  private updateCountryJson(id:string, player:number, troops:number){
      this.countryInfo[id].player=player;
      this.countryInfo[id].troops=troops;
  }
  private pintarPais(country:any, player: any){
    const element = this.svgRef.nativeElement.querySelector<SVGElement>(`#${country}`);
    element?.setAttribute('fill', player.color);
    if(player.id!=this.global.user.id){
      element?.classList.remove('country');
      element?.classList.add('unclickable');
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
    var element = event.target as SVGElement;
    var regionId = element.id;

    var id=this.findCountryJson(regionId);
    if (id>=0) {
      this.countrybox.nativeElement.textContent=this.countryInfo[id].name;
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
    var now = Date.now();
    if (now - this.lastClickTime < this.clickDelay) {
      return; // Ignora el segundo click
    }
    this.lastClickTime = now;
    var element = event.target as SVGElement;
    var regionId=element.id;
    //verifiquem l'id del pais escollit, si ha clickat al SVG no hi haura region
    if(regionId.length>0){
      var idCountry=this.findCountryJson(regionId);
      var countrySelected=this.countryInfo[idCountry];
      switch(this.fase){
        case 'deploy':
          this.unblock="none"; //no deixem fer mes clicks
          var countryOwner=countrySelected.player;
          if(countryOwner==this.global.activePlayer.id || countryOwner==""){
            this.wsService.placeTroop(this.global.user.token, this.global.sala.id ,regionId)
          }else{
            var idPlayer=this.findPlayer(countryOwner);
            this.messages.push('<b style="color: red;">- Aquest territory es propietat de '+this.global.jugadors[idPlayer].nom+'</b>');
            this.unblock="auto";
          }
          break;
        case 'deploy_combat': //pendiente de cambio
          break;
        case 'attack':
            //si no hi ha un country seleccionat per attacar o s'ha tornat a seleccionar el mateix
            if(this.attacker=="" || this.attacker.country==countrySelected.country){
              this.borderCountries(countrySelected);
              this.blockUnblockAll(countrySelected);
            //si ja hi ha un atacker verifiquem que el 2n country seleccionat es atacable
            }else{
              if(this.attacker.borders.includes(countrySelected.country)){
                this.defender=countrySelected;
                //una vegada seleccionat defensor es seleccionará les tropes amb les que atacar
                this.activateDices=true;
              }else{
                this.messages.push('<b style="color: red;">- El territori '+ countrySelected.name+' no es pot atacar desde '+countrySelected.name+'</b>');
              }
            }
          break;
        case 'reinforcement':
          break;
      }
    }
  }
  private borderCountries(country: any){
    var selected = this.svgRef.nativeElement.querySelector<SVGElement>(`#${country.country}`);
    selected?.classList.toggle('selected')
    selected?.classList.toggle('country')
    country.borders.forEach((e:string) => {
      const element = this.svgRef.nativeElement.querySelector<SVGElement>(`#${e}`);
      element?.classList.toggle('attackto');
    });
  }
  private blockUnblockAll(country: any){
    //si el attacker es igual al country
    var block: boolean = (this.attacker=="") ? true : false;
    this.countryInfo.forEach((c:any) => {
      var cntry=c.country;
      if(!country.borders.includes(cntry) && country.country!=cntry){
        var selected = this.svgRef.nativeElement.querySelector<SVGElement>(`#${cntry}`);
        selected?.classList.toggle('unclickable')
      }
    });
    //si s'ha toranat a clickar al country attacant es desfá tot
    this.attacker=(block?country:"");
    if(!block) this.defender="";
  }
  private resetStatusBlocks(){
    this.countryInfo.forEach((c:any) =>{
      var selected = this.svgRef.nativeElement.querySelector<SVGElement>(`#${c.country}`);
      (c.player==this.global.user.id)?selected?.classList.remove('unclickable'):selected?.classList.add('unclickable')
    })
  }
}
