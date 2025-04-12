import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit, ɵɵdeferEnableTimerScheduling } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgClass, CommonModule,FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent{
  title = 'sudoku';

  solver: boolean = false;
  board: number[][] = [];
  uboard: number[][] = [];
  errorFlags: boolean[][] = [];
  nonEditable:number[][]=[];

  selectedRow: number = -1;
  selectedCol: number = -1;

  win:boolean=false;
  difficulty:number=2;

  minutes:number=0;
  seconds:number=0;
  totalSeconds:number=0;
  timerSubscription :Subscription | null = null;

  startTimer(){
    if(!this.timerSubscription){
      this.timerSubscription = interval(1000).subscribe(()=>{
        this.totalSeconds++;
        this.updateTimeDisplay();
      })
    }
  }

  stopTimer(){
    this.timerSubscription?.unsubscribe();
    this.timerSubscription=null;
    this.totalSeconds=0;
  }
  updateTimeDisplay(){
    this.minutes=Math.floor(this.totalSeconds/60);
    this.seconds=this.totalSeconds%60;
  }
  clickSolver(): void {
    this.solver = !this.solver;
    this.play();
  }

  newGame(){
    this.play();
  }
  play(){
    if(this.solver){
      this.setBoard();
    }else{
      this.generateSudoku();
      this.stopTimer();
      this.startTimer();
    }
  }

  difficultyChange(){
    this.difficulty=Number(this.difficulty);
    this.play();
  }

  setBoard(): void {
    this.board = Array(9).fill(0).map(() => Array(9).fill(0));
    this.uboard = Array(9).fill(0).map(() => Array(9).fill(0));
    this.errorFlags = Array(9).fill(false).map(() => Array(9).fill(false));
    this.nonEditable=[];
    this.win=false;
  }

  setBoardColor(r: number, c: number): boolean {
    return (
      (r >= 0 && r <= 2 && c >= 3 && c <= 5) ||
      (r >= 3 && r <= 5 && (c <= 2 || c >= 6)) ||
      (r >= 6 && r <= 8 && c >= 3 && c <= 5)
    );
  }


  checkBoxNumbers(res: number[], x: number): boolean {
    return !res.includes(x);
  }


  boxLimits(v: number): number {
    return Math.floor(v / 3) * 3;
  }

  checkRow(b: number[][], x: number, r: number): boolean {
    return !b[r].includes(x);
  }

  checkCol(b: number[][], x: number, c: number): boolean {
    for (let i = 0; i < 9; i++) {
      if (b[i][c] === x) return false;
    }
    return true;
  }

  giveBoxNumbers(l: number[]): number[] {
    let res: number[] = [];
    for (let i = 1; i <= 9; i++) {
      if (!l.includes(i)) res.push(i);
    }
    return res;
  }

  boxNumbers(b: number[][], row: number, col: number): number[] {
    const res: number[] = [];
    const sti = this.boxLimits(row);
    const stj = this.boxLimits(col);
    for (let i = sti; i < sti + 3; i++) {
      for (let j = stj; j < stj + 3; j++) {
        if (b[i][j] !== 0) res.push(b[i][j]);
      }
    }
    return res;
  }

  shuffle(b: number[]): number[] {
    for (let i = b.length - 1; i > 0; i--) {
      const randidx = Math.floor(Math.random() * (i + 1));
      [b[i], b[randidx]] = [b[randidx], b[i]];
    }
    return b;
  }


  sudoku(b: number[][], r: number, c: number): boolean {
    if (r === 9) return true;
    if (c === 9) return this.sudoku(b, r + 1, 0);

    if (b[r][c] !== 0) return this.sudoku(b, r, c + 1);

    let t = this.giveBoxNumbers(this.boxNumbers(b, r, c));
    let boxvalues = this.shuffle(t);
    for (let x of boxvalues) {
      if (this.checkRow(b, x, r) && this.checkCol(b, x, c)) {
        b[r][c] = x;
        if (this.sudoku(b, r, c + 1)) return true;
        b[r][c] = 0;
      }
    }
    return false;
  }

  generateSudoku(): void {
    this.setBoard();
    if (this.sudoku(this.board, 0, 0)) {
      let tough:number=0;
      switch(this.difficulty){
        case 1:
          tough=20;
          break;
        case 2:
          tough=16;
          break;
        case 3:
          tough=12;
          break;
      }
      while(tough--){
        while(true){
          let r=Math.floor(Math.random()*9);
          let c=Math.floor(Math.random()*9);
          if(this.uboard[r][c]!==0) continue;
          this.uboard[r][c]=this.board[r][c];
          this.uboard[8-r][8-c]=this.board[8-r][8-c];
          this.nonEditable.push([r,c]);
          this.nonEditable.push([8-r,8-c]);
          break;
        }
      }
    }
  }


  isEditable(r:number,c:number):boolean{
    let v=this.nonEditable.find(([x,y])=>{
      return (x==r && y==c);
    });
    if(v===undefined){
      return false;
    }
    return true;
  }
  isFull(b:number[][]):boolean{
    for(let i=0;i<9;i++){
      if(b[i].includes(0)) return false;
    }
    return true;
  }

  isWin() : boolean{
    for(let i=0;i<9;i++){
      if(this.errorFlags[i].includes(true))return false;
    }
    return true;
  }

  selectCell(r: number, c: number): void {
    this.selectedCol=c;
    this.selectedRow=r;
  }

  placeNumber(num: number): void{
    if (this.selectedRow !== -1 && this.selectedCol !== -1){
      if(!this.solver){
        const inRow = !this.checkRow(this.uboard, num, this.selectedRow);
        const inCol = !this.checkCol(this.uboard, num, this.selectedCol);
        const inBox = this.checkBoxNumbers(this.giveBoxNumbers(this.boxNumbers(this.uboard, this.selectedRow,this.selectedCol)),num);

        this.errorFlags[this.selectedRow][this.selectedCol] = inRow || inCol || inBox;
      }
      this.uboard[this.selectedRow][this.selectedCol] = num ;
      this.selectedRow=-1;
      this.selectedCol=-1;

      if(!this.solver){
        if(this.isFull(this.uboard)){
          if(this.isWin()){
            this.stopTimer();
            this.win=true;
            setTimeout(() => {
              this.play();
            }, 2000);
          }
        }
      }
    }
  }

  solveClick(){
    if(!this.sudoku(this.uboard,0,0)){
      alert("No solutions For this Board");
    };
  }
  ngOnInit(): void {
    this.play();
  }
}
