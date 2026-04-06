function changeImage(imageSrc) {
      console.log("Changing image to:", imageSrc); // Debugging line
      var mainImage = document.getElementById('main-image');
      if (mainImage) {
          mainImage.src = imageSrc;
      } else {
          console.error("Main image element not found");
      }
  }

document.addEventListener('DOMContentLoaded', function () {
  

  var color1 = document.getElementById('color1');
  var color2 = document.getElementById('color2');
  var color3 = document.getElementById('color3');

  if (color1) {
      color1.addEventListener('click', function () {
          changeImage('Images/t-shirt.jpg');
      });
  } else {
      console.error("Color 1 element not found");
  }

  if (color2) {
      color2.addEventListener('click', function () {
          changeImage('Images/tshirt1-orangebg.jpg');
      });
  } else {
      console.error("Color 2 element not found");
  }

  if (color3) {
      color3.addEventListener('click', function () {
          changeImage('Images/white-galaxy-t.jpg');
      });
  } else {
      console.error("Color 3 element not found");
  }
});


/*
const x = document.getElementById

document.addEventListener('DOMContentLoaded', function() {
  function changeImage(imagePath) {
      console.log("Changing image to:", imagePath); // Debugging line
      var productImage = document.getElementById('productImage');
      if (productImage) {
          productImage.src = imagePath;
      } else {
          console.error("Main image element not found");
      }
  }

  const colorRadios = document.querySelectorAll('input[name="color"]'); // Select all radio buttons
  colorRadios.forEach(radio => {
      radio.addEventListener('click', function() {
          changeImage(this.value);
      });
  });
});

const textInput = document.getElementById("text-input");
const checkButton = document.getElementById("check-btn");
const result = document.getElementById("result");

checkButton.addEventListener("click", () => {
  if(textInput.value === "") {
    alert("Please input a value")
  }
})
*/