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
  @ViewChild('visibleCanvas') visibleCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hitCanvas') hitCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('countrybox') countrybox!: ElementRef<HTMLCanvasElement>;
  messages: any[] = [];
  img = new Image();
  totalTime=180;
  min: number = 0;
  sec: number = 0;

  private ctxVisible!: CanvasRenderingContext2D;
  private ctxHit!: CanvasRenderingContext2D;
  private hoveredColorId: string | null = null;
  private visibleImg = new Image();
  private hitImg = new Image();

  continentInfo: any = continentData;

  ngOnInit() {
    this.img.src='img/shield.png';
    this.wsSubscription = this.wsService.canalPartida().subscribe(
      (message: any) => {
        if(message.response.fase){
          this.global.activePlayer=this.global.jugadors.find((e)=>{
            return e.id==message.response.active_player
          })!;
          switch(message.response.fase){
            case 'deployment':
              this.colocarTropa(message.response.info.setup);
              break;
          }

        }else if(message.response.surrender){
          if(message.response.surrender==1){
            this.hideModal();
            localStorage.removeItem('sala');
            this.router.navigate(['/lobby'])
          }else{
            alert("No pots abandonar la partida");
          }
        }
      }
    );
    this.global.activePlayer=this.global.jugadors[0];
  }
  ngAfterViewInit(): void {
    this.ctxVisible = this.visibleCanvas.nativeElement.getContext('2d')!;
    this.ctxHit = this.hitCanvas.nativeElement.getContext('2d')!;

    this.visibleImg.src = 'assets/Risk_board.svg';
    this.hitImg.src = 'assets/mapa_colores.png';

    this.visibleImg.onload = () => {
      this.ctxVisible.drawImage(this.visibleImg, 0, 0);
    };

    this.hitImg.onload = () => {
      this.ctxHit.drawImage(this.hitImg, 0, 0);
    };
  }
  public surrender(){
    var sala=localStorage.getItem('sala')
    this.wsService.surrenderGame(this.global.user.token, Number(sala));
  }
  //buquem el jugador
  private findPlayer(id:number){
    return this.global.jugadors.find(e=>{
      return e.id==id
    })!
  }
  private colocarTropa(setup:any){
    for(var i=0; i<setup.length; i++){
      var player=this.findPlayer(setup[i].id);
      setup[i].countries.forEach((e:any)=>{
        var cntry=this.findCountryByName(e.country);
        var troops=e.troops;
        this.messages.push("- Player "+player.nom+" ha ficat "+troops+" a "+cntry.name)
        this.pintarPais(cntry, player.color);
        this.insertarNumeroTropas(cntry, troops);
      })
    }
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

  //funció per extreure la información necesaria del canvas
  private eventInfo(event: any){
    // pasos per retornar el color del background..
    var x = event.offsetX;
    var y = event.offsetY;
    var pixel = this.ctxHit.getImageData(x, y, 1, 1).data;
    var hitzone=this.hitZone(pixel[0],pixel[1],pixel[2],pixel[3])
    var colorId=this.rgbToHex(pixel[0],pixel[1],pixel[2])
    var country;
    if(hitzone){
      country=this.findCountryByColor(colorId);
      x=country.x;
      y=country.y;
    }
    // recuperem la info del hitbox
    const hitImageData = this.ctxHit.getImageData(0, 0, this.hitCanvas.nativeElement.width, this.hitCanvas.nativeElement.height);

    return {
      'x':x,
      'y':y,
      'country':country,
      'colorId':colorId,
      'data':hitImageData.data,
      'visibleImg':this.ctxVisible.getImageData(0, 0, this.hitCanvas.nativeElement.width, this.hitCanvas.nativeElement.height),
      'hitzone':hitzone
    }
  }
  //busquem la informació del country per color
  private findCountryByColor(colorId: string){
    var i=0;
    var country;
    do{
      country=this.continentInfo[i].countries.find((p:any)=> p.hex === colorId);
      i++;
    }while(!country || this.continentInfo.length<i)

    return country;
  }
  //busquem la informació del country pel nom
  private findCountryByName(name: string){
    var i=0;
    var country;
    do{
      country=this.continentInfo[i].countries.find((p:any)=> p.country === name);
      i++;
    }while(!country || this.continentInfo.length<i)

    return country;
  }
  //insertem la informació de les tropes al country
  private insertarNumeroTropas(country:any, troops:number){
    const ctx = this.ctxVisible;
    const imgctx= this.visibleCanvas.nativeElement.getContext('2d');
    imgctx?.drawImage(this.img, country.x-10,country.y-12.5, 20, 25)

    ctx.fillStyle = 'white';
    ctx.font = 'bold 12.5px Times New Roman';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(troops.toString(), country.x, country.y);
  }
  onMouseMove(event: MouseEvent): void {
    var info=this.eventInfo(event);
    var hoverColor=this.hoveredColorId;

    // if(info.colorId==="#000000"){
    //   this.countrybox.nativeElement.textContent="";
    // }else if (hoverColor!== info.colorId) {
    //   this.redrawCanvasWithHover(info.colorId);
    // }
    if (info.hitzone) {
      this.countrybox.nativeElement.textContent=info.country.name;
    }else{
      this.countrybox.nativeElement.textContent="";
    }
  }
  selectCountry(event: MouseEvent): void {
    var info=this.eventInfo(event);
    if(info.hitzone){
      this.wsService.placeTroop(this.global.user.token, info.country.country)
    }

  }
  private pintarPais(country:any, playerColor: any){
    var hitImageData = this.ctxHit.getImageData(0, 0, this.hitCanvas.nativeElement.width, this.hitCanvas.nativeElement.height);
    var data=hitImageData.data;
    var visibleImg=this.ctxVisible.getImageData(0, 0, this.hitCanvas.nativeElement.width, this.hitCanvas.nativeElement.height)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      const currentColor=this.rgbToHex(r,g,b);
      if (currentColor === country.hex) {
        var color=this.hexToRgba(playerColor)
        visibleImg.data[i] = color[0];
        visibleImg.data[i + 1] = color[1];
        visibleImg.data[i + 2] = color[2];
        visibleImg.data[i + 3] = 255;
        this.ctxVisible.putImageData(visibleImg, 0, 0);
      }
    }
  }
  // private redrawCanvasWithHover(colorId: any): void {
  //   // 1. Limpiamos el canvas visible
  //   this.ctxVisible.clearRect(0, 0, this.visibleCanvas.nativeElement.width, this.visibleCanvas.nativeElement.height);

  //   // 2. Dibujamos la imagen base
  //   this.ctxVisible.drawImage(this.visibleImg, 0, 0);

  //   // 3. Recorremos todos los píxeles del hitCanvas y dibujamos encima los que coincidan
  //   const hitImageData = this.ctxHit.getImageData(0, 0, this.hitCanvas.nativeElement.width, this.hitCanvas.nativeElement.height);
  //   const visibleImageData = this.ctxVisible.getImageData(0, 0, this.visibleCanvas.nativeElement.width, this.visibleCanvas.nativeElement.height);
  //   const data = hitImageData.data;
  //   const highlightColor = [255, 255, 0, 100]; // Amarillo semi-transparente

  //   for (let i = 0; i < data.length; i += 4) {
  //     const r = data[i];
  //     const g = data[i + 1];
  //     const b = data[i + 2];
  //     const a = data[i + 3];

  //     //evitar pintar zonas transparentes o bordes
  //     if (this.hitZone(r,g,b,a)){
  //       const currentColor=this.rgbToHex(r,g,b);
  //       // const currentColor = `${r},${g},${b}`;
  //       if (currentColor === colorId) {
  //         // Pintamos encima en el visibleCanvas
  //         visibleImageData.data[i] = highlightColor[0];
  //         visibleImageData.data[i + 1] = highlightColor[1];
  //         visibleImageData.data[i + 2] = highlightColor[2];
  //         visibleImageData.data[i + 3] = highlightColor[3]; // alpha
  //       }
  //     }

  //   }
  //   this.ctxVisible.putImageData(visibleImageData, 0, 0);
  // }
  // funció per convertir el color en hexadecimal
  private rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      }).join('');
  }
  private hexToRgba(hex: string, alpha: number = 1): Array<number> {

    hex = hex.replace(/^#/, '');

    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return [r, g, b, alpha];
  }
  //verifiquem si la casella es clicable
  private hitZone(r: number, g: number, b: number, a: number): boolean{
    var hit=true;

    if( a===0 ){ hit=false };
    if (this.isBorderColor(r, g, b)){ hit=false};
    return hit;

  }
  /**
   * verifiquem que no estem en un borde de la imatge,
   * si es un color negre vol dir que estem a un border.
   * */
  private isBorderColor(r: number, g: number, b: number): boolean{
    return r === 0 && g === 0 && b === 0;
  }
  private hideModal(){
    document.body.classList.remove('modal-open');
    var modalElement = this.modal.nativeElement;
    var modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modalInstance.hide();
  }

}
