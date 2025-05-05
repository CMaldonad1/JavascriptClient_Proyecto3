export class User {
  constructor(
    public _id: number=-999,
    public _nom: string = "",
    public _color: string =""
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
  set nom(nom:string){
    this._nom=nom;
  }
  set id(id:number){
    this._id=id;
  }
  set color(color:string){
    this._color=color;
  }
}
