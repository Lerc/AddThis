class PlacedRectangle extends Rectangle {
   left = 0;
   top = 0;

  constructor (left,top,width,height) {
	super(width,height)
	this.left=left;
	this.top=top;
   }	

   grow(dx,dy=dx) {
	width+=dx;
	height+=dy;  // a comment
	
	left-=dx/2;
	this.top-=dy/2;
  
   }

  volume(depth) {
    console.log(altArea)
    return area()*depth;
    
  } 
}


