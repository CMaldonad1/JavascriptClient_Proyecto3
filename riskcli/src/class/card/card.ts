export class Card {
  constructor(
    public _country: string = "",
    public _img: string=""
  ){}
  set country(country:string){
    this._country=country;
  }
  set img(img:string){
    this._img=img;
  }
  get country(){
    return this._country;
  }
  get img(){
    return this._img;
  }
}
