import { Component, ViewChild, ElementRef, Input } from '@angular/core';

@Component({
  selector: 'app-dices',
  imports: [],
  templateUrl: './dices.component.html',
  styleUrl: './dices.component.less'
})
export class DicesComponent {
  @Input() attackerDices:number=1;
  @Input() defenderDices:number=2;
  @Input() attackerColor:string="red";
  @Input() defenderColor:string="blue";
  @Input() attackerResults:number[]=[6,4,2];
  @Input() defenderResults:number[]=[3,1];
  @ViewChild('attacker') attacker!: ElementRef<HTMLElement>;
  @ViewChild('defender') defender!: ElementRef<HTMLElement>;
  class: string[]=['rolling1','rolling2','rolling3','rolling4','rolling5','rolling6']

  ngAfterViewInit() {
    this.pintarAttacker();
    this.pintarDefensor();
  }
  ngAfterViewChecked(){
    this.pintarAttacker();
  }
  private paintDice(el:NodeListOf<HTMLElement>, color:string){
    el.forEach( (e) =>{
      e.style.backgroundColor=color;
    })
  }
  private pintarAttacker(){
    var att=this.attacker.nativeElement.querySelectorAll<HTMLElement>(".face");
    this.paintDice(att, this.attackerColor);
  }
  private pintarDefensor(){
    var def=this.defender.nativeElement.querySelectorAll<HTMLElement>(".face");
    this.paintDice(def, this.defenderColor);
  }
  public diceRoll(){
    var att=this.attacker.nativeElement.querySelectorAll<HTMLElement>(".dice");
    var def=this.defender.nativeElement.querySelectorAll<HTMLElement>(".dice");
    this.showResult(att, this.attackerResults);
    this.showResult(def, this.defenderResults)
  };

  private showResult(el:NodeListOf<HTMLElement>, result:number[]){
    for(var i=0; i<el.length; i++){
      el[i].classList.remove("rotation");
      el[i].classList.add(this.class[result[i]-1]);
    }
  }
  actualizarAtacante(event: Event){
    const input = event.target as HTMLInputElement;
    this.attackerDices = +input.value;
    var att=this.attacker.nativeElement.querySelectorAll<HTMLElement>(".dice");
    this.resetDaus(att);
    var def=this.defender.nativeElement.querySelectorAll<HTMLElement>(".dice");
    this.resetDaus(def);
  }
  private resetDaus(el:NodeListOf<HTMLElement>){
    el.forEach( (e) =>{
      e.className='';
      e.classList.add('dice','rotation')
    })
  }
}
