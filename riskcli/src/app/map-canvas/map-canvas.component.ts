import { Component, ViewChild, ElementRef, AfterViewInit, Input, Output, EventEmitter, EnvironmentInjector, viewChild } from '@angular/core';
import continentData from '../../../public/map.json';
import { LoginComponent } from '../login/login.component';
import { WebsocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';
import { GlobalService } from '../services/global.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DicesComponent } from '../dices/dices.component';

declare var bootstrap: any;

@Component({
  selector: 'app-map-canvas',
  imports: [CommonModule, DicesComponent],
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
  @ViewChild(DicesComponent) diceComponent!: DicesComponent;
  messages: any[] = [];
  fase: string = "";
  img = new Image();
  totalTime=0;
  min: number = 0;
  sec: number = 0;
  unblock: string="none"; //or auto
  lastClickTime: number = 0;
  clickDelay: number = 600; // ms
  attacker:any = "";
  defender:any = "";
  reinfTroops:number=1;
  attackerDice:number=1;
  resultDices:boolean=false;
  troopSelect:boolean=false;
  fiAttack:boolean=false;
  deployment:any[]=[];

  private ctxHit!: CanvasRenderingContext2D;
  countryInfo: any = continentData;
  // $$$$$ %%%%%% canviar alert per modal !!!!!!
  ngOnInit() {
    console.info(this.global.jugadors);
    this.img.src='img/shield.png';
    this.wsSubscription = this.wsService.canalPartida().subscribe(
      (message: any) => {
        if(message.response.fase){
          this.fase=message.response.fase;
          var posPlayer=this.setActivePlayer(message.response.active_player);
          this.activateSVG();
          this.troopsPlayers(message.response.info, posPlayer);
          this.messageUpdate();
          this.colocarTropa(message.response.info.setup);
          if(message.response.info.attacker && message.response.info.defender){
            this.mostrarTirada(message.response.info.attacker, message.response.info.defender);
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
  private setActivePlayer(msgPlayer:any){
    var posPlayer;
    if(msgPlayer){
      posPlayer=this.findPlayer(msgPlayer);
      this.global.activePlayer=this.global.jugadors[posPlayer];
    }else{
      posPlayer=this.findPlayer(this.global.activePlayer.id);
    }
    return posPlayer;
  }
  private troopsPlayers(info:any, posPlayer:number){
      var troops=0;
      switch(this.fase){
        case 'deploy':
          troops=1;
          break;
        case 'deploy_combat':
          troops=info.n_tropes;
          break;
      }
      this.global.jugadors[posPlayer].tropas+=troops;
  }
  public surrender(){
    this.wsService.surrenderGame();
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
      if(setup[i].countries){
        setup[i].countries.forEach((e:any)=>{
          var troops= e.troops;
          var idCntry=this.findCountryJson(e.country);
          var country=this.countryInfo[idCntry]
          this.updateCountryJson(idCntry, playerId, troops);
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
            this.messages.push("- Fase de deploy del jugador "+ this.global.jugadors[posPlayer].nom )
          }
          break;
        case 'deploy_combat':
          if(ownTurn){
            this.messages.push("- Reparteix "+this.global.jugadors[posPlayer].tropas+" tropes entre els teus territoris");
          }else{
            this.messages.push("- Fase de deploy del jugador "+ this.global.jugadors[posPlayer].nom )
          }
          break;
        case 'attack':
          if(ownTurn){
            this.messages.push("- Estas en la teva fase d'atac. Ara pots intentar conquistar altres territoris")
          }else{
             this.messages.push("- Fase d'atac del jugador "+ this.global.jugadors[posPlayer].nom )
          }
          break;
        case 'reinforce':
            if(ownTurn){
            this.messages.push("- Estas en la teva fase de reforç. Pots moure tropes d'un país a un altre sempre i quan les fronteres estiguin conectades")
          }else{
             this.messages.push("- Fase de reforç del jugador "+ this.global.jugadors[posPlayer].nom )
          }
          break;
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
    }else{
      element?.classList.remove('unclickable');
      element?.classList.add('country');
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
  // EN FUNCIÓ DEL CLICK I DE LA FASE ES FARÁ...
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
          this.deploymentPhase(countrySelected, regionId);
          break;
        case 'deploy_combat': //pendiente de cambio
          this.deployCombatPhase(countrySelected);
          break;
        case 'attack':
          this.attackPhase(countrySelected);
          break;
        case 'reinforce':
          this.reinforcementPhase(countrySelected);
          break;
      }
    }
  }
  // FASES DEL JOC
  private deploymentPhase(countrySelected:any, regionId:string){
      this.unblock="none"; //no deixem fer mes clicks
      var countryOwner=countrySelected.player;
      if(countryOwner==this.global.activePlayer.id || countryOwner==""){
        this.wsService.placeTroop(regionId)
      }else{
        var idPlayer=this.findPlayer(countryOwner);
        this.messages.push('<b style="color: red;">- Aquest territory es propietat de '+this.global.jugadors[idPlayer].nom+'</b>');
        this.unblock="auto";
      }
  }
  //selecció del country on es vol afegir tropes
    // $$$$$ %%%%%% canviar alert per modal !!!!!!
  private deployCombatPhase(countrySelected:any){
    if(this.global.activePlayer.tropas==0){
      this.attacker=countrySelected;
      var selected = this.svgRef.nativeElement.querySelector<SVGElement>(`#${countrySelected.country}`);
      selected?.classList.add('selected')
      selected?.classList.remove('country')
      this.troopSelect=true;
      this.unblock="none"; //no deixem fer mes clicks
    }else{
      alert("Ja no et queden tropes. Finalitza torn")
    }
  }
  //tanquem la finestra de inserció de tropes
  cancelDeployCombat(){
    this.troopSelect=false;
    var selected = this.svgRef.nativeElement.querySelector<SVGElement>(`#${this.attacker.country}`);
    selected?.classList.remove('selected')
    selected?.classList.add('country')
    this.attacker="";
    this.unblock="auto";
  }
  //guardem les tropes que vol ficar al territori i tanquem la finestra
  saveTroops(){
    var aux={
      'country':this.attacker.country,
      'tropes':this.attackerDice
    }
    var posPlayer=this.findPlayer(this.global.activePlayer.id);
    this.global.jugadors[posPlayer].tropas-=this.attackerDice;
    this.global.activePlayer= this.global.jugadors[posPlayer];
    console.info(aux);
    this.deployment.push(aux);
    this.cancelDeployCombat()
  }
  // $$$$$ %%%%%% canviar alert per modal !!!!!!
  private attackPhase(countrySelected:any){
      var sameClick:boolean=(this.attacker.country==countrySelected.country)?true:false;
      //si no hi ha un country seleccionat per attacar o s'ha tornat a seleccionar el mateix
      if(this.attacker=="" || sameClick){
        if(countrySelected.troops>1){
          this.borderCountries(countrySelected);
          this.blockUnblockAll(countrySelected);
        }else{
          alert("Has d'escollir un país amb més d'una tropa per atacar")
        }
      //si ja hi ha un atacker verifiquem que el 2n country seleccionat es atacable
      }else{
        if(this.attacker.borders.includes(countrySelected.country)){
          this.defender=countrySelected;
        }else{
          this.messages.push('<b style="color: red;">- El territori '+ countrySelected.name+' no es pot atacar desde '+this.attacker.name+'</b>');
        }
      }
  }
  // $$$$$ %%%%%% canviar alert per modal !!!!!!
  private reinforcementPhase(countrySelected:any){
    var sameClick:boolean=(this.attacker.country==countrySelected.country)?true:false;
    if(this.attacker=="" || sameClick){
      if(countrySelected.troops>1){
        this.connectedCountries(countrySelected, sameClick);
      }else{
        alert("No hi ha tropes suficients a "+countrySelected.name+" per moure-les a un altre. Mínim ha de quedar 1 tropa per país! ")
      }
    }else{
      this.defender=countrySelected;
    }
  }
  //activem o desactivem el country seleccionat
  private actDesCountry(c: string){
    var selected = this.svgRef.nativeElement.querySelector<SVGElement>(`#${c}`);
    selected?.classList.toggle('selected')
    selected?.classList.toggle('country')
  }
  //marquem els paisos que fan frontera y que poden ser attackats
  private borderCountries(country: any){
    this.actDesCountry(country.country);
    country.borders.forEach((e:string) => {
      const element = this.svgRef.nativeElement.querySelector<SVGElement>(`#${e}`);
      var ownerCountry=this.countryInfo[this.findCountryJson(e)].player;
      if(ownerCountry!=this.global.activePlayer.id){
        element?.classList.toggle('attackto');
      }
        element?.classList.toggle('unclickable');
    });
  }
  //marquem els paisos que estan conectat amb fronteres per moure tropes
  private connectedCountries(country:any, sameClick:boolean){
    this.actDesCountry(country.country);
    this.attacker=(sameClick?"":country);
    if(!sameClick){
      this.blockAllCountries();
      var arrayCountries:string[]=[];
      arrayCountries.push(country.country)
      this.revisarFrontera(country.borders, arrayCountries);
    }else{
      this.resetStatusBlocks();
      this.attacker="";
      this.defender="";
    }
  }
  updateReinforcement(event: Event){
    const input = event.target as HTMLInputElement;
    this.reinfTroops = +input.value;
  }
  sendReinforcement(){
    var faseAttack=(this.fase=='attack')?true:false;
    var respFase=(faseAttack)?'attack_deployment':'reinforce';
    this.wsService.reinforce(respFase, this.attacker.country, this.defender.country, this.reinfTroops);
    this.cancel();
  }
  //maquem els paisos que fan frontera amb el country per atacar-los
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
  //reinicialitzem les clases del SVG en funció de quí poseix el territori
  private resetStatusBlocks(){
    this.countryInfo.forEach((c:any) =>{
      var selected = this.svgRef.nativeElement.querySelector<SVGElement>(`#${c.country}`);
      selected?.removeAttribute('class');
      (c.player==this.global.user.id)?selected?.classList.add('country'):selected?.classList.add('unclickable')
    })
  }
  //en la fase de reinforçement bloquejem tot el que no es country per després cridar "revisarFrontera"
  private blockAllCountries(){
    this.countryInfo.forEach((c:any) =>{
      var selected = this.svgRef.nativeElement.querySelector<SVGElement>(`#${c.country}`);
      if(c.country!=this.attacker.country){
        selected?.classList.add('unclickable');
      }
    })
  }
  //revisem les fronteres per veure si son del país i, si ho son, les marquem
  private revisarFrontera(borders:string[], country:string[]){
    borders.forEach((e)=>{;
      var cInfo=this.countryInfo[this.findCountryJson(e)];
      if(cInfo.player==this.global.activePlayer.id && !country.includes(e)){
        country.push(e)
        const element = this.svgRef.nativeElement.querySelector<SVGElement>(`#${e}`);
        element?.classList.add('moveTroop');
        element?.classList.remove('unclickable');
        this.revisarFrontera(cInfo.borders,country);
      }
    })
  }
  finalitzarFase(){
    switch(this.fase){
      case 'attack':
        this.wsService.endPhase();
        break;
      case 'deploy_combat':
        this.wsService.deployCombat(this.deployment);
        this.deployment.length=0;
      break
    }
  }
  cancel(){
    this.resetStatusBlocks();
    this.attacker="";
    this.defender="";
    this.resultDices=false;
    this.fiAttack=false;
    this.attackerDice=1;
    this.reinfTroops=1;
  }
  calcularDausAtacant(event: Event){
    const input = event.target as HTMLInputElement;
    this.attackerDice = +input.value;
    this.diceComponent.actualizarDaus();
    this.resultDices=false;
  }
  enviarDausResult(){
    var troops=(this.attackerDice>3?3:this.attackerDice);
    this.wsService.invadeCountry(this.attacker.country, troops, this.defender.country)
    this.resultDices=true;
    // var attackerResults:number[]=[]
    // var defenderResults:number[]=[]
    // for(var i=0; i<this.attackerDice;i++){
    //   attackerResults.push(Math.floor(Math.random() * 6) + 1)
    // }
    // for(var i=0;i<2;i++){
    //   defenderResults.push(Math.floor(Math.random() * 6) + 1)
    // }
    // attackerResults.sort((a,b)=> b-a)
    // defenderResults.sort((a,b)=> b-a)
    // var attacker={
    //   'country':this.attacker.country,
    //   'dice':attackerResults,
    //   'troops':this.attacker.troops,
    //   'player_id':2
    // };
    // var defender={
    //   'country':this.defender.country,
    //   'dice':defenderResults,
    //   'troops':this.defender.troops,
    //   'player_id':3
    // };
    // this.diceComponent.diceRoll(attacker.dice,defender.dice);
    // this.calcularResultat(attacker,defender);
  }
  resetDice(){
    this.attacker=this.countryInfo[this.findCountryJson(this.attacker.country)];
    this.defender=this.countryInfo[this.findCountryJson(this.defender.country)];
    if(this.attacker.troops==1 || this.defender.player==this.global.user.id){
      this.cancel()
    }else{
      this.diceComponent.actualizarDaus()
      this.resultDices=false;
    }
  }
  private mostrarTirada(attacker:any, defender:any){
    if(attacker!="" && defender!=""){
      this.diceComponent.diceRoll(attacker.dice,defender.dice);
      this.calcularResultat(attacker,defender);
    }
  }
  private calcularResultat(attacker:any, defender:any){
    var dictionary=['tropa','tropes'];
    var lenAtt=attacker.dice.length;
    var lenDef=defender.dice.length;
    var resultsComprables=(lenAtt>lenDef?lenDef:lenAtt);
    var lostAttacker=0, lostDefender=0;

    for(var i = 0; i<resultsComprables; i++){
      (attacker.dice[i]>defender.dice[i])?lostDefender+=1:lostAttacker+=1
    }

    var message="- ";
    var cntryAt=this.countryInfo[this.findCountryJson(attacker.country)].na;
    var cntryDef=this.countryInfo[this.findCountryJson(defender.country)];
    var d=this.global.jugadors[this.findPlayer(defender.player_id)];
    var a=this.global.jugadors[this.findPlayer(attacker.player_id)];

    if(lostAttacker>0){
      message+="El jugador "+a.nom+" ha perdut "+lostAttacker+" "+dictionary[lostAttacker-1]+
                " en "+cntryAt.name+"! "
    }
    if(lostDefender>0){
      message+="El jugador "+d.nom+" ha perdut "+lostDefender+" "+dictionary[lostDefender-1]+
              " en "+cntryDef.name+"! "
    }
    this.messages.push(message)

    cntryAt.troops=-lostAttacker;
    cntryDef.troops=-lostDefender;

    if(cntryAt.troops<=1){
      this.messages.push("- L'atac de "+a.nom+" ha sigut contrarestat pel "+d.nom+"!");
    }
    if(cntryDef.troops<=0){
      this.messages.push("- El pais "+cntryDef.name+" ha sigut conquistat per "+a.nom);
    }
    //controlem només per la banda del jugador actiu per controlar les visualitzacions
    if(a.id == this.global.activePlayer.id){
      this.resultDices=true;
      this.attacker=cntryAt;
      this.defender=cntryDef;

      if(cntryDef.troops<=0 || cntryAt.troops<=1){
        this.fiAttack=true;
      }
    }
  }
}
