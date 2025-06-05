const webcam = document.getElementById('webcam'),
      combinedImage = document.getElementById('finalImage'),
      ctx = combinedImage.getContext('2d'),
      zoomSlider = document.getElementById('zoomSlider'),
      zoomNumber = document.getElementById('zoomNumber'),
      webcamContainer = document.getElementById('webcamContainer');
let deviceNumber = 0,
    zoomValue = 1,
    videoDevices = [],
    colorFilter = true,
    blank = true,
    previousWidth;

// Makes list of Camera Devices
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    videoDevices = devices.filter(device => device.kind === 'videoinput');
    if (videoDevices.length > 0) { toggleCamera(); }
  })
  .catch(error => {
    console.error('Error accessing devices:', error);
  });

// Handles Zooming
window.addEventListener('resize', setZoom, true);
function setZoom() {

  zoomValue = Number(zoomSlider.value);
  zoomNumber.innerText = `${zoomValue.toFixed(1)}x`;
  webcam.style.transform = `scale(${zoomValue})`;

  webcamContainer.style.width = `${webcam.clientWidth-1}px`;
  webcamContainer.style.height = `${webcam.clientHeight-1}px`;

}

// Makes focus/blur work how I want
zoomSlider.addEventListener('touchstart', () => zoomSlider.focus());
zoomSlider.addEventListener('touchend', () => zoomSlider.blur());
zoomSlider.addEventListener('mouseup', () => zoomSlider.blur());
// Shows/hides Number based off focus/blur
zoomSlider.addEventListener('focus', () => zoomNumber.style.display = "block");
zoomSlider.addEventListener('blur', () => zoomNumber.style.display = "none");

function toggleCamera() {

  zoomSlider.value = 1;
  blank = true;
  
  if (webcam.srcObject) {
    webcam.srcObject.getTracks().forEach(track => track.stop());
  }

  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ 
      video: { deviceId: videoDevices[deviceNumber].deviceId }
    })
      .then(function (stream) {
        webcam.srcObject = stream;
        webcam.addEventListener("loadedmetadata", () => {
          setZoom();
          captureImage(null);
        });
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

// Handles turning on/off the "vColor Filter"
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

// Produces Uncombined Images and Final Image
function captureImage(color) {

  // If the canvas is blank or if Camera resolution changes, then initializes certain things
  if (blank && (previousWidth != webcam.videoWidth)) {
    combinedImage.width = webcam.videoWidth;
    combinedImage.height = webcam.videoHeight;

    ctx.fillRect(0, 0, combinedImage.width, combinedImage.height);

    if (!color) {
      ctx.clearRect(0, 0, combinedImage.width, combinedImage.height);
    } else {
      blank = false;
    }

    const combinedImageData = ctx.getImageData(0, 0, combinedImage.width, combinedImage.height);
    ctx.putImageData(combinedImageData, 0, 0);

    for (let i=0; i < 3; i++) {
      const currentImage = document.getElementsByClassName('uncombinedImage')[i];
      currentImage.getContext('2d').clearRect(0, 0, webcam.videoWidth, webcam.videoHeight);
      currentImage.height = webcam.videoHeight;
      currentImage.width = webcam.videoWidth;
    }

  }

  previousWidth = webcam.videoWidth;

  const colorCanvas = document.getElementById(`${color}Image`),
        colorCtx = colorCanvas.getContext('2d'),
  // Calculates stuff for temporary canvas
        cropWidth = webcam.videoWidth / zoomValue,
        cropHeight = webcam.videoHeight / zoomValue,
        cropX = (webcam.videoWidth - cropWidth) / 2,
        cropY = (webcam.videoHeight - cropHeight) / 2;

  // Create a temporary canvas for cropping
  const tempCanvas = document.createElement("canvas"),
        tempCtx = tempCanvas.getContext("2d");

  tempCanvas.width = cropWidth;
  tempCanvas.height = cropHeight;

  // Draw the cropped portion onto the temporary canvas
  tempCtx.drawImage(webcam, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  // Resize the final canvas back to original dimensions
  colorCanvas.width = webcam.videoWidth;
  colorCanvas.height = webcam.videoHeight;

  // Draw the resized image onto the final canvas and sets up Canvases for next step
  colorCtx.drawImage(tempCanvas, 0, 0, webcam.videoWidth, webcam.videoHeight);

  const imageData = colorCtx.getImageData(0, 0, colorCanvas.width, colorCanvas.height),
        combinedImageData = ctx.getImageData(0, 0, combinedImage.width, combinedImage.height),
        colorPixels = imageData.data,
        pixels = combinedImageData.data;

  // For Each Pixel, does work to create uncombined images and final image
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

  // Draws Images
  ctx.putImageData(combinedImageData, 0, 0);
  colorCtx.putImageData(imageData, 0, 0);

}

// Function for downloading final image
function downloadImage() {

  const data = combinedImage.toDataURL("image/jpeg"),
        link = document.createElement('a');
  
  link.href = data;
  link.download = 'combinedImage.jpeg';
  link.click();

}
