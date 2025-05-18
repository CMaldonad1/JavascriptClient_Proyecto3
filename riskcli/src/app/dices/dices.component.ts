import { Component, ViewChild, ElementRef, Input } from '@angular/core';

@Component({
  selector: 'app-dices',
  imports: [],
  templateUrl: './dices.component.html',
  styleUrl: './dices.component.less'
})
export class DicesComponent {
  @Input() attackerDices:number=0;
  @Input() defenderDices:number=0;
  @Input() attackerColor:string="grey";
  @Input() defenderColor:string="grey";
  @Input() attackerCountry: any="";
  @Input() defenderCountry: any="";
  @ViewChild('attacker') attacker!: ElementRef<HTMLElement>;
  @ViewChild('defender') defender!: ElementRef<HTMLElement>;
  class: string[]=['rolling1','rolling2','rolling3','rolling4','rolling5','rolling6']
  attDice?:any;
  defDice?:any;

  ngAfterViewInit() {
    this.pintarAttacker();
    this.pintarDefensor();
  }
  ngAfterViewChecked(){
    this.pintarAttacker();
    this.pintarDefensor();
    this.attDice=this.attacker.nativeElement.querySelectorAll<HTMLElement>(".dice");
    this.defDice=this.defender.nativeElement.querySelectorAll<HTMLElement>(".dice");
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
  diceRoll(attackerResults: number[], defenderResults: number[]){
    this.showResult(this.attDice, attackerResults);
    this.showResult(this.defDice, defenderResults);
  };
  private showResult(el:NodeListOf<HTMLElement>, result:number[]){
    for(var i=0; i<el.length; i++){
      el[i].classList.remove("rotation");
      el[i].classList.add(this.class[result[i]-1]);
    }
  }
  actualizarDaus(){
    this.resetDaus(this.attDice);
    this.resetDaus(this.defDice);
  }
  private resetDaus(el:NodeListOf<HTMLElement>){
    el.forEach( (e) =>{
      e.className='';
      e.classList.add('dice','rotation')
    })
  }
}
