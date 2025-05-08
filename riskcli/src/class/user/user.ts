export class User {
  constructor(
    public _id: number=-999,
    public _nom: string = "",
    public _color: string ="",
    public _turn: boolean =false,
    public _tropas: number=0
  ){}
  get nom(): string{
    return this._nom;
  }
  get id(): number{
    return this._id;
  }
  get color(): string{
    return this._color;
  }
  get turn(): boolean{
    return this._turn;
  }
  get tropas(): number{
    return this._tropas;
  }
  set nom(nom:string){
    this._nom=nom;
  }
  set id(id:number){
    this._id=id;
  }
  set color(color:string){
    this._color=color;
  }
  set turn(turn:boolean){
    this._turn=turn;
  }
  set tropas(tropas:number){
    this._tropas=tropas;
  }
}
