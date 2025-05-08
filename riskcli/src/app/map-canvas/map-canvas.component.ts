import { Component, ViewChild, ElementRef, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import continentData from '../../../public/map.json';
import { LoginComponent } from '../login/login.component';
import { WebsocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';
import { GlobalService } from '../services/global.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map-canvas',
  imports: [CommonModule],
  templateUrl: './map-canvas.component.html',
  styleUrl: './map-canvas.component.less'
})
export class MapCanvasComponent {
  constructor(
    public wsService: WebsocketService,
    public global: GlobalService
  ) {}
  private wsSubscription!: Subscription;

  @ViewChild('visibleCanvas') visibleCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hitCanvas') hitCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('countrybox') countrybox!: ElementRef<HTMLCanvasElement>;
  @Output() selCountry= new EventEmitter<string>();
  @Input() msg:any=[];

  private sendInfo(cty: string){
    this.selCountry.emit(cty);
  }

  private ctxVisible!: CanvasRenderingContext2D;
  private ctxHit!: CanvasRenderingContext2D;
  private hoveredColorId: string | null = null;
  private visibleImg = new Image();
  private hitImg = new Image();
  private playerColors=[[255,0,0,250],[0,255,0,250],[0,0,255,250],[255,255,0,250]]
  continentInfo: any = continentData;

  ngOnInit() {
    this.wsSubscription = this.wsService.canalSala().subscribe(
      (message: any) => {

      }
    );
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

  private eventInfo(event: any){
    // pasos per retornar el color del background..
    const x = event.offsetX;
    const y = event.offsetY;
    const pixel = this.ctxHit.getImageData(x, y, 1, 1).data;
    // recuperem la info del hitbox
    const hitImageData = this.ctxHit.getImageData(0, 0, this.hitCanvas.nativeElement.width, this.hitCanvas.nativeElement.height);
    return {
      'x':x,
      'y':y,
      'colorId':this.rgbToHex(pixel[0],pixel[1],pixel[2]),
      'data':hitImageData.data,
      'visibleImg':this.ctxVisible.getImageData(0, 0, this.hitCanvas.nativeElement.width, this.hitCanvas.nativeElement.height),
      'hitzone':this.hitZone(pixel[0],pixel[1],pixel[2],pixel[3])
    }
  }
  onMouseMove(event: MouseEvent): void {
    var info=this.eventInfo(event);
    // var hoverColor=this.hoveredColorId;

    // if(info.colorId==="#000000"){
    //   this.countrybox.nativeElement.textContent="";
    // }else if (hoverColor!== info.colorId) {
    if (!info.hitzone) {
      var country;
      // this.redrawCanvasWithHover(info.colorId);
      // portem informació del country de tornada per
      country=this.findcountry(info.colorId);

      if(country){
        this.countrybox.nativeElement.textContent=country.name;
      }
    }else{
      this.countrybox.nativeElement.textContent="";
    }
  }

  private findcountry(colorId: string){
    var i=0;
    var country;
    do{
      country=this.continentInfo[i].countries.find((p:any)=> p.hex === colorId);
      i+=1;
    }while(!country || this.continentInfo.length<i)

    return country;
  }

  onClick(event: MouseEvent): void {
    var info=this.eventInfo(event);
    console.info(event)
    for (let i = 0; i < info.data.length; i += 4) {
      const r = info.data[i];
      const g = info.data[i + 1];
      const b = info.data[i + 2];
      const a = info.data[i + 3];
      const currentColor=this.rgbToHex(r,g,b);
      //Revisar si realmente es una hitzone
      if (this.hitZone(r,g,b,a)) continue;
      if (currentColor === info.colorId) {
        info.visibleImg.data[i] = this.playerColors[0][0];
        info.visibleImg.data[i + 1] = this.playerColors[0][1];
        info.visibleImg.data[i + 2] = this.playerColors[0][2];
        info.visibleImg.data[i + 3] = this.playerColors[0][3];

      }
    }
    var country=this.findcountry(info.colorId);
    if(country){
      this.sendInfo(country)
    }
    this.ctxVisible.putImageData(info.visibleImg, 0, 0);
  }

  private pintarPais(area:any, playerColor: any){

  }

  private redrawCanvasWithHover(colorId: string): void {
    // 1. Limpiamos el canvas visible
    // this.ctxVisible.clearRect(0, 0, this.visibleCanvas.nativeElement.width, this.visibleCanvas.nativeElement.height);

    // 2. Dibujamos la imagen base
    this.ctxVisible.drawImage(this.visibleImg, 0, 0);

    // 3. Recorremos todos los píxeles del hitCanvas y dibujamos encima los que coincidan
    const hitImageData = this.ctxHit.getImageData(0, 0, this.hitCanvas.nativeElement.width, this.hitCanvas.nativeElement.height);
    const visibleImageData = this.ctxVisible.getImageData(0, 0, this.visibleCanvas.nativeElement.width, this.visibleCanvas.nativeElement.height);
    const data = hitImageData.data;
    const highlightColor = [255, 255, 0, 100]; // Amarillo semi-transparente

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      //evitar pintar zonas transparentes o bordes
      if (this.hitZone(r,g,b,a)) continue;
      const currentColor=this.rgbToHex(r,g,b);
      // const currentColor = `${r},${g},${b}`;
      if (currentColor === colorId) {
        // Pintamos encima en el visibleCanvas
        visibleImageData.data[i] = highlightColor[0];
        visibleImageData.data[i + 1] = highlightColor[1];
        visibleImageData.data[i + 2] = highlightColor[2];
        visibleImageData.data[i + 3] = highlightColor[3]; // alpha
      }
    }

    this.ctxVisible.putImageData(visibleImageData, 0, 0);
  }
  // funció per convertir el color en hexadecimal
  private rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      }).join('');
  }
  //verifiquem si la casella es clicable
  private hitZone(r: number, g: number, b: number, a: number): boolean{
    var hit=false;

    if( a===0 ){ hit=true };
    if (this.isBorderColor(r, g, b)){ hit=true};
    return hit;

  }
  /**
   * verifiquem que no estem en un borde de la imatge,
   * si es un color negre vol dir que estem a un border.
   * */
  private isBorderColor(r: number, g: number, b: number): boolean{
    return r === 0 && g === 0 && b === 0;
  };
}
