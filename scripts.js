const webcam = document.getElementById('webcam'),
      combinedImage = document.getElementById('finalImage'),
      ctx = combinedImage.getContext('2d');

let videoDevices = [];
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    videoDevices = devices.filter(device => device.kind === 'videoinput');
    if (videoDevices.length > 0) { toggleCamera(); }
  })
  .catch(error => {
    console.error('Error accessing devices:', error);
  });

let deviceNumber = 0;

function toggleCamera() {

  if (webcam.srcObject) {
    webcam.srcObject.getTracks().forEach(track => track.stop());
  }

  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ 
      video: { deviceId: videoDevices[deviceNumber].deviceId }
    })
      .then(function (stream) {
        webcam.srcObject = stream;
      })
      .catch(function (err0r) {
        console.log("Something went wrong!");
      });
  }

  if (videoDevices.length <= 1) {
    document.getElementById('toggleCameraButton').style.display = "none";
  } else {
    if (deviceNumber < videoDevices.length - 1) {
      deviceNumber +=1;
    } else {
      deviceNumber = 0;
    }

  }

}

let colorFilter = true;
function vColorFilter() {
  const button = document.getElementById('options');
  if (button.innerText === "Toggle Off vColor Filter") {
    button.innerText = "Toggle On vColor Filter";
    colorFilter = false;
    webcam.style.filter = "grayscale(100%)";
  } else {
    button.innerText = "Toggle Off vColor Filter";
    colorFilter = true;
    webcam.style.filter = "none";
  }
}

let blank = true;
function captureImage(color) {
  if (blank) {
    combinedImage.width = webcam.videoWidth;
    combinedImage.height = webcam.videoHeight;

    ctx.fillRect(0, 0, combinedImage.width, combinedImage.height);
    const combinedImageData = ctx.getImageData(0, 0, combinedImage.width, combinedImage.height);
    ctx.putImageData(combinedImageData, 0, 0);
    blank = false;
  }

  const colorCanvas = document.getElementById(`${color}Image`);
  const colorCtx = colorCanvas.getContext('2d');

  colorCanvas.width = webcam.videoWidth;
  colorCanvas.height = webcam.videoHeight;

  colorCtx.drawImage(webcam, 0 , 0, colorCanvas.width, colorCanvas.height);

  const imageData = colorCtx.getImageData(0, 0, colorCanvas.width, colorCanvas.height);
  const combinedImageData = ctx.getImageData(0, 0, combinedImage.width, combinedImage.height);
  const colorPixels = imageData.data;
  const pixels = combinedImageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    let bWPixel = (colorPixels[i]+colorPixels[i+1]+colorPixels[i+2])/3;
    switch(color) {
      case 'red':
        if (colorFilter) {
          pixels[i] = colorPixels[i];
        } else {
          colorPixels[i] = bWPixel;
          pixels[i] = bWPixel;
        }
        colorPixels[i+1] = 0;
        colorPixels[i+2] = 0;
        break;
      case 'green':
        if (colorFilter) {
          pixels[i+1] = colorPixels[i+1];
        } else {
          colorPixels[i+1] = bWPixel;
          pixels[i+1] = bWPixel;
        }
        colorPixels[i] = 0;
        colorPixels[i+2] = 0;
        break;
      case 'blue':
        if (colorFilter) {
          pixels[i+2] = colorPixels[i+2];
        } else {
          colorPixels[i+2] = bWPixel;
          pixels[i+2] = bWPixel;
        }
        colorPixels[i] = 0;
        colorPixels[i+1] = 0;
        break;
    }

  }

  ctx.putImageData(combinedImageData, 0, 0);
  colorCtx.putImageData(imageData, 0, 0);

}

function downloadImage() {

  const data = combinedImage.toDataURL("image/jpeg"),
        link = document.createElement('a');
  
  link.href = data;
  link.download = 'combinedImage.jpeg';
  link.click();

}
