export class Sala {
  constructor(
    public _id: number=-9,
    public _date: Date= new Date(),
    public _nom: string="",
    public _max_players: number=6,
    public _admin_id: number=0,
    public _connected: number=0
  ){}
  get id():number{
    return this._id;
  }
  get date():Date{
    return this._date;
  }
  get nom():string{
    return this._nom;
  }
  get max_players(): number{
    return this._max_players;
  }
  get admin_id():number{
    return this._admin_id;
  }
  get connected(): number{
    return this._connected;
  }
  set id(id: number){
    this._id=id;
  }
  set date(date: Date){
    this._date=date;
  }
  set nom(nom: string){
    this._nom=nom;
  }
  set max_players(max_players: number){
    this._max_players=max_players;
  }
  set admin_id(admin_id:number){
    this._admin_id=admin_id;
  }
  set connected(connected: number){
    this._connected=connected;
  }
}
