import { Card } from "../card/card";

export class User {
  constructor(
    public _nom: string = "",
    public _id: number=-999,
    public _token: string= "",
    public _color: string ="",
    public _turn: boolean =false,
    public _tropas: number=0,
    public _cartas: Card []=[]
  ){}

  static fromJSON(obj: any): User {
    return new User(
      obj._nom,
      obj._id,
      obj._token,
      obj._color,
      obj._turn,
      obj._tropas
    );
  }

  toJSON(): any {
    return {
      _nom: this._nom,
      _id: this._id,
      _token: this._token,
      _color: this._color,
      _turn: this._turn,
      _tropas: this._tropas,
      _cartas: this._cartas
    };
  }

  get nom(): string{
    return this._nom;
  }
  get token(): string{
    return this._token;
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
  set token(token:string){
    this._token=token;
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
