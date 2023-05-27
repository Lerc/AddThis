
class Rectangle {
  height = 0;
  width;
  constructor(height, width) {
	this.height = height;  
	this.width = width;
  }

  area() {
	return width * height;
  }	

  get altArea() {
    return width*height;
  }
  grow(dx,dy=dx) {
	width+=dx;
	height+=dy;
  }
}

