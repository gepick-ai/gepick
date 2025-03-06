export class User {
  constructor(
    public id: string,
    public name: string,
    public avatarUrl: string,
    public chatLimit: number,
    public chatUsed: number,
    public omikujiLimit: number,
    public omikujiUsed: number,
    public wallpaperLimit: number,
    public wallpaperUsed: number,
  ) { }
}
